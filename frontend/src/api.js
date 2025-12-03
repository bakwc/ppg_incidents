const API_BASE = '/api';

export async function fetchIncidents() {
  const response = await fetch(`${API_BASE}/incidents`);
  return response.json();
}

export async function fetchIncident(uuid) {
  const response = await fetch(`${API_BASE}/incident/${uuid}`);
  return response.json();
}

export async function createIncident(incidentData) {
  const response = await fetch(`${API_BASE}/incident/save`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ incident_data: incidentData }),
  });
  return response.json();
}

export async function updateIncident(uuid, incidentData) {
  const response = await fetch(`${API_BASE}/incident/${uuid}/update`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ incident_data: incidentData }),
  });
  return response.json();
}

