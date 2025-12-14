from unittest.mock import patch

import pytest
from django.contrib.auth.models import User
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

    response = client.get("/api/incidents")
    assert response.status_code == 200
    assert len(response.json()) == 3

    response = client.get(f"/api/incident/{incident2.uuid}")
    assert response.status_code == 200
    data = response.json()
    assert data["title"] == "Engine failure"
    assert data["country"] == "France"
    assert data["severity"] == "minor"


@pytest.mark.django_db
def test_incident_chat_flow():
    client = APIClient()

    mock_response = {
        "response": "I've recorded the incident. The wing collapse happened in Spain with serious injuries.",
        "incident_data": {
            "title": "Wing collapse near Valencia",
            "country": "Spain",
            "city_or_site": "Valencia",
            "severity": "serious",
            "description": "Pilot experienced a wing collapse during flight",
        }
    }

    with patch("incidents.views.ai_communicator.incident_chat", return_value=mock_response):
        response = client.post(
            "/api/incident/chat",
            data={
                "messages": [{"role": "user", "content": "A pilot had a wing collapse in Valencia, Spain. Serious injuries."}],
                "incident_data": None,
            },
            format="json",
        )

    assert response.status_code == 200
    data = response.json()
    assert data["response"] == mock_response["response"]
    assert data["incident_data"]["title"] == "Wing collapse near Valencia"
    assert data["saved"] is False

    response = client.post(
        "/api/incident/save",
        data={"incident_data": data["incident_data"]},
        format="json",
    )

    assert response.status_code == 200
    assert response.json()["saved"] is True

    incident = Incident.objects.get(title="Wing collapse near Valencia")
    assert incident.country == "Spain"
    assert incident.severity == "serious"


@pytest.mark.django_db
def test_non_admin_cannot_delete_incident():
    client = APIClient()

    incident = Incident.objects.create(
        title="Test incident",
        country="Spain",
        severity="minor",
    )

    non_admin_user = User.objects.create_user(username="regular", password="test123")
    admin_user = User.objects.create_user(username="admin", password="admin123", is_staff=True)

    response = client.delete(f"/api/incident/{incident.uuid}/delete")
    assert response.status_code == 401

    client.force_authenticate(user=non_admin_user)
    response = client.delete(f"/api/incident/{incident.uuid}/delete")
    assert response.status_code == 403

    client.force_authenticate(user=admin_user)
    response = client.delete(f"/api/incident/{incident.uuid}/delete")
    assert response.status_code == 200
    assert response.json()["deleted"] is True
