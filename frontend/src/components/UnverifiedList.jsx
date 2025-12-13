import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { fetchUnverifiedIncidents } from '../api';

function UnverifiedList() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUnverifiedIncidents().then(data => {
      setIncidents(data);
      setLoading(false);
    });
  }, []);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <h1 className="font-display text-3xl text-gradient">Unverified Incidents</h1>
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-sm font-medium">
            {incidents.length} draft{incidents.length !== 1 ? 's' : ''}
          </span>
        </div>

        {/* List */}
        {incidents.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">✨</div>
            <p className="text-slate-400">No unverified incidents</p>
          </div>
        ) : (
          <div className="space-y-3">
            {incidents.map(incident => (
              <Link
                key={incident.uuid}
                to={`/edit/${incident.uuid}`}
                className="block bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-xl p-4 hover:border-amber-500/50 hover:bg-slate-800/50 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-medium truncate">
                      {incident.title || 'Untitled incident'}
                    </h3>
                    {incident.summary && (
                      <p className="text-slate-400 text-sm mt-1 line-clamp-2">{incident.summary}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      {incident.country && <span>{incident.country}</span>}
                      {incident.date && <span>{incident.date}</span>}
                      {incident.severity && (
                        <span className={`px-2 py-0.5 rounded ${
                          incident.severity === 'fatal' ? 'bg-red-500/20 text-red-400' :
                          incident.severity === 'serious' ? 'bg-orange-500/20 text-orange-400' :
                          'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {incident.severity}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs text-slate-500">Submitted</div>
                    <div className="text-sm text-slate-400">{formatDate(incident.created_at)}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default UnverifiedList;

