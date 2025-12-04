const API_BASE = '/api';

export async function fetchIncidents(searchQuery = null) {
  const params = new URLSearchParams();
  if (searchQuery) {
    params.set('semantic_search', searchQuery);
  }
  const url = params.toString() ? `${API_BASE}/incidents?${params}` : `${API_BASE}/incidents`;
  const response = await fetch(url);
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

export async function chatWithAI(messages, incidentData) {
  const response = await fetch(`${API_BASE}/incident/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ messages, incident_data: incidentData }),
  });
  return response.json();
}

export async function checkDuplicate(incidentData, excludeUuid = null) {
  const response = await fetch(`${API_BASE}/incident/check_duplicate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ incident_data: incidentData, exclude_uuid: excludeUuid }),
  });
  return response.json();
}

