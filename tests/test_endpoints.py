import pytest
from rest_framework.test import APIClient

from incidents.models import Incident


@pytest.mark.django_db
def test_incidents_endpoints():
    client = APIClient()

    incident1 = Incident.objects.create(
        title="Wing collapse",
        country="Spain",
        severity="serious",
    )
    incident2 = Incident.objects.create(
        title="Engine failure",
        country="France",
        severity="minor",
    )
    incident3 = Incident.objects.create(
        title="Fatal crash",
        country="Germany",
        severity="fatal",
    )

    response = client.get("/incidents")
    assert response.status_code == 200
    assert len(response.json()) == 3

    response = client.get(f"/incident/{incident2.uuid}")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Engine failure"
    assert data["country"] == "France"
    assert data["severity"] == "minor"

