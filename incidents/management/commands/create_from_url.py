from django.db.models import Q
from django.core.management.base import BaseCommand

from incidents.models import Incident
from incidents.serializers import IncidentSerializer
from ppg_incidents.ai_communication import ai_communicator
from ppg_incidents.vector_store import upsert_embedding


class Command(BaseCommand):
    help = "Create an incident from a URL using LLM"

    def add_arguments(self, parser):
        parser.add_argument("url", type=str, help="URL to incident report")
        parser.add_argument("--model", type=str, default="claude-sonnet-4-5-20250929", help="Model to use")
        parser.add_argument("--force", action="store_true", help="Skip duplicate check")

    def handle(self, *args, **options):
        url = options["url"]
        model = options["model"]

        duplicates = Incident.all_objects.filter(
            Q(source_links__icontains=url) | Q(media_links__icontains=url)
        )
        if duplicates.exists() and not options["force"]:
            self.stdout.write(self.style.WARNING(f"URL already used in {duplicates.count()} incident(s):"))
            for inc in duplicates:
                self.stdout.write(f"  - {inc.uuid}: {inc.title}")
            confirm = input("Continue anyway? [y/N]: ")
            if confirm.lower() != "y":
                self.stdout.write("Aborted.")
                return

        self.stdout.write(f"Processing URL: {url}")
        self.stdout.write(f"Using model: {model}")

        messages = [{"role": "user", "content": url}]
        incident_data = {}

        result = ai_communicator.incident_chat(messages, incident_data, model=model)

        incident_data.update(result.get("incident_data", {}))
        messages = result.get("messages", messages)

        self.stdout.write(f"\nAI response: {result.get('response')}")
        self.stdout.write(f"\nExtracted data: {incident_data}")

        incident_data["verified"] = False
        serializer = IncidentSerializer(data=incident_data)
        serializer.is_valid(raise_exception=True)
        incident = serializer.save()

        embedding = ai_communicator.get_embedding(incident.to_text())
        upsert_embedding(incident.id, embedding)

        self.stdout.write(self.style.SUCCESS(f"\nCreated incident: {incident.uuid}"))

