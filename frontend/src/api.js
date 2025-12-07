const API_BASE = '/api';

export async function fetchIncidents(searchQuery = null, filters = {}) {
  const params = new URLSearchParams();
  if (searchQuery) {
    params.set('semantic_search', searchQuery);
  }
  // Add all filters to params
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.set(key, value);
    }
  });
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
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
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
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
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

export async function deleteIncident(uuid) {
  const response = await fetch(`${API_BASE}/incident/${uuid}/delete`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function fetchDashboardStats(filterPacks) {
  const response = await fetch(`${API_BASE}/dashboard_stats`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ filter_packs: filterPacks }),
  });
  return response.json();
}

export async function fetchUnverifiedIncidents() {
  const response = await fetch(`${API_BASE}/incidents/unverified`);
  return response.json();
}

