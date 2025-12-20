const API_BASE = '/api';

let accessToken = localStorage.getItem('access_token');
let refreshToken = localStorage.getItem('refresh_token');

async function refreshAccessToken() {
  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({refresh: refreshToken})
  });
  
  if (response.ok) {
    const data = await response.json();
    accessToken = data.access;
    localStorage.setItem('access_token', data.access);
    if (data.refresh) {
      refreshToken = data.refresh;
      localStorage.setItem('refresh_token', data.refresh);
    }
    return true;
  }
  
  logout();
  return false;
}

async function apiCall(url, options = {}) {
  options.headers = {
    ...options.headers,
    'Content-Type': 'application/json',
  };
  
  if (accessToken) {
    options.headers['Authorization'] = `Bearer ${accessToken}`;
  }
  
  let response = await fetch(`${API_BASE}${url}`, options);
  
  if (response.status === 401 && refreshToken) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      options.headers['Authorization'] = `Bearer ${accessToken}`;
      response = await fetch(`${API_BASE}${url}`, options);
    }
  }
  
  return response;
}

export async function login(username, password) {
  const response = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username, password})
  });
  
  if (response.ok) {
    const data = await response.json();
    accessToken = data.access;
    refreshToken = data.refresh;
    localStorage.setItem('access_token', data.access);
    localStorage.setItem('refresh_token', data.refresh);
    localStorage.setItem('user', JSON.stringify(data.user));
    return data.user;
  }
  
  throw new Error('Invalid credentials');
}

export function logout() {
  accessToken = null;
  refreshToken = null;
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  localStorage.removeItem('user');
  window.location.href = '/';
}

export async function getCurrentUser() {
  const response = await apiCall('/auth/me');
  if (response.ok) {
    return await response.json();
  }
  return null;
}

export async function fetchIncidents(searchQuery = null, filters = {}, page = 1) {
  const params = new URLSearchParams();
  if (searchQuery) {
    params.set('text_search', searchQuery);
  }
  params.set('page', page);
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.set(key, value);
    }
  });
  const response = await fetch(`${API_BASE}/incidents?${params}`);
  return response.json();
}

export async function fetchIncident(uuid) {
  const response = await fetch(`${API_BASE}/incident/${uuid}`);
  return response.json();
}

export async function createIncident(incidentData) {
  const response = await apiCall('/incident/save', {
    method: 'POST',
    body: JSON.stringify({ incident_data: incidentData }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function updateIncident(uuid, incidentData) {
  const response = await apiCall(`/incident/${uuid}/update`, {
    method: 'PUT',
    body: JSON.stringify({ incident_data: incidentData }),
  });
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || `HTTP ${response.status}`);
  }
  return response.json();
}

export async function chatWithAI(messages, incidentData) {
  const response = await apiCall('/incident/chat', {
    method: 'POST',
    body: JSON.stringify({ messages, incident_data: incidentData }),
  });
  return response.json();
}

export async function checkDuplicate(incidentData, excludeUuid = null) {
  const response = await apiCall('/incident/check_duplicate', {
    method: 'POST',
    body: JSON.stringify({ incident_data: incidentData, exclude_uuid: excludeUuid }),
  });
  return response.json();
}

export async function deleteIncident(uuid) {
  const response = await apiCall(`/incident/${uuid}/delete`, {
    method: 'DELETE',
  });
  return response.json();
}

export async function fetchDashboardStats(filterPacks) {
  const response = await apiCall('/dashboard_stats', {
    method: 'POST',
    body: JSON.stringify({ filter_packs: filterPacks }),
  });
  return response.json();
}

export async function fetchUnverifiedIncidents() {
  const response = await fetch(`${API_BASE}/incidents/unverified`);
  return response.json();
}

export async function fetchCountries() {
  const response = await fetch(`${API_BASE}/countries`);
  return response.json();
}

export async function fetchCountryStats(include, exclude, limit = 10) {
  const response = await apiCall('/country_stats', {
    method: 'POST',
    body: JSON.stringify({ include, exclude, limit }),
  });
  return response.json();
}

export async function fetchYearStats(include, exclude) {
  const response = await apiCall('/year_stats', {
    method: 'POST',
    body: JSON.stringify({ include, exclude }),
  });
  return response.json();
}

export async function fetchIncidentDrafts(uuid) {
  const response = await fetch(`${API_BASE}/incident/${uuid}/drafts`);
  return response.json();
}

export async function fetchWindSpeedPercentile(include, exclude, percentile = 40) {
  const response = await apiCall('/wind_speed_percentile', {
    method: 'POST',
    body: JSON.stringify({ include, exclude, percentile }),
  });
  return response.json();
}

export async function exportIncidentsCSV(searchQuery = null, filters = {}) {
  const params = new URLSearchParams();
  if (searchQuery) {
    params.set('text_search', searchQuery);
  }
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== null && value !== undefined && value !== '') {
      params.set(key, value);
    }
  });
  const response = await apiCall(`/incidents/csv?${params}`);
  return response.blob();
}

