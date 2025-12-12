import hashlib
import re
from dataclasses import dataclass
from datetime import datetime

from bs4 import BeautifulSoup

COUNTRY_NORMALIZATION = {
    "UK": "United Kingdom",
}


@dataclass
class BHPAIncident:
    date: str
    pilot_info: str
    location: str
    city: str
    country: str
    wind_strength: str
    conditions: str
    wing_type: str
    wing_manufacturer: str
    wing_model: str
    launch_type: str
    engine: str
    summary: str
    injury: str
    injury_details: str

    def get_normalized_country(self) -> str:
        return COUNTRY_NORMALIZATION.get(self.country, self.country)

    def get_date_iso(self) -> str:
        parsed = datetime.strptime(self.date, "%d.%m.%Y")
        return parsed.strftime("%Y-%m-%d")

    def to_ai_text(self) -> str:
        parts = [
            "BHPA Incident Report:",
            f"Date: {self.date}",
            f"Location: {self.city}, {self.country}",
        ]
        if self.pilot_info:
            parts.append(f"Pilot: {self.pilot_info}")
        if self.wing_manufacturer or self.wing_model:
            wing_parts = []
            if self.wing_manufacturer:
                wing_parts.append(self.wing_manufacturer)
            if self.wing_model:
                wing_parts.append(self.wing_model)
            if self.launch_type:
                wing_parts.append(f"{self.launch_type} launch")
            if self.engine:
                wing_parts.append(self.engine)
            parts.append(f"Wing: {', '.join(wing_parts)}")
        if self.wind_strength or self.conditions:
            weather_parts = []
            if self.wind_strength:
                weather_parts.append(self.wind_strength)
            if self.conditions:
                weather_parts.append(self.conditions)
            parts.append(f"Wind/Conditions: {', '.join(weather_parts)}")
        if self.summary:
            parts.append(f"Summary: {self.summary}")
        if self.injury:
            injury_text = self.injury
            if self.injury_details:
                injury_text += f" ({self.injury_details})"
            parts.append(f"Injury: {injury_text}")
        return "\n".join(parts)


def _extract_text_after_label(cell_text: str, label: str) -> str:
    if label not in cell_text:
        return ""
    parts = cell_text.split(label, 1)
    if len(parts) < 2:
        return ""
    after = parts[1].strip()
    next_bold_match = re.search(r'\n[A-Z][a-z]+ ?[A-Z]?[a-z]*:', after)
    if next_bold_match:
        after = after[:next_bold_match.start()]
    return after.strip().replace("\n", " ").strip()


def _clean_cell_text(cell) -> str:
    for br in cell.find_all("br"):
        br.replace_with("\n")
    return cell.get_text(separator=" ").strip()


def parse_bhpa_html(html: str) -> list[BHPAIncident]:
    soup = BeautifulSoup(html, "html.parser")
    table = soup.find("table", id="tbl_fit2")
    if not table:
        return []

    incidents = []
    rows = table.find_all("tr", class_=["tr1", "tr2"])

    for row in rows:
        cells = row.find_all("td", class_="td_collapse")
        if len(cells) < 6:
            continue

        date_cell = _clean_cell_text(cells[0])
        pilot_cell = _clean_cell_text(cells[1])
        location_cell = _clean_cell_text(cells[2])
        wing_cell = _clean_cell_text(cells[3])
        summary_cell = _clean_cell_text(cells[4])
        injury_cell = _clean_cell_text(cells[5])

        date_match = re.search(r"(\d{2}\.\d{2}\.\d{4})", date_cell)
        date = date_match.group(1) if date_match else ""

        pilot_parts = []
        pilot_text = pilot_cell.replace("Pilot", "").strip()
        gender_match = re.match(r"(Male|Female)", pilot_text)
        if gender_match:
            pilot_parts.append(gender_match.group(1))
        age = _extract_text_after_label(pilot_cell, "Age:")
        if age:
            pilot_parts.append(f"Age {age}")
        rating = _extract_text_after_label(pilot_cell, "Rating:")
        if rating:
            pilot_parts.append(f"Rating: {rating}")
        experience = _extract_text_after_label(pilot_cell, "Flying Experience:")
        if experience:
            pilot_parts.append(f"Experience: {experience}")
        pilot_info = ", ".join(pilot_parts)

        location_text = location_cell.replace("Location", "").strip()
        location_lines = [l.strip() for l in location_text.split("\n") if l.strip()]
        city = ""
        country = ""
        for i, line in enumerate(location_lines):
            if line in ("UK",) or line in COUNTRY_NORMALIZATION:
                country = line
                city = ", ".join(location_lines[:i])
                break
            if ":" in line:
                city = ", ".join(location_lines[:i])
                break
        if not country:
            for line in location_lines:
                if line in ("UK",) or line in COUNTRY_NORMALIZATION:
                    country = line
                    break
        wind_strength = _extract_text_after_label(location_cell, "Wind Strength:")
        conditions = _extract_text_after_label(location_cell, "Conditions:")

        wing_text = wing_cell.replace("Wing Type", "").strip()
        wing_type_match = re.match(r"(Powered PG|Powered HG|Paraglider)", wing_text)
        wing_type = wing_type_match.group(1) if wing_type_match else ""
        wing_info = _extract_text_after_label(wing_cell, "Wing:")
        wing_parts = wing_info.split() if wing_info else []
        wing_manufacturer = wing_parts[0] if wing_parts else ""
        wing_model = " ".join(wing_parts[1:]) if len(wing_parts) > 1 else ""
        launch_type = _extract_text_after_label(wing_cell, "Launch Type:")
        engine = _extract_text_after_label(wing_cell, "Engine:")

        summary_text = summary_cell.replace("Summary", "").strip()

        injury_text = injury_cell.replace("Injury", "").strip()
        injury_lines = [l.strip() for l in injury_text.split("\n") if l.strip()]
        injury_level = ""
        injury_details = ""
        for line in injury_lines:
            if "Pilot:" in line:
                injury_level = line.replace("Pilot:", "").strip()
            elif line.startswith("_") or (injury_level and line not in ("Unknown",)):
                injury_details = line.strip("_").strip()
        if not injury_level and injury_lines:
            injury_level = injury_lines[0] if injury_lines[0] != "Unknown" else "Unknown"

        incidents.append(BHPAIncident(
            date=date,
            pilot_info=pilot_info,
            location=location_text,
            city=city,
            country=country,
            wind_strength=wind_strength,
            conditions=conditions,
            wing_type=wing_type,
            wing_manufacturer=wing_manufacturer,
            wing_model=wing_model,
            launch_type=launch_type,
            engine=engine,
            summary=summary_text,
            injury=injury_level,
            injury_details=injury_details,
        ))

    return incidents

