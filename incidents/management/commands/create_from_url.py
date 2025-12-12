import re
import ssl
import urllib.request

import certifi
from django.db.models import Q
from django.core.management.base import BaseCommand

from incidents.models import Incident
from incidents.serializers import IncidentSerializer
from ppg_incidents.ai_communication import ai_communicator
from ppg_incidents.bhpa_parser import parse_bhpa_formal_html, parse_bhpa_html
from ppg_incidents.downloader import get_webpage_content
from ppg_incidents.vector_store import upsert_embedding

USPPA_LIST_PATTERN = re.compile(r"^https?://usppa\.org/incidents/(\?.*)?$")
USPPA_ENTRY_PATTERN = re.compile(r"https://usppa\.org/incidents/entry/\d+")
BHPA_LIST_PATTERN = re.compile(r"^https?://(?:www\.)?bhpa\.co\.uk/safety/incidents/")
BHPA_FORMAL_LIST_PATTERN = re.compile(r"^https?://(?:www\.)?bhpa\.co\.uk/safety/investigations/")


class Command(BaseCommand):
    help = "Create an incident from a URL using LLM"

    def add_arguments(self, parser):
        parser.add_argument("url", type=str, help="URL to incident report")
        parser.add_argument("--model", type=str, default="claude-sonnet-4-5-20250929", help="Model to use")
        parser.add_argument("--force", action="store_true", help="Skip duplicate check")

    def handle(self, *args, **options):
        url = options["url"]
        model = options["model"]

        if USPPA_LIST_PATTERN.match(url):
            self.handle_usppa_list(url, model, options["force"])
        elif BHPA_FORMAL_LIST_PATTERN.match(url):
            self.handle_bhpa_formal_list(url, model, options["force"])
        elif BHPA_LIST_PATTERN.match(url):
            self.handle_bhpa_list(url, model, options["force"])
        else:
            self.process_single_url(url, model, options["force"])

    def handle_usppa_list(self, url, model, force):
        self.stdout.write(f"Detected USPPA incidents list page: {url}")
        self.stdout.write("Fetching incident links...")

        ssl_context = ssl.create_default_context(cafile=certifi.where())
        request = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        )
        with urllib.request.urlopen(request, timeout=30, context=ssl_context) as response:
            html = response.read().decode("utf-8")

        incident_urls = list(set(USPPA_ENTRY_PATTERN.findall(html)))
        incident_urls.sort()

        self.stdout.write(f"Found {len(incident_urls)} incident links")

        for i, incident_url in enumerate(incident_urls, 1):
            self.stdout.write(f"\n[{i}/{len(incident_urls)}] {incident_url}")
            self.process_single_url(incident_url, model, force, auto_skip=True)

    def handle_bhpa_formal_list(self, url, model, force):
        self.stdout.write(f"Detected BHPA formal investigations page: {url}")
        self.stdout.write("Fetching and parsing incidents...")

        ssl_context = ssl.create_default_context(cafile=certifi.where())
        request = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        )
        with urllib.request.urlopen(request, timeout=30, context=ssl_context) as response:
            html = response.read().decode("utf-8")

        incidents = parse_bhpa_formal_html(html)
        self.stdout.write(f"Found {len(incidents)} PPG incidents on page")

        for i, bhpa_incident in enumerate(incidents, 1):
            self.stdout.write(f"\n[{i}/{len(incidents)}] {bhpa_incident.date} - {bhpa_incident.title}")

            incident_date = bhpa_incident.get_date_iso()

            if not force:
                duplicates = Incident.all_objects.filter(
                    date=incident_date,
                    country="United Kingdom"
                )
                if duplicates.exists():
                    self.stdout.write(self.style.WARNING(f"Duplicate found (date={incident_date}, country=United Kingdom)"))
                    self.stdout.write("Skipped.")
                    continue

            self.stdout.write(f"Downloading PDF: {bhpa_incident.pdf_url}")
            pdf_content = get_webpage_content(bhpa_incident.pdf_url)

            ai_text = f"BHPA Formal Investigation Report:\nDate: {bhpa_incident.date}\nTitle: {bhpa_incident.title}\nCountry: United Kingdom\n\nReport content:\n{pdf_content}"
            self.stdout.write(f"Sending to AI (content length: {len(ai_text)} chars)")

            messages = [{"role": "user", "content": ai_text}]
            incident_data = {}

            result = ai_communicator.incident_chat(messages, incident_data, model=model)
            incident_data.update(result.get("incident_data", {}))

            self.stdout.write(f"\nAI response: {result.get('response')}")
            self.stdout.write(f"\nExtracted data: {incident_data}")

            incident_data["verified"] = False
            serializer = IncidentSerializer(data=incident_data)
            serializer.is_valid(raise_exception=True)
            incident = serializer.save()

            embedding = ai_communicator.get_embedding(incident.to_text())
            upsert_embedding(incident.id, embedding)

            self.stdout.write(self.style.SUCCESS(f"Created incident: {incident.uuid}"))

    def handle_bhpa_list(self, url, model, force):
        self.stdout.write(f"Detected BHPA incidents list page: {url}")
        self.stdout.write("Fetching and parsing incidents...")

        ssl_context = ssl.create_default_context(cafile=certifi.where())
        request = urllib.request.Request(
            url,
            headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
        )
        with urllib.request.urlopen(request, timeout=30, context=ssl_context) as response:
            html = response.read().decode("utf-8")

        incidents = parse_bhpa_html(html)
        self.stdout.write(f"Found {len(incidents)} incidents on page")

        for i, bhpa_incident in enumerate(incidents, 1):
            self.stdout.write(f"\n[{i}/{len(incidents)}] {bhpa_incident.date} - {bhpa_incident.city}")

            incident_date = bhpa_incident.get_date_iso()
            normalized_country = bhpa_incident.get_normalized_country()

            if not force:
                duplicates = Incident.all_objects.filter(
                    date=incident_date,
                    country=normalized_country
                )
                if duplicates.exists():
                    self.stdout.write(self.style.WARNING(f"Duplicate found (date={incident_date}, country={normalized_country})"))
                    self.stdout.write("Skipped.")
                    continue

            ai_text = bhpa_incident.to_ai_text()
            self.stdout.write(f"Sending to AI:\n{ai_text}")

            messages = [{"role": "user", "content": ai_text}]
            incident_data = {}

            result = ai_communicator.incident_chat(messages, incident_data, model=model)
            incident_data.update(result.get("incident_data", {}))

            self.stdout.write(f"\nAI response: {result.get('response')}")
            self.stdout.write(f"\nExtracted data: {incident_data}")

            incident_data["verified"] = False
            serializer = IncidentSerializer(data=incident_data)
            serializer.is_valid(raise_exception=True)
            incident = serializer.save()

            embedding = ai_communicator.get_embedding(incident.to_text())
            upsert_embedding(incident.id, embedding)

            self.stdout.write(self.style.SUCCESS(f"Created incident: {incident.uuid}"))

    def process_single_url(self, url, model, force, auto_skip=False):
        duplicates = Incident.all_objects.filter(
            Q(source_links__icontains=url) | Q(media_links__icontains=url)
        )
        if duplicates.exists() and not force:
            self.stdout.write(self.style.WARNING(f"URL already used in {duplicates.count()} incident(s)"))
            if auto_skip:
                self.stdout.write("Skipped.")
                return
            confirm = input("Continue anyway? [y/N]: ")
            if confirm.lower() != "y":
                self.stdout.write("Skipped.")
                return

        self.stdout.write(f"Processing URL: {url}")

        messages = [{"role": "user", "content": url}]
        incident_data = {}

        result = ai_communicator.incident_chat(messages, incident_data, model=model)

        incident_data.update(result.get("incident_data", {}))

        self.stdout.write(f"\nAI response: {result.get('response')}")
        self.stdout.write(f"\nExtracted data: {incident_data}")

        incident_data["verified"] = False
        serializer = IncidentSerializer(data=incident_data)
        serializer.is_valid(raise_exception=True)
        incident = serializer.save()

        embedding = ai_communicator.get_embedding(incident.to_text())
        upsert_embedding(incident.id, embedding)

        self.stdout.write(self.style.SUCCESS(f"Created incident: {incident.uuid}"))

