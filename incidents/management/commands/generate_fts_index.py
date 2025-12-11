from django.core.management.base import BaseCommand

from incidents.models import Incident
from ppg_incidents.fts_store import init_fts_table, upsert_fts, get_indexed_incident_ids


class Command(BaseCommand):
    help = "Generate FTS5 index for all incidents"

    def handle(self, *args, **options):
        init_fts_table()

        indexed_ids = get_indexed_incident_ids()
        incidents = Incident.all_objects.all()

        created = 0
        updated = 0

        for incident in incidents:
            upsert_fts(incident.id, incident.to_text())
            if incident.id in indexed_ids:
                updated += 1
            else:
                created += 1

        self.stdout.write(f"Created {created} FTS entries, updated {updated}")

