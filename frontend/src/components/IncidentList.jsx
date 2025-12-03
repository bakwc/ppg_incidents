import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchIncidents } from '../api';

const severityColors = {
  fatal: 'bg-red-500/20 text-red-300 border-red-500/30',
  serious: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  minor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

const flightPhaseIcons = {
  takeoff: '🛫',
  landing: '🛬',
  flight: '✈️',
};

function IncidentList() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents().then(data => {
      setIncidents(data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="font-display text-4xl text-gradient mb-2">
              PPG Incidents
            </h1>
            <p className="text-slate-400 text-lg">
              Paramotor incident tracking database
            </p>
          </div>
          <Link
            to="/create"
            className="group relative px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl font-semibold text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:-translate-y-0.5"
          >
            <span className="flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Incident
            </span>
          </Link>
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Incidents grid */}
        {!loading && incidents.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🪂</div>
            <h2 className="text-2xl font-semibold text-slate-300 mb-2">No incidents yet</h2>
            <p className="text-slate-500">Create your first incident report to get started</p>
          </div>
        )}

        {!loading && incidents.length > 0 && (
          <div className="grid gap-4">
            {incidents.map((incident) => (
              <div
                key={incident.uuid}
                className="group relative bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-2xl p-6 hover:bg-slate-800/70 hover:border-slate-600/50 transition-all duration-300"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title & Date row */}
                    <div className="flex items-center gap-4 mb-3">
                      {incident.severity && (
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${severityColors[incident.severity] || 'bg-slate-600/20 text-slate-400 border-slate-600/30'}`}>
                          {incident.severity.toUpperCase()}
                        </span>
                      )}
                      {incident.date && (
                        <span className="text-slate-400 text-sm font-medium">
                          {new Date(incident.date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </span>
                      )}
                      {incident.flight_phase && (
                        <span className="text-lg" title={incident.flight_phase}>
                          {flightPhaseIcons[incident.flight_phase]}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-semibold text-white mb-2 truncate">
                      {incident.title || 'Untitled Incident'}
                    </h3>

                    {/* Location */}
                    {(incident.country || incident.city_or_site) && (
                      <p className="text-slate-400 flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {[incident.city_or_site, incident.country].filter(Boolean).join(', ')}
                      </p>
                    )}

                    {/* Summary */}
                    {incident.summary && (
                      <p className="text-slate-500 text-sm line-clamp-2">
                        {incident.summary}
                      </p>
                    )}

                    {/* Equipment badges */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      {incident.wing_manufacturer && (
                        <span className="px-2.5 py-1 bg-slate-700/50 text-slate-300 rounded-lg text-xs">
                          🪂 {incident.wing_manufacturer} {incident.wing_model || ''}
                        </span>
                      )}
                      {incident.paramotor_frame && (
                        <span className="px-2.5 py-1 bg-slate-700/50 text-slate-300 rounded-lg text-xs">
                          ⚙️ {incident.paramotor_frame}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Edit button */}
                  <Link
                    to={`/edit/${incident.uuid}`}
                    className="flex-shrink-0 p-3 rounded-xl bg-slate-700/50 text-slate-400 hover:bg-orange-500/20 hover:text-orange-400 transition-all duration-200"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default IncidentList;

