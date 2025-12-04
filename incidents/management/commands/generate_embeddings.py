from django.core.management.base import BaseCommand

from incidents.models import Incident
from ppg_incidents.ai_communication import ai_communicator
from ppg_incidents.vector_store import get_embedded_incident_ids, init_vector_table, upsert_embedding


class Command(BaseCommand):
    help = "Generate embeddings for incidents"

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true", help="Regenerate all embeddings")

    def handle(self, *args, **options):
        init_vector_table()

        existing_ids = get_embedded_incident_ids()
        incidents = Incident.objects.all()

        if options["force"]:
            to_process = list(incidents)
        else:
            to_process = [i for i in incidents if i.id not in existing_ids]

        total = len(to_process)
        skipped = incidents.count() - total

        if skipped > 0:
            self.stdout.write(f"Skipping {skipped} incidents with existing embeddings")

        self.stdout.write(f"Generating embeddings for {total} incidents...")

        for i, incident in enumerate(to_process, 1):
            embedding = ai_communicator.get_embedding(incident.to_text())
            upsert_embedding(incident.id, embedding)
            self.stdout.write(f"[{i}/{total}] {incident}")

        self.stdout.write(self.style.SUCCESS(f"Done. Generated {total} embeddings."))

