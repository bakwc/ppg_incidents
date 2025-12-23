import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { fetchDashboardStats, fetchIncidents, fetchYearStats, fetchCountries, fetchDateRange } from '../api';
import { getCountryCode, getFlag } from '../countryUtils';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#84cc16', '#6366f1'];

export default function Home() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [recentVideos, setRecentVideos] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      
      const baseFilter = { potentially_fatal: true, cause_confidence: 'maximum,high' };
      
      const totalIncidentsFilterPacks = [
        { name: 'Total', include: {}, exclude: {} }
      ];
      
      const primaryCausesFilterPacks = [
        { name: 'Total', include: { ...baseFilter }, exclude: {} },
        { name: 'Wrong Control Input', include: { ...baseFilter, primary_cause: 'wrong_control_input' }, exclude: {} },
        { name: 'Hardware Failure', include: { ...baseFilter, primary_cause: 'hardware_failure' }, exclude: {} },
        { name: 'Turbulence', include: { ...baseFilter, primary_cause: 'turbulence' }, exclude: {} },
        { name: 'Powerline Collision', include: { ...baseFilter, primary_cause: 'powerline_collision' }, exclude: {} },
        { name: 'Midair Collision', include: { ...baseFilter, primary_cause: 'midair_collision' }, exclude: {} },
        { name: 'Water Landing', include: { ...baseFilter, primary_cause: 'water_landing' }, exclude: {} },
        { name: 'Ground Starting', include: { ...baseFilter, primary_cause: 'ground_starting' }, exclude: {} },
        { name: 'Others', include: { ...baseFilter }, exclude: { primary_cause: 'wrong_control_input,hardware_failure,turbulence,powerline_collision,midair_collision,water_landing,ground_starting' } }
      ];

      const flightPhaseFilterPacks = [
        { name: 'Total', include: { ...baseFilter }, exclude: {} },
        { name: 'Ground', include: { ...baseFilter, flight_phase: 'ground' }, exclude: {} },
        { name: 'Takeoff', include: { ...baseFilter, flight_phase: 'takeoff' }, exclude: {} },
        { name: 'Flight', include: { ...baseFilter, flight_phase: 'flight' }, exclude: {} },
        { name: 'Landing', include: { ...baseFilter, flight_phase: 'landing' }, exclude: {} }
      ];

      const reserveFilterPacks = [
        { name: 'Total', include: { ...baseFilter }, exclude: { flight_phase: 'ground' } },
        { name: 'Attempted', include: { ...baseFilter, reserve_use: 'no_time,tangled,partially_opened,fully_opened' }, exclude: { flight_phase: 'ground' } },
        { name: 'FullyOpened', include: { ...baseFilter, reserve_use: 'fully_opened' }, exclude: { flight_phase: 'ground' } }
      ];

      const [totalIncidentsData, primaryCausesData, flightPhaseData, reserveData, yearData, recentIncidentsData, recentVideosData, countriesData, dateRangeData] = await Promise.all([
        fetchDashboardStats(totalIncidentsFilterPacks),
        fetchDashboardStats(primaryCausesFilterPacks),
        fetchDashboardStats(flightPhaseFilterPacks),
        fetchDashboardStats(reserveFilterPacks),
        fetchYearStats(baseFilter, {}),
        fetchIncidents(null, { order_by: '-date' }, 1),
        fetchIncidents(null, { has_video: 'true', order_by: '-date' }, 1),
        fetchCountries(),
        fetchDateRange()
      ]);

      const totalIncidents = totalIncidentsData['Total'] || 0;
      const potentiallyFatalIncidents = primaryCausesData['Total'] || 0;
      
      const countriesCount = countriesData.length;
      
      const dateRange = dateRangeData.min_date && dateRangeData.max_date
        ? `${new Date(dateRangeData.min_date).getFullYear()}-${new Date(dateRangeData.max_date).getFullYear()}`
        : 'N/A';

      setStats({
        totalIncidents,
        potentiallyFatalIncidents,
        countriesCount,
        dateRange,
        primaryCauses: primaryCausesData,
        flightPhase: flightPhaseData,
        reserve: reserveData,
        years: yearData
      });

      setRecentIncidents(recentIncidentsData.results.slice(0, 12));
      setRecentVideos(recentVideosData.results.slice(0, 6));
      setLoading(false);
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const primaryCausesChartData = [
    { name: 'Wrong Control Input', value: stats.primaryCauses['Wrong Control Input'] || 0, percent: (stats.primaryCauses['Wrong Control Input'] || 0) / stats.potentiallyFatalIncidents * 100, color: COLORS[0] },
    { name: 'Hardware Failure', value: stats.primaryCauses['Hardware Failure'] || 0, percent: (stats.primaryCauses['Hardware Failure'] || 0) / stats.potentiallyFatalIncidents * 100, color: COLORS[1] },
    { name: 'Turbulence', value: stats.primaryCauses['Turbulence'] || 0, percent: (stats.primaryCauses['Turbulence'] || 0) / stats.potentiallyFatalIncidents * 100, color: COLORS[2] },
    { name: 'Powerline', value: stats.primaryCauses['Powerline Collision'] || 0, percent: (stats.primaryCauses['Powerline Collision'] || 0) / stats.potentiallyFatalIncidents * 100, color: COLORS[3] },
    { name: 'Midair', value: stats.primaryCauses['Midair Collision'] || 0, percent: (stats.primaryCauses['Midair Collision'] || 0) / stats.potentiallyFatalIncidents * 100, color: COLORS[4] },
    { name: 'Water', value: stats.primaryCauses['Water Landing'] || 0, percent: (stats.primaryCauses['Water Landing'] || 0) / stats.potentiallyFatalIncidents * 100, color: COLORS[5] },
    { name: 'Ground Starting', value: stats.primaryCauses['Ground Starting'] || 0, percent: (stats.primaryCauses['Ground Starting'] || 0) / stats.potentiallyFatalIncidents * 100, color: COLORS[7] },
    { name: 'Others', value: stats.primaryCauses['Others'] || 0, percent: (stats.primaryCauses['Others'] || 0) / stats.potentiallyFatalIncidents * 100, color: COLORS[6] }
  ].sort((a, b) => {
    if (a.name === 'Others') return 1;
    if (b.name === 'Others') return -1;
    return b.percent - a.percent;
  });

  const flightPhaseChartData = [
    { name: 'Ground', percent: (stats.flightPhase['Ground'] || 0) / stats.flightPhase['Total'] * 100 },
    { name: 'Takeoff', percent: (stats.flightPhase['Takeoff'] || 0) / stats.flightPhase['Total'] * 100 },
    { name: 'Flight', percent: (stats.flightPhase['Flight'] || 0) / stats.flightPhase['Total'] * 100 },
    { name: 'Landing', percent: (stats.flightPhase['Landing'] || 0) / stats.flightPhase['Total'] * 100 }
  ];

  const reserveTotal = stats.reserve['Total'] || 0;
  const reserveAttempted = stats.reserve['Attempted'] || 0;
  const reserveFullyOpened = stats.reserve['FullyOpened'] || 0;
  const attemptedRate = reserveTotal > 0 ? (reserveAttempted / reserveTotal * 100).toFixed(0) : 0;
  const successRate = reserveAttempted > 0 ? (reserveFullyOpened / reserveAttempted * 100).toFixed(0) : 0;

  const recentYears = stats.years.slice(-5);
  const yearChartData = recentYears.map(y => ({ year: y.year, count: y.count }));

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'fatal': return 'text-red-400';
      case 'serious': return 'text-orange-400';
      case 'minor': return 'text-yellow-400';
      default: return 'text-slate-400';
    }
  };

  const getSeverityBg = (severity) => {
    switch (severity) {
      case 'fatal': return 'bg-red-500/20 border-red-500/50';
      case 'serious': return 'bg-orange-500/20 border-orange-500/50';
      case 'minor': return 'bg-yellow-500/20 border-yellow-500/50';
      default: return 'bg-slate-500/20 border-slate-500/50';
    }
  };

  const extractYouTubeId = (url) => {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
      /youtube\.com\/shorts\/([^&\n?#]+)/
    ];
    
    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }
    return null;
  };

  const getYouTubeVideoId = (incident) => {
    const allLinks = [
      ...(incident.media_links || '').split('\n'),
      ...(incident.source_links || '').split('\n')
    ];
    
    for (const link of allLinks) {
      const trimmedLink = link.trim();
      if (trimmedLink.includes('youtube') || trimmedLink.includes('youtu.be')) {
        const videoId = extractYouTubeId(trimmedLink);
        if (videoId) {
          return videoId;
        }
      }
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Hero Section */}
      <div className="bg-gradient-to-b from-slate-900 to-slate-950 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
            PPG Incidents Database
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 mb-6 max-w-3xl">
            Learn from the past, fly safer
          </p>
          <p className="text-base md:text-lg text-slate-400 mb-8 max-w-3xl">
            Database of paramotor incidents with statistical analysis — cause breakdowns, reserve success rates, trend charts, and filterable dashboards.
          </p>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-3xl">
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
              <div className="text-3xl md:text-4xl font-bold text-orange-400 mb-1">{stats.totalIncidents}</div>
              <div className="text-sm md:text-base text-slate-400">Total Incidents</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
              <div className="text-3xl md:text-4xl font-bold text-amber-400 mb-1">{stats.countriesCount}</div>
              <div className="text-sm md:text-base text-slate-400">Countries Covered</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-4 text-center">
              <div className="text-3xl md:text-4xl font-bold text-yellow-400 mb-1">{stats.dateRange}</div>
              <div className="text-sm md:text-base text-slate-400">Date Range</div>
            </div>
          </div>
        </div>
      </div>

      {/* Dashboard Highlights */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-2">Safety Insights at a Glance</h2>
          <p className="text-slate-400">Key statistics from potentially fatal incidents with high cause confidence</p>
          <p className="text-slate-500 text-sm mt-2">💡 Click on any chart to explore detailed statistics</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Primary Causes */}
          <div 
            onClick={() => navigate('/dashboard/causes-analysis#primary-causes')}
            className="bg-slate-900 rounded-xl p-4 md:p-6 border border-slate-800 cursor-pointer hover:border-amber-500/50 transition-all"
          >
            <h3 className="text-lg md:text-xl font-semibold mb-4 text-center">Primary Causes</h3>
            <div className="h-[280px] md:h-[320px] pointer-events-none">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={primaryCausesChartData} margin={{ left: 0, right: 0, top: 20, bottom: 60 }}>
                  <XAxis 
                    type="category" 
                    dataKey="name" 
                    stroke="#64748b" 
                    interval={0} 
                    angle={-45}
                    textAnchor="end"
                    height={60}
                    style={{ fontSize: isMobile ? '9px' : '11px', fill: '#e2e8f0' }}
                  />
                  <YAxis type="number" tickFormatter={(v) => `${v}%`} stroke="#64748b" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                  <Bar dataKey="percent" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    {primaryCausesChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                    <LabelList dataKey="percent" position="top" formatter={(v) => `${v.toFixed(0)}%`} fill="#f1f5f9" style={{ fontSize: isMobile ? '9px' : '11px' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Flight Phase */}
          <div 
            onClick={() => navigate('/dashboard/flight-conditions#flight-phase')}
            className="bg-slate-900 rounded-xl p-4 md:p-6 border border-slate-800 cursor-pointer hover:border-amber-500/50 transition-all"
          >
            <h3 className="text-lg md:text-xl font-semibold mb-4 text-center">Flight Phase</h3>
            <div className="h-[280px] md:h-[320px] pointer-events-none">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={flightPhaseChartData} margin={{ left: 0, right: 0, top: 20, bottom: 5 }}>
                  <XAxis type="category" dataKey="name" stroke="#64748b" interval={0} style={{ fontSize: isMobile ? '10px' : '12px' }} />
                  <YAxis type="number" tickFormatter={(v) => `${v}%`} stroke="#64748b" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                  <Bar dataKey="percent" fill="#fbbf24" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    <LabelList dataKey="percent" position="top" formatter={(v) => `${v.toFixed(0)}%`} fill="#f1f5f9" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Reserve Usage */}
          <div 
            onClick={() => navigate('/dashboard/safety-equipment#reserve-usage')}
            className="bg-slate-900 rounded-xl p-4 md:p-6 border border-slate-800 cursor-pointer hover:border-amber-500/50 transition-all"
          >
            <h3 className="text-lg md:text-xl font-semibold mb-4 text-center">Reserve Usage</h3>
            <div className="flex flex-col items-center justify-center h-[280px] md:h-[320px] space-y-6">
              <div className="text-center">
                <div className="text-5xl md:text-6xl font-bold text-emerald-400 mb-2">{attemptedRate}%</div>
                <div className="text-base md:text-lg text-slate-300">Attempted to throw reserve</div>
                <div className="text-sm text-slate-500 mt-1">Based on in-flight incidents</div>
              </div>
              <div className="w-full h-px bg-slate-700"></div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-bold text-emerald-400 mb-2">{successRate}%</div>
                <div className="text-base md:text-lg text-slate-300">Fully deployed successfully</div>
                <div className="text-sm text-slate-500 mt-1">Of those who attempted</div>
              </div>
            </div>
          </div>

          {/* Recent Trends */}
          <div 
            onClick={() => navigate('/dashboard/trends-distribution#by-year')}
            className="bg-slate-900 rounded-xl p-4 md:p-6 border border-slate-800 cursor-pointer hover:border-amber-500/50 transition-all"
          >
            <h3 className="text-lg md:text-xl font-semibold mb-4 text-center">Recent Trends (Last 5 Years)</h3>
            <div className="h-[280px] md:h-[320px] pointer-events-none">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={yearChartData} margin={{ left: 0, right: 0, top: 20, bottom: 5 }}>
                  <XAxis type="category" dataKey="year" stroke="#64748b" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                  <YAxis type="number" stroke="#64748b" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                  <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                    <LabelList dataKey="count" position="top" fill="#f1f5f9" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link 
            to="/dashboards" 
            className="inline-block px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg font-semibold text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:-translate-y-0.5"
          >
            View Full Statistics & Dashboards →
          </Link>
        </div>
      </div>

      {/* Recent Incidents */}
      <div className="bg-slate-900/50 border-y border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Block - Recent Videos */}
            <div>
              <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Recent Videos</h2>
                <p className="text-slate-400">Latest incidents with video footage</p>
              </div>

              <div className="space-y-3">
                {recentVideos.map(incident => {
                  const videoId = getYouTubeVideoId(incident);
                  return (
                    <Link
                      key={incident.uuid}
                      to={`/view/${incident.uuid}`}
                      className="block bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg overflow-hidden transition-all hover:border-amber-500/50 h-36"
                    >
                      <div className="flex gap-3 h-full">
                        {videoId && (
                          <img
                            src={`https://img.youtube.com/vi/${videoId}/mqdefault.jpg`}
                            alt="Video thumbnail"
                            className="w-52 h-full object-cover flex-shrink-0"
                          />
                        )}
                        <div className="flex-1 p-3 min-w-0 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <div className="text-slate-400 font-mono text-xs">
                                {incident.date || 'Unknown'}
                              </div>
                              <div className={`px-2 py-0.5 rounded text-xs font-medium border ${getSeverityBg(incident.severity)} ${getSeverityColor(incident.severity)}`}>
                                {incident.severity || 'Unknown'}
                              </div>
                            </div>
                            <div className="text-slate-200 text-sm line-clamp-2">
                              {incident.title || incident.summary || 'No title'}
                            </div>
                          </div>
                          {incident.country && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-base">{getFlag(getCountryCode(incident.country))}</span>
                              <span className="text-slate-400 text-xs">{incident.country}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              <div className="mt-6">
                <Link 
                  to="/incidents?has_video=true" 
                  className="inline-block px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-semibold text-slate-200 transition-all"
                >
                  Browse All Videos →
                </Link>
              </div>
            </div>

            {/* Right Block - Recent Incidents List */}
            <div>
              <div className="mb-6">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Recent Incidents</h2>
                <p className="text-slate-400">Latest reports from the database</p>
              </div>

              <div className="space-y-3">
                {recentIncidents.map(incident => (
                  <Link
                    key={incident.uuid}
                    to={`/view/${incident.uuid}`}
                    className="block bg-slate-800/50 hover:bg-slate-800 border border-slate-700 rounded-lg p-4 transition-all hover:border-amber-500/50"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <div className="text-slate-400 font-mono text-sm w-20 whitespace-nowrap">
                          {incident.date || 'Unknown'}
                        </div>
                        {incident.country && (
                          <div className="flex items-center gap-1.5 min-w-[60px]">
                            <span className="text-xl">{getFlag(getCountryCode(incident.country))}</span>
                            <span className="text-slate-300 text-sm">{getCountryCode(incident.country)}</span>
                          </div>
                        )}
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium border ${getSeverityBg(incident.severity)} ${getSeverityColor(incident.severity)} flex-shrink-0`}>
                        {incident.severity || 'Unknown'}
                      </div>
                      <div className="text-slate-200 flex-1 line-clamp-1">
                        {incident.title || incident.summary || 'No title'}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              <div className="mt-6">
                <Link 
                  to="/incidents" 
                  className="inline-block px-6 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-semibold text-slate-200 transition-all"
                >
                  Browse All Incidents →
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Call to Action / Safety Message */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/30 rounded-xl p-6 md:p-8 text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-4 text-orange-400">Help Improve Safety</h2>
          <p className="text-slate-300 text-base md:text-lg mb-6 max-w-2xl mx-auto">
            This database exists to help the paramotor community learn from past incidents. 
            By studying what went wrong, we can all make better decisions and fly safer.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Link 
              to="/create" 
              className="px-8 py-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-lg font-semibold text-white shadow-lg shadow-orange-500/25 hover:shadow-orange-500/40 transition-all duration-300 hover:-translate-y-0.5"
            >
              Report an Incident
            </Link>
            <Link 
              to="/about" 
              className="px-8 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg font-semibold text-slate-200 transition-all"
            >
              Learn More About This Project
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

