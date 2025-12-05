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

const SEVERITY_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'fatal', label: 'Fatal' },
  { value: 'serious', label: 'Serious' },
  { value: 'minor', label: 'Minor' },
];

const FLIGHT_PHASE_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'takeoff', label: 'Takeoff' },
  { value: 'landing', label: 'Landing' },
  { value: 'flight', label: 'Flight' },
];

const PARAMOTOR_TYPE_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'footlaunch', label: 'Footlaunch' },
  { value: 'trike', label: 'Trike' },
];

const RESERVE_USE_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'not_deployed', label: 'Not deployed' },
  { value: 'no_time', label: 'No time to open' },
  { value: 'tangled', label: 'Became tangled' },
  { value: 'partially_opened', label: 'Partially opened' },
  { value: 'fully_opened', label: 'Fully opened' },
];

const PILOT_ACTIONS_OPTIONS = [
  { value: '', label: 'Any' },
  { value: 'wrong_input_triggered', label: 'Wrong input triggered' },
  { value: 'mostly_wrong', label: 'Mostly wrong' },
  { value: 'mixed', label: 'Mixed' },
  { value: 'mostly_correct', label: 'Mostly correct' },
];

const BOOLEAN_FILTERS = [
  { key: 'potentially_fatal', label: 'Potentially fatal' },
  { key: 'hardware_failure', label: 'Hardware failure' },
  { key: 'factor_low_altitude', label: 'Low altitude' },
  { key: 'factor_maneuvers', label: 'Maneuvers' },
  { key: 'factor_thermal_weather', label: 'Thermal weather' },
  { key: 'factor_rotor_turbulence', label: 'Rotor turbulence' },
  { key: 'factor_turbulent_conditions', label: 'Turbulent conditions' },
  { key: 'factor_tree_collision', label: 'Tree collision' },
  { key: 'factor_water_landing', label: 'Water landing' },
  { key: 'factor_powerline_collision', label: 'Powerline collision' },
  { key: 'factor_ground_starting', label: 'Ground starting' },
  { key: 'factor_spiral_maneuver', label: 'Spiral maneuver' },
  { key: 'factor_helmet_missing', label: 'Helmet missing' },
];

const COLLAPSE_FILTERS = [
  { key: 'collapse', label: 'Collapse' },
  { key: 'stall', label: 'Stall' },
  { key: 'spin', label: 'Spin' },
  { key: 'line_twist', label: 'Line twist' },
];

const initialFilters = {
  severity: '',
  flight_phase: '',
  paramotor_type: '',
  reserve_use: '',
  pilot_actions: '',
};

