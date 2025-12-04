from django.core.management.base import BaseCommand

from incidents.models import Incident


class Command(BaseCommand):
    help = "Show incident to_text output by UUID"

    def add_arguments(self, parser):
        parser.add_argument("uuid", type=str, help="Incident UUID")

    def handle(self, *args, **options):
        incident = Incident.objects.get(uuid=options["uuid"])
        self.stdout.write(incident.to_text())

