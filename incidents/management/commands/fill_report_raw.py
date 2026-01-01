from django.core.management.base import BaseCommand

from incidents.models import Incident
from ppg_incidents.ai_communication import get_webpage_content


class Command(BaseCommand):
    help = "Fill report_raw field from source_links"

    def handle(self, *args, **options):
        incidents = Incident.all_objects.filter(
            source_links__isnull=False
        ).exclude(
            source_links=""
        ).filter(
            report_raw__isnull=True
        ) | Incident.all_objects.filter(
            source_links__isnull=False
        ).exclude(
            source_links=""
        ).filter(
            report_raw=""
        )

        total = incidents.count()
        self.stdout.write(f"Found {total} incidents to process")

        for i, incident in enumerate(incidents, 1):
            links = [link.strip() for link in incident.source_links.strip().split("\n") if link.strip()]
            contents = []

            for link in links:
                self.stdout.write(f"[{i}/{total}] Fetching {link}")
                content = get_webpage_content(link)
                contents.append(f"=== {link} ===\n{content}")

            incident.report_raw = "\n\n".join(contents)
            incident.save(update_fields=["report_raw"])
            self.stdout.write(f"[{i}/{total}] Saved {incident}")

        self.stdout.write(self.style.SUCCESS(f"Done. Processed {total} incidents."))