function IncidentList() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [booleanFilters, setBooleanFilters] = useState({});
  const [collapseFilters, setCollapseFilters] = useState({});

  const buildFilters = () => {
    const allFilters = { ...filters };
    Object.entries(booleanFilters).forEach(([key, value]) => {
      if (value === true) allFilters[key] = 'true';
    });
    Object.entries(collapseFilters).forEach(([key, value]) => {
      if (value === true) allFilters[key] = 'true';
    });
    return allFilters;
  };

  useEffect(() => {
    setLoading(true);
    fetchIncidents(searchQuery || null, buildFilters()).then(data => {
      setIncidents(data);
      setLoading(false);
    });
  }, [searchQuery, filters, booleanFilters, collapseFilters]);

  const activeFilterCount = () => {
    let count = 0;
    Object.values(filters).forEach(v => { if (v) count++; });
    Object.values(booleanFilters).forEach(v => { if (v) count++; });
    Object.values(collapseFilters).forEach(v => { if (v) count++; });
    return count;
  };

  const clearFilters = () => {
    setFilters(initialFilters);
    setBooleanFilters({});
    setCollapseFilters({});
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearchQuery(searchInput);
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchQuery('');
  };

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

        {/* Search bar */}
        <form onSubmit={handleSearch} className="mb-4">
          <div className="relative flex gap-3">
            <div className="relative flex-1">
              <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Semantic search incidents..."
                className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700/50 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/25 transition-all"
              />
            </div>
            <button
              type="submit"
              className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 border border-slate-600/50 rounded-xl text-slate-300 font-medium transition-all"
            >
              Search
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="px-4 py-3 bg-slate-700/50 hover:bg-red-500/20 border border-slate-600/50 hover:border-red-500/30 rounded-xl text-slate-400 hover:text-red-400 transition-all"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="mt-2 text-sm text-slate-500">
              Showing results for: <span className="text-orange-400">"{searchQuery}"</span>
            </p>
          )}
        </form>

        {/* Expandable Filters */}
        <div className="mb-8">
          <button
            type="button"
            onClick={() => setFiltersExpanded(!filtersExpanded)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800/50 border border-slate-700/50 rounded-xl text-slate-300 hover:bg-slate-800 transition-all"
          >
            <svg className={`w-4 h-4 transition-transform ${filtersExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
            <span>Filters</span>
            {activeFilterCount() > 0 && (
              <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full text-xs font-medium">
                {activeFilterCount()}
              </span>
            )}
          </button>

          {filtersExpanded && (
            <div className="mt-4 p-6 bg-slate-800/30 border border-slate-700/50 rounded-2xl">
              {/* Select Filters */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-6">
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Severity</label>
                  <select
                    value={filters.severity}
                    onChange={(e) => setFilters({ ...filters, severity: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500/50"
                  >
                    {SEVERITY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Flight Phase</label>
                  <select
                    value={filters.flight_phase}
                    onChange={(e) => setFilters({ ...filters, flight_phase: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500/50"
                  >
                    {FLIGHT_PHASE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Paramotor Type</label>
                  <select
                    value={filters.paramotor_type}
                    onChange={(e) => setFilters({ ...filters, paramotor_type: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500/50"
                  >
                    {PARAMOTOR_TYPE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Reserve Use</label>
                  <select
                    value={filters.reserve_use}
                    onChange={(e) => setFilters({ ...filters, reserve_use: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500/50"
                  >
                    {RESERVE_USE_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-1.5">Pilot Actions</label>
                  <select
                    value={filters.pilot_actions}
                    onChange={(e) => setFilters({ ...filters, pilot_actions: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-lg text-sm text-white focus:outline-none focus:border-orange-500/50"
                  >
                    {PILOT_ACTIONS_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Collapse Filters */}
              <div className="mb-6">
                <label className="block text-xs text-slate-500 mb-2">Collapse Events</label>
                <div className="flex flex-wrap gap-2">
                  {COLLAPSE_FILTERS.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setCollapseFilters({ ...collapseFilters, [key]: !collapseFilters[key] })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        collapseFilters[key]
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Boolean Filters */}
              <div className="mb-4">
                <label className="block text-xs text-slate-500 mb-2">Factors</label>
                <div className="flex flex-wrap gap-2">
                  {BOOLEAN_FILTERS.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setBooleanFilters({ ...booleanFilters, [key]: !booleanFilters[key] })}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        booleanFilters[key]
                          ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                          : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {activeFilterCount() > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="px-4 py-2 text-sm text-red-400 hover:text-red-300 transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex items-center justify-center py-24">
            <div className="w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Incident count */}
        {!loading && incidents.length > 0 && (
          <p className="text-slate-500 text-sm mb-4">
            {incidents.length} incident{incidents.length !== 1 ? 's' : ''}
          </p>
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
                    <Link to={`/view/${incident.uuid}`} className="block">
                      <h3 className="text-xl font-semibold text-white mb-2 truncate hover:text-orange-400 transition-colors">
                        {incident.title || 'Untitled Incident'}
                      </h3>
                    </Link>

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
                      {incident.paramotor_type === 'trike' && (
                        <span className="px-2.5 py-1 bg-slate-700/50 text-slate-300 rounded-lg text-xs">
                          🛞 Trike
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

