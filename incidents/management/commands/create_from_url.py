import json
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

    def check_duplicates(self, url):
        api_url = f"https://ppg-incidents.org/api/incidents?text_search={urllib.request.quote(url)}"
        
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        request = urllib.request.Request(
            api_url,
            headers={"User-Agent": "Mozilla/5.0"}
        )
        
        with urllib.request.urlopen(request, timeout=30, context=ssl_context) as response:
            result = json.loads(response.read().decode("utf-8"))
            return result.get("results", [])

    def upload_incident(self, incident_data, model=None, messages=None):
        api_url = "https://ppg-incidents.org/api/incident/save"
        data = json.dumps({"incident_data": incident_data}).encode("utf-8")
        
        ssl_context = ssl.create_default_context(cafile=certifi.where())
        request = urllib.request.Request(
            api_url,
            data=data,
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        
        try:
            with urllib.request.urlopen(request, timeout=30, context=ssl_context) as response:
                result = json.loads(response.read().decode("utf-8"))
                return result.get("incident", {}).get("uuid")
        except urllib.error.HTTPError as e:
            error_response_body = e.read().decode("utf-8")
            self.stdout.write(self.style.ERROR(f"HTTP Error {e.code}: {e.reason}"))
            self.stdout.write(f"Error response: {error_response_body}")
            
            if model and messages is not None:
                self.stdout.write("Sending error back to AI for correction...")
                
                error_message = f"Upload failed with error: {error_response_body}. Please fix the incident_data with valid values."
                retry_messages = messages + [{"role": "assistant", "content": json.dumps({"incident_data": incident_data})}, {"role": "user", "content": error_message}]
                
                result = ai_communicator.incident_chat(retry_messages, incident_data, model=model)
                corrected_data = result.get("incident_data", {})
                
                self.stdout.write(f"AI correction response: {result.get('response')}")
                self.stdout.write(f"Corrected data: {corrected_data}")
                
                # Merge corrected fields with original data
                merged_data = incident_data.copy()
                merged_data.update(corrected_data)
                merged_data["verified"] = False
                
                return self.upload_incident(merged_data, model, messages)
            else:
                raise

    def add_arguments(self, parser):
        parser.add_argument("url", type=str, help="URL to incident report")
        parser.add_argument("--model", type=str, default="claude-sonnet-4-5-20250929", help="Model to use")
        parser.add_argument("--force", action="store_true", help="Skip duplicate check")
        parser.add_argument("--upload", action="store_true", help="Upload to public API instead of local DB")

    def handle(self, *args, **options):
        url = options["url"]
        model = options["model"]
        upload = options["upload"]

        if USPPA_LIST_PATTERN.match(url):
            self.handle_usppa_list(url, model, options["force"], upload)
        elif BHPA_FORMAL_LIST_PATTERN.match(url):
            self.handle_bhpa_formal_list(url, model, options["force"], upload)
        elif BHPA_LIST_PATTERN.match(url):
            self.handle_bhpa_list(url, model, options["force"], upload)
        else:
            self.process_single_url(url, model, options["force"], upload=upload)

    def handle_usppa_list(self, url, model, force, upload):
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
            self.process_single_url(incident_url, model, force, auto_skip=True, upload=upload, check_url=incident_url)

    def handle_bhpa_formal_list(self, url, model, force, upload):
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

            if upload:
                duplicates = self.check_duplicates(bhpa_incident.pdf_url)
                if duplicates and not force:
                    self.stdout.write(self.style.WARNING(f"Duplicate found by PDF URL"))
                    for dup in duplicates:
                        incident_uuid = dup.get("uuid")
                        self.stdout.write(f"  https://ppg-incidents.org/view/{incident_uuid}")
                    self.stdout.write("Skipped.")
                    continue
            else:
                duplicates = Incident.all_objects.filter(
                    date=incident_date,
                    country="United Kingdom"
                )
                if duplicates.exists():
                    existing = duplicates.first()
                    if existing.source_links and existing.report_raw:
                        self.stdout.write(self.style.WARNING(f"Duplicate found with source and report (date={incident_date})"))
                        self.stdout.write(f"  http://localhost:5173/view/{existing.uuid}")
                        self.stdout.write("Skipped.")
                        continue

                    self.stdout.write(self.style.WARNING(f"Duplicate found but missing source/report, updating..."))
                    self.stdout.write(f"  http://localhost:5173/view/{existing.uuid}")
                    self.stdout.write(f"Downloading PDF: {bhpa_incident.pdf_url}")
                    pdf_content = get_webpage_content(bhpa_incident.pdf_url)

                    existing.source_links = bhpa_incident.pdf_url
                    existing.report_raw = pdf_content
                    existing.save()
                    self.stdout.write(self.style.SUCCESS(f"Updated incident: {existing.uuid}"))
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
            incident_data["source_links"] = bhpa_incident.pdf_url
            incident_data["report_raw"] = pdf_content
            
            if upload:
                incident_uuid = self.upload_incident(incident_data, model, messages)
                self.stdout.write(self.style.SUCCESS(f"Uploaded incident: {incident_uuid}"))
            else:
                serializer = IncidentSerializer(data=incident_data)
                serializer.is_valid(raise_exception=True)
                incident = serializer.save()

                embedding = ai_communicator.get_embedding(incident.to_text())
                upsert_embedding(incident.id, embedding)

                self.stdout.write(self.style.SUCCESS(f"Created incident: {incident.uuid}"))

    def handle_bhpa_list(self, url, model, force, upload):
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

            if not force and not upload:
                duplicates = Incident.all_objects.filter(
                    date=incident_date,
                    country=normalized_country
                )
                if duplicates.exists():
                    self.stdout.write(self.style.WARNING(f"Duplicate found (date={incident_date}, country={normalized_country})"))
                    for dup in duplicates:
                        self.stdout.write(f"  http://localhost:5173/view/{dup.uuid}")
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
            
            if upload:
                incident_uuid = self.upload_incident(incident_data, model, messages)
                self.stdout.write(self.style.SUCCESS(f"Uploaded incident: {incident_uuid}"))
            else:
                serializer = IncidentSerializer(data=incident_data)
                serializer.is_valid(raise_exception=True)
                incident = serializer.save()

                embedding = ai_communicator.get_embedding(incident.to_text())
                upsert_embedding(incident.id, embedding)

                self.stdout.write(self.style.SUCCESS(f"Created incident: {incident.uuid}"))

    def process_single_url(self, url, model, force, auto_skip=False, upload=False, check_url=None):
        check_url = check_url or url
        
        if upload:
            duplicates = self.check_duplicates(check_url)
            if duplicates and not force:
                self.stdout.write(self.style.WARNING(f"URL already used in {len(duplicates)} incident(s)"))
                for dup in duplicates:
                    incident_uuid = dup.get("uuid")
                    self.stdout.write(f"  https://ppg-incidents.org/view/{incident_uuid}")
                if auto_skip:
                    self.stdout.write("Skipped.")
                    return
                confirm = input("Continue anyway? [y/N]: ")
                if confirm.lower() != "y":
                    self.stdout.write("Skipped.")
                    return
        else:
            duplicates = Incident.all_objects.filter(
                Q(source_links__icontains=check_url) | Q(media_links__icontains=check_url)
            )
            if duplicates.exists() and not force:
                self.stdout.write(self.style.WARNING(f"URL already used in {duplicates.count()} incident(s)"))
                for dup in duplicates:
                    self.stdout.write(f"  http://localhost:5173/view/{dup.uuid}")
                if auto_skip:
                    self.stdout.write("Skipped.")
                    return
                confirm = input("Continue anyway? [y/N]: ")
                if confirm.lower() != "y":
                    self.stdout.write("Skipped.")
                    return

        self.stdout.write(f"Processing URL: {url}")

        self.stdout.write(f"Downloading webpage content...")
        raw_content = get_webpage_content(url)

        messages = [{"role": "user", "content": url}]
        incident_data = {}

        result = ai_communicator.incident_chat(messages, incident_data, model=model)

        incident_data.update(result.get("incident_data", {}))

        self.stdout.write(f"\nAI response: {result.get('response')}")
        self.stdout.write(f"\nExtracted data: {incident_data}")

        incident_data["verified"] = False
        incident_data["report_raw"] = raw_content
        
        if upload:
            incident_uuid = self.upload_incident(incident_data, model, messages)
            self.stdout.write(self.style.SUCCESS(f"Uploaded incident: {incident_uuid}"))
        else:
            serializer = IncidentSerializer(data=incident_data)
            serializer.is_valid(raise_exception=True)
            incident = serializer.save()

            embedding = ai_communicator.get_embedding(incident.to_text())
            upsert_embedding(incident.id, embedding)

            self.stdout.write(self.style.SUCCESS(f"Created incident: {incident.uuid}"))

