import IncidentView from '@/components/IncidentView';

const API_BASE = 'http://127.0.0.1:8000/api';

async function fetchIncident(uuid: string) {
  const response = await fetch(`${API_BASE}/incident/${uuid}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Failed to fetch incident');
  }
  return response.json();
}

export default async function ViewIncidentPage({ params }: { params: Promise<{ uuid: string }> }) {
  const { uuid } = await params;
  const incident = await fetchIncident(uuid);
  return <IncidentView incident={incident} />;
}

