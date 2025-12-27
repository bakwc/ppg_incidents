import IncidentList from '@/components/IncidentList';

const API_BASE = 'http://127.0.0.1:8000/api';

async function fetchInitialData(searchParams: Record<string, string | string[]>) {
  const params = new URLSearchParams();
  
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      value.forEach(v => params.append(key, v));
    } else {
      params.set(key, value);
    }
  }
  
  if (!params.has('page')) {
    params.set('page', '1');
  }
  
  const incidentsResponse = await fetch(`${API_BASE}/incidents?${params.toString()}`, { cache: 'no-store' });
  const countriesResponse = await fetch(`${API_BASE}/countries`, { cache: 'no-store' });
  
  const incidents = incidentsResponse.ok ? await incidentsResponse.json() : { results: [], count: 0 };
  const countries = countriesResponse.ok ? await countriesResponse.json() : [];
  
  return { incidents, countries };
}

export default async function IncidentsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[]>> }) {
  const params = await searchParams;
  const { incidents, countries } = await fetchInitialData(params);
  return <IncidentList initialIncidents={incidents} initialCountries={countries} />;
}

