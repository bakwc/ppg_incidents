import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { fetchIncidents, fetchCountries } from '../api';

const severityColors = {
  fatal: 'bg-red-500/20 text-red-300 border-red-500/30',
  serious: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  minor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

const flightPhaseIcons = {
  ground: '🚶',
  takeoff: '🛫',
  landing: '🛬',
  flight: '✈️',
};

const COUNTRY_TO_CODE = {
  'Afghanistan': 'AF', 'Albania': 'AL', 'Algeria': 'DZ', 'Argentina': 'AR',
  'Australia': 'AU', 'Austria': 'AT', 'Belgium': 'BE', 'Brazil': 'BR',
  'Bulgaria': 'BG', 'Canada': 'CA', 'Chile': 'CL', 'China': 'CN',
  'Colombia': 'CO', 'Croatia': 'HR', 'Czech Republic': 'CZ', 'Czechia': 'CZ',
  'Denmark': 'DK', 'Egypt': 'EG', 'Estonia': 'EE', 'Finland': 'FI',
  'France': 'FR', 'Germany': 'DE', 'Greece': 'GR', 'Hungary': 'HU',
  'Iceland': 'IS', 'India': 'IN', 'Indonesia': 'ID', 'Ireland': 'IE',
  'Israel': 'IL', 'Italy': 'IT', 'Japan': 'JP', 'Kenya': 'KE',
  'Latvia': 'LV', 'Lithuania': 'LT', 'Luxembourg': 'LU', 'Malaysia': 'MY',
  'Mexico': 'MX', 'Morocco': 'MA', 'Netherlands': 'NL', 'New Zealand': 'NZ',
  'Norway': 'NO', 'Pakistan': 'PK', 'Peru': 'PE', 'Philippines': 'PH',
  'Poland': 'PL', 'Portugal': 'PT', 'Romania': 'RO', 'Russia': 'RU',
  'Saudi Arabia': 'SA', 'Serbia': 'RS', 'Singapore': 'SG', 'Slovakia': 'SK',
  'Slovenia': 'SI', 'South Africa': 'ZA', 'South Korea': 'KR', 'Spain': 'ES',
  'Sweden': 'SE', 'Switzerland': 'CH', 'Taiwan': 'TW', 'Thailand': 'TH',
  'Turkey': 'TR', 'Ukraine': 'UA', 'United Arab Emirates': 'AE',
  'United Kingdom': 'GB', 'United States': 'US', 'USA': 'US', 'UK': 'GB',
  'Venezuela': 'VE', 'Vietnam': 'VN',
};

const getCountryFlag = (countryName) => {
  if (!countryName) return null;
  const code = COUNTRY_TO_CODE[countryName];
  if (!code) return null;
  return String.fromCodePoint(...[...code].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
};

const SELECT_FILTERS = [
  {
    key: 'severity',
    label: 'Severity',
    options: [
      { value: 'fatal', label: 'Fatal' },
      { value: 'serious', label: 'Serious' },
      { value: 'minor', label: 'Minor' },
    ],
  },
  {
    key: 'flight_phase',
    label: 'Flight Phase',
    options: [
      { value: 'ground', label: 'Ground' },
      { value: 'takeoff', label: 'Takeoff' },
      { value: 'landing', label: 'Landing' },
      { value: 'flight', label: 'Flight' },
    ],
  },
  {
    key: 'paramotor_type',
    label: 'Paramotor Type',
    options: [
      { value: 'footlaunch', label: 'Footlaunch' },
      { value: 'trike', label: 'Trike' },
    ],
  },
  {
    key: 'reserve_use',
    label: 'Reserve Use',
    options: [
      { value: 'not_installed', label: 'Not installed' },
      { value: 'not_deployed', label: 'Not deployed' },
      { value: 'no_time', label: 'No time to open' },
      { value: 'tangled', label: 'Became tangled' },
      { value: 'partially_opened', label: 'Partially opened' },
      { value: 'fully_opened', label: 'Fully opened' },
    ],
  },
  {
    key: 'pilot_actions',
    label: 'Pilot Actions',
    options: [
      { value: 'wrong_input_triggered', label: 'Wrong input triggered' },
      { value: 'mostly_wrong', label: 'Mostly wrong' },
      { value: 'mixed', label: 'Mixed' },
      { value: 'mostly_correct', label: 'Mostly correct' },
    ],
  },
  {
    key: 'cause_confidence',
    label: 'Cause Confidence',
    options: [
      { value: 'maximum', label: 'Maximum' },
      { value: 'high', label: 'High' },
      { value: 'low', label: 'Low' },
      { value: 'minimal', label: 'Minimal' },
    ],
  },
  {
    key: 'factor_accelerator',
    label: 'Accelerator',
    options: [
      { value: 'not_used', label: 'Not used' },
      { value: 'released', label: 'Released' },
      { value: 'partially_engaged', label: 'Partially engaged' },
      { value: 'fully_engaged', label: 'Fully engaged' },
    ],
  },
  {
    key: 'factor_trimmer_position',
    label: 'Trimmer Position',
    options: [
      { value: 'closed', label: 'Closed' },
      { value: 'partially_open', label: 'Partially open' },
      { value: 'fully_open', label: 'Fully open' },
    ],
  },
  {
    key: 'factor_mid_air_collision',
    label: 'Mid-air Collision',
    options: [
      { value: 'fly_nearby', label: 'Fly nearby' },
      { value: 'got_in_wake_turbulence', label: 'Wake turbulence' },
      { value: 'almost_collided', label: 'Almost collided' },
      { value: 'collided', label: 'Collided' },
    ],
  },
  {
    key: 'primary_cause',
    label: 'Primary Cause',
    options: [
      { value: 'turbulence', label: 'Turbulence' },
      { value: 'wrong_control_input', label: 'Wrong control input' },
      { value: 'hardware_failure', label: 'Hardware failure' },
      { value: 'powerline_collision', label: 'Powerline collision' },
      { value: 'midair_collision', label: 'Midair collision' },
      { value: 'lines_brakes_issues', label: 'Lines & Brakes issues' },
      { value: 'water_landing', label: 'Water landing' },
      { value: 'preflight_error', label: 'Preflight Error' },
      { value: 'ground_starting', label: 'Ground Starting' },
      { value: 'ground_object_collision', label: 'Ground Object Collision / Near Miss' },
    ],
  },
];

const BOOLEAN_FILTERS = [
  { key: 'potentially_fatal', label: 'Potentially fatal' },
  { key: 'hardware_failure', label: 'Hardware failure' },
  { key: 'bad_hardware_preflight', label: 'Bad hardware preflight' },
  { key: 'factor_low_altitude', label: 'Low altitude' },
  { key: 'factor_maneuvers', label: 'Maneuvers' },
  { key: 'factor_thermal_weather', label: 'Thermal weather' },
  { key: 'factor_rain', label: 'Rain' },
  { key: 'factor_rotor_turbulence', label: 'Rotor turbulence' },
  { key: 'factor_wake_turbulence', label: 'Wake turbulence' },
  { key: 'factor_turbulent_conditions', label: 'Turbulent conditions' },
  { key: 'factor_reflex_profile', label: 'Reflex profile' },
  { key: 'factor_tree_collision', label: 'Tree collision' },
  { key: 'factor_water_landing', label: 'Water landing' },
  { key: 'factor_powerline_collision', label: 'Powerline collision' },
  { key: 'factor_ground_starting', label: 'Ground starting' },
  { key: 'factor_spiral_maneuver', label: 'Spiral maneuver' },
  { key: 'factor_helmet_missing', label: 'Helmet missing' },
  { key: 'factor_ground_object_collision', label: 'Ground object collision' },
];

const COLLAPSE_FILTERS = [
  { key: 'collapse', label: 'Collapse' },
  { key: 'stall', label: 'Stall' },
  { key: 'spin', label: 'Spin' },
  { key: 'line_twist', label: 'Line twist' },
  { key: 'unknown_collapse', label: 'Unknown collapse' },
];

function getHighlightedFragment(textContent, query, contextChars = 150) {
  if (!textContent || !query) return null;
  
  const lowerText = textContent.toLowerCase();
  const lowerQuery = query.toLowerCase();
  const matchIndex = lowerText.indexOf(lowerQuery);
  
  if (matchIndex === -1) return null;
  
  const start = Math.max(0, matchIndex - contextChars);
  const end = Math.min(textContent.length, matchIndex + query.length + contextChars);
  
  const before = textContent.slice(start, matchIndex);
  const match = textContent.slice(matchIndex, matchIndex + query.length);
  const after = textContent.slice(matchIndex + query.length, end);
  
  const prefix = start > 0 ? '...' : '';
  const suffix = end < textContent.length ? '...' : '';
  
  return { prefix, before, match, after, suffix };
}

function IncidentList() {
  const [searchParams] = useSearchParams();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [filtersExpanded, setFiltersExpanded] = useState(false);
  const [filterMode, setFilterMode] = useState('include'); // 'include' or 'exclude'
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [countries, setCountries] = useState([]);
  const [activeFilters, setActiveFilters] = useState(() => {
    const filters = [];
    for (const [key, value] of searchParams.entries()) {
      const isExclude = key.startsWith('exclude_');
      const actualKey = isExclude ? key.replace('exclude_', '') : key;
      const values = value.split(',');
      for (const v of values) {
        filters.push({
          key: actualKey,
          value: v === 'true' ? null : v,
          label: v === 'true' ? actualKey : v,
          categoryLabel: actualKey,
          exclude: isExclude
        });
      }
    }
    return filters;
  });

  const buildFilters = () => {
    const result = {};
    activeFilters.forEach(f => {
      const key = f.exclude ? `exclude_${f.key}` : f.key;
      const val = f.value || 'true';
      if (result[key]) {
        result[key] = result[key] + ',' + val;
      } else {
        result[key] = val;
      }
    });
    return result;
  };

  useEffect(() => {
    fetchCountries().then(setCountries);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchIncidents(searchQuery || null, buildFilters(), currentPage).then(data => {
      setIncidents(data.results);
      setTotalCount(data.count);
      setTotalPages(Math.ceil(data.count / 15));
      setLoading(false);
    });
  }, [searchQuery, activeFilters, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, activeFilters]);

  const isFilterActive = (key, value = null) => {
    return activeFilters.some(f => f.key === key && f.value === value && f.exclude === (filterMode === 'exclude'));
  };

  const toggleFilter = (key, value, label, categoryLabel) => {
    const exclude = filterMode === 'exclude';
    const existingIndex = activeFilters.findIndex(f => f.key === key && f.value === value && f.exclude === exclude);
    
    if (existingIndex >= 0) {
      setActiveFilters(activeFilters.filter((_, i) => i !== existingIndex));
    } else {
      setActiveFilters([...activeFilters, { key, value, label, categoryLabel, exclude }]);
      setFiltersExpanded(false);
    }
  };

  const removeFilter = (index) => {
    setActiveFilters(activeFilters.filter((_, i) => i !== index));
  };

  const clearAllFilters = () => {
    setActiveFilters([]);
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
          <div className="flex items-center gap-3">
            <Link
              to="/dashboard"
              className="px-5 py-3 bg-slate-800/70 hover:bg-slate-700 border border-slate-700/50 rounded-xl font-medium text-slate-300 transition-all"
            >
              📊 Dashboard
            </Link>
            <Link
              to="/unverified"
              className="px-5 py-3 bg-slate-800/70 hover:bg-slate-700 border border-amber-500/50 rounded-xl font-medium text-amber-400 transition-all"
            >
              📝 Unverified Incidents
            </Link>
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
                placeholder="Search incidents..."
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

        {/* Active filter tags */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {activeFilters.map((f, index) => (
              <span
                key={index}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium ${
                  f.exclude
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                }`}
              >
                <span className="text-xs opacity-70">{f.exclude ? '−' : '+'}</span>
                {f.categoryLabel}: {f.label}
                <button
                  type="button"
                  onClick={() => removeFilter(index)}
                  className="ml-1 hover:opacity-70"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={clearAllFilters}
              className="text-sm text-slate-500 hover:text-red-400 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}

        {/* Filter buttons + expandable panel */}
        <div className="mb-8">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                if (filtersExpanded && filterMode === 'include') {
                  setFiltersExpanded(false);
                } else {
                  setFilterMode('include');
                  setFiltersExpanded(true);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                filtersExpanded && filterMode === 'include'
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="text-sm">+</span>
              <span>Include filter</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (filtersExpanded && filterMode === 'exclude') {
                  setFiltersExpanded(false);
                } else {
                  setFilterMode('exclude');
                  setFiltersExpanded(true);
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                filtersExpanded && filterMode === 'exclude'
                  ? 'bg-red-500/20 border border-red-500/30 text-red-400'
                  : 'bg-slate-800/50 border border-slate-700/50 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <span className="text-sm">−</span>
              <span>Exclude filter</span>
            </button>
          </div>

          {filtersExpanded && (
            <div className={`mt-4 p-6 border rounded-2xl ${
              filterMode === 'include'
                ? 'bg-emerald-500/5 border-emerald-500/20'
                : 'bg-red-500/5 border-red-500/20'
            }`}>

              {/* Country Filter */}
              {countries.length > 0 && (
                <div className="mb-6">
                  <label className="block text-xs text-slate-500 mb-1.5">Country</label>
                  <div className="flex flex-wrap gap-1.5">
                    {countries.map(c => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleFilter('country', c, c, 'Country')}
                        className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                          isFilterActive('country', c)
                            ? filterMode === 'include'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700'
                        }`}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Select Filters */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
                {SELECT_FILTERS.map(filter => (
                  <div key={filter.key}>
                    <label className="block text-xs text-slate-500 mb-1.5">{filter.label}</label>
                    <div className="flex flex-wrap gap-1.5">
                      {filter.options.map(opt => (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => toggleFilter(filter.key, opt.value, opt.label, filter.label)}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                            isFilterActive(filter.key, opt.value)
                              ? filterMode === 'include'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-red-500/20 text-red-400 border border-red-500/30'
                              : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700'
                          }`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Collapse Filters */}
              <div className="mb-6">
                <label className="block text-xs text-slate-500 mb-2">Collapse Events</label>
                <div className="flex flex-wrap gap-2">
                  {COLLAPSE_FILTERS.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleFilter(key, null, label, 'Collapse')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        isFilterActive(key, null)
                          ? filterMode === 'include'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Boolean Filters */}
              <div>
                <label className="block text-xs text-slate-500 mb-2">Factors</label>
                <div className="flex flex-wrap gap-2">
                  {BOOLEAN_FILTERS.map(({ key, label }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => toggleFilter(key, null, label, 'Factor')}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        isFilterActive(key, null)
                          ? filterMode === 'include'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-700'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
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
            {totalCount} incident{totalCount !== 1 ? 's' : ''} (page {currentPage} of {totalPages})
          </p>
        )}

        {/* Incidents grid */}
        {!loading && incidents.length === 0 && (
          <div className="text-center py-24">
            <div className="text-6xl mb-4">🪂</div>
            <h2 className="text-2xl font-semibold text-slate-300 mb-2">No incidents found</h2>
            <p className="text-slate-500">Try adjusting your filters or search query</p>
          </div>
        )}

        {!loading && incidents.length > 0 && (
          <>
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
                            {incident.severity === 'fatal' ? '⚠️ ' : ''}{incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)}
                          </span>
                        )}
                        {incident.potentially_fatal && incident.severity !== 'fatal' && (
                          <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-red-500/10 text-red-400 border-red-500/30">
                            ⚠️ Potentially Fatal
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
                          {getCountryFlag(incident.country) ? (
                            <span className="mr-1">{getCountryFlag(incident.country)}</span>
                          ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                          {[incident.city_or_site, incident.country].filter(Boolean).join(', ')}
                        </p>
                      )}

                      {/* Summary or Search match highlight */}
                      {(() => {
                        if (searchQuery && incident.text_content) {
                          const fragment = getHighlightedFragment(incident.text_content, searchQuery);
                          if (fragment) {
                            return (
                              <p className="text-slate-500 text-sm">
                                {fragment.prefix}
                                {fragment.before}
                                <mark className="bg-orange-500/40 text-orange-300 px-0.5 rounded">
                                  {fragment.match}
                                </mark>
                                {fragment.after}
                                {fragment.suffix}
                              </p>
                            );
                          }
                        }
                        if (incident.summary) {
                          return (
                            <p className="text-slate-500 text-sm line-clamp-2">
                              {incident.summary}
                            </p>
                          );
                        }
                        return null;
                      })()}

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

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-8">
                <button
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-400 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  ««
                </button>
                <button
                  onClick={() => setCurrentPage(p => p - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-400 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  «
                </button>
                
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        currentPage === pageNum
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-800/50 border border-slate-700/50 text-slate-400 hover:bg-slate-700'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-400 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  »
                </button>
                <button
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-2 bg-slate-800/50 border border-slate-700/50 rounded-lg text-slate-400 hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  »»
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default IncidentList;
