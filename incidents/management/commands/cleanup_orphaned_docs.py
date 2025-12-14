from django.core.management.base import BaseCommand

from incidents.models import Incident
from ppg_incidents.fts_store import delete_fts, get_indexed_incident_ids
from ppg_incidents.vector_store import delete_embedding, get_embedded_incident_ids


class Command(BaseCommand):
    help = "Remove orphaned documents from embeddings and FTS indexes"

    def handle(self, *args, **options):
        existing_ids = set(Incident.all_objects.values_list("id", flat=True))

        embedded_ids = get_embedded_incident_ids()
        orphaned_embeddings = embedded_ids - existing_ids
        self.stdout.write(f"Found {len(orphaned_embeddings)} orphaned embeddings")
        for incident_id in orphaned_embeddings:
            delete_embedding(incident_id)
            self.stdout.write(f"Deleted embedding for incident {incident_id}")

        indexed_ids = get_indexed_incident_ids()
        orphaned_fts = indexed_ids - existing_ids
        self.stdout.write(f"Found {len(orphaned_fts)} orphaned FTS entries")
        for incident_id in orphaned_fts:
            delete_fts(incident_id)
            self.stdout.write(f"Deleted FTS entry for incident {incident_id}")

        self.stdout.write(self.style.SUCCESS("Done."))

