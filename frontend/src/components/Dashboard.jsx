import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LabelList } from 'recharts';
import { fetchDashboardStats, fetchCountryStats, fetchYearStats, fetchWindSpeedPercentile } from '../api';
import { getCountryCode, getFlag } from '../countryUtils';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#84cc16', '#6366f1'];

const getBaseFilter = (severityFilter, yearFilter, confidenceFilter) => {
  const baseFilter = {};
  
  // Add confidence filtering
  if (confidenceFilter === 'high') {
    baseFilter.cause_confidence = 'maximum,high';
  }
  // 'any' doesn't add any confidence filter
  
  if (severityFilter === 'potentially_fatal') {
    baseFilter.potentially_fatal = true;
  } else if (severityFilter === 'fatal') {
    baseFilter.severity = 'fatal';
  }
  // 'all' doesn't add any severity filter
  
  // Add year filtering
  if (yearFilter === 'last_10_years') {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 10;
    baseFilter.year_min = startYear;
  } else if (yearFilter === 'last_5_years') {
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - 5;
    baseFilter.year_min = startYear;
  }
  // 'all_time' doesn't add any year filter
  
  return baseFilter;
};

const getPieFilterPacks = (severityFilter, yearFilter, confidenceFilter) => {
  const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
  return [
  {
    name: 'Total',
    include: { ...baseFilter },
    exclude: {}
  },
  {
    name: 'Wrong Control Input',
    include: { ...baseFilter, primary_cause: 'wrong_control_input' },
    exclude: {}
  },
  {
    name: 'Hardware Failure',
    include: { ...baseFilter, primary_cause: 'hardware_failure' },
    exclude: {}
  },
  {
    name: 'Turbulence',
    include: { ...baseFilter, primary_cause: 'turbulence' },
    exclude: {}
  },
  {
    name: 'Powerline Collision / Near Miss',
    include: { ...baseFilter, primary_cause: 'powerline_collision' },
    exclude: {}
  },
  {
    name: 'Midair Collision / Near Miss',
    include: { ...baseFilter, primary_cause: 'midair_collision' },
    exclude: {}
  },
  {
    name: 'Water Landing',
    include: { ...baseFilter, primary_cause: 'water_landing' },
    exclude: {}
  },
  {
    name: 'Lines & Brakes Issues',
    include: { ...baseFilter, primary_cause: 'lines_brakes_issues' },
    exclude: {}
  },
  {
    name: 'Ground Starting',
    include: { ...baseFilter, primary_cause: 'ground_starting' },
    exclude: {}
  },
  {
    name: 'Ground Object Collision',
    include: { ...baseFilter, primary_cause: 'ground_object_collision' },
    exclude: {}
  },
  {
    name: 'Preflight Error',
    include: { ...baseFilter, primary_cause: 'preflight_error' },
    exclude: {}
  },
  {
    name: 'Others / Unknown',
    include: { ...baseFilter },
    exclude: { primary_cause: 'wrong_control_input,hardware_failure,turbulence,powerline_collision,midair_collision,water_landing,lines_brakes_issues,ground_starting,ground_object_collision,preflight_error,rain_fog_snow' }
  }
];
};

const PIE_FILTER_PACKS = getPieFilterPacks('potentially_fatal', 'all_time', 'high');

const getReserveFilterPacks = (severityFilter, yearFilter, confidenceFilter) => {
  const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
  return [
  {
    name: 'Total',
    include: { ...baseFilter },
    exclude: { flight_phase: 'ground' }
  },
  {
    name: 'Attempted',
    include: { ...baseFilter, reserve_use: 'no_time,tangled,partially_opened,fully_opened' },
    exclude: { flight_phase: 'ground' }
  },
  {
    name: 'FullyOpened',
    include: { ...baseFilter, reserve_use: 'fully_opened' },
    exclude: { flight_phase: 'ground' }
  },
  {
    name: 'NotOpened',
    include: { ...baseFilter, reserve_use: 'no_time,tangled,partially_opened' },
    exclude: { flight_phase: 'ground' }
  }
];
};

const RESERVE_FILTER_PACKS = getReserveFilterPacks('potentially_fatal', 'all_time', 'high');

const getTrimFilterPacks = (severityFilter, yearFilter, confidenceFilter) => {
  const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
  return [
  {
    name: 'Total',
    include: { ...baseFilter },
    exclude: {}
  },
  {
    name: 'Unknown',
    include: { ...baseFilter, factor_trimmer_position: 'null' },
    exclude: {}
  },
  {
    name: 'TrimOut',
    include: { ...baseFilter, factor_trimmer_position: 'fully_open' },
    exclude: {}
  },
  {
    name: 'PartiallyOpen',
    include: { ...baseFilter, factor_trimmer_position: 'partially_open' },
    exclude: {}
  },
  {
    name: 'TrimIn',
    include: { ...baseFilter, factor_trimmer_position: 'closed' },
    exclude: {}
  }
];
};

const TRIM_FILTER_PACKS = getTrimFilterPacks('potentially_fatal', 'all_time', 'high');

const getBarFilterPacks = (severityFilter, yearFilter, confidenceFilter) => {
  const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
  return [
  {
    name: 'Total',
    include: { ...baseFilter },
    exclude: {}
  },
  {
    name: 'Wrong Pilot Input',
    include: { ...baseFilter, pilot_actions: 'wrong_input_triggered' },
    exclude: {}
  },
  {
    name: 'Hardware Failure',
    include: { ...baseFilter, hardware_failure: true },
    exclude: { }
  },
  {
    name: 'Turbulent Conditions',
    include: { ...baseFilter, factor_turbulent_conditions: true },
  },
  {
    name: 'Powerline Collision',
    include: { ...baseFilter, factor_powerline_collision: true }
  },
  {
    name: 'Low Acro',
    include: { ...baseFilter, factor_low_altitude: true, factor_maneuvers: true }
  },
  {
    name: 'Performed Maneuvers',
    include: { ...baseFilter, factor_maneuvers: true }
  },
  {
    name: 'Water Landing',
    include: { ...baseFilter, factor_water_landing: true }
  },
  {
    name: 'Wing Collapse',
    include: { ...baseFilter, collapse: true }
  },
  {
    name: 'Spiral',
    include: { ...baseFilter, factor_spiral_maneuver: true }
  },
  {
    name: 'Accelerator Engaged',
    include: { ...baseFilter, factor_accelerator: 'partially_engaged,fully_engaged' }
  }
];
};

const BAR_FILTER_PACKS = getBarFilterPacks('potentially_fatal', 'all_time', 'high');

const getFlightPhaseFilterPacks = (severityFilter, yearFilter, confidenceFilter) => {
  const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
  return [
  {
    name: 'Total',
    include: { ...baseFilter },
    exclude: {}
  },
  {
    name: 'Ground',
    include: { ...baseFilter, flight_phase: 'ground' },
    exclude: {}
  },
  {
    name: 'Takeoff',
    include: { ...baseFilter, flight_phase: 'takeoff' },
    exclude: {}
  },
  {
    name: 'Flight',
    include: { ...baseFilter, flight_phase: 'flight' },
    exclude: {}
  },
  {
    name: 'Landing',
    include: { ...baseFilter, flight_phase: 'landing' },
    exclude: {}
  }
];
};

const FLIGHT_PHASE_FILTER_PACKS = getFlightPhaseFilterPacks('potentially_fatal', 'all_time', 'high');

const getAltitudeFilterPacks = (severityFilter, yearFilter, confidenceFilter) => {
  const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
  return [
  {
    name: 'Total',
    include: { ...baseFilter, altitude_not_null: true },
    exclude: {}
  },
  {
    name: '0-50',
    include: { ...baseFilter, altitude_min: 0, altitude_max: 50 },
    exclude: {}
  },
  {
    name: '50-100',
    include: { ...baseFilter, altitude_min: 50, altitude_max: 100 },
    exclude: {}
  },
  {
    name: '100-200',
    include: { ...baseFilter, altitude_min: 100, altitude_max: 200 },
    exclude: {}
  },
  {
    name: '200-500',
    include: { ...baseFilter, altitude_min: 200, altitude_max: 500 },
    exclude: {}
  },
  {
    name: '500+',
    include: { ...baseFilter, altitude_min: 500},
    exclude: {}
  },
];
};

const ALTITUDE_FILTER_PACKS = getAltitudeFilterPacks('potentially_fatal', 'all_time', 'high');

const getTurbulenceFilterPacks = (severityFilter, yearFilter, confidenceFilter) => {
  const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
  return [
  {
    name: 'Total',
    include: { ...baseFilter, factor_turbulent_conditions: true },
    exclude: {}
  },
  {
    name: 'Rotor',
    include: { ...baseFilter, factor_turbulent_conditions: true, factor_rotor_turbulence: true },
    exclude: {}
  },
  {
    name: 'Thermal Activity',
    include: { ...baseFilter, factor_turbulent_conditions: true, factor_thermal_weather: true },
    exclude: {}
  },
  // {
  //   name: 'Wake Turbulence',
  //   include: { ...baseFilter, factor_turbulent_conditions: true, factor_wake_turbulence: true },
  //   exclude: {}
  // },
  {
    name: 'Wind',
    include: { ...baseFilter, factor_turbulent_conditions: true, wind_speed_ms_min: 3 },
    exclude: { factor_rotor_turbulence: true, factor_thermal_weather: true }
  },
  {
    name: 'Other',
    include: { ...baseFilter, factor_turbulent_conditions: true },
    exclude: { factor_rotor_turbulence: true, factor_thermal_weather: true, wind_speed_ms_min: 3 }
  }
];
};

const TURBULENCE_FILTER_PACKS = getTurbulenceFilterPacks('potentially_fatal', 'all_time', 'high');

const getWindSpeedFilterPacks = (severityFilter, yearFilter, confidenceFilter) => {
  const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
  return [
  {
    name: 'Total',
    include: { ...baseFilter, wind_speed_ms_not_null: true },
    exclude: {}
  },
  {
    name: '0-1',
    include: { ...baseFilter, wind_speed_ms_max: 1 },
    exclude: {}
  },
  {
    name: '1-2',
    include: { ...baseFilter, wind_speed_ms_min: 1, wind_speed_ms_max: 2 },
    exclude: {}
  },
  {
    name: '2-3',
    include: { ...baseFilter, wind_speed_ms_min: 2, wind_speed_ms_max: 3 },
    exclude: {}
  },
  {
    name: '3-4',
    include: { ...baseFilter, wind_speed_ms_min: 3, wind_speed_ms_max: 4 },
    exclude: {}
  },
  {
    name: '4-6',
    include: { ...baseFilter, wind_speed_ms_min: 4, wind_speed_ms_max: 6 },
    exclude: {}
  },
  {
    name: '6-8',
    include: { ...baseFilter, wind_speed_ms_min: 6, wind_speed_ms_max: 8 },
    exclude: {}
  },
  {
    name: '8+',
    include: { ...baseFilter, wind_speed_ms_min: 8 },
    exclude: {}
  }
];
};

const WIND_SPEED_FILTER_PACKS = getWindSpeedFilterPacks('potentially_fatal', 'all_time', 'high');

const buildFilterUrl = (filterPack) => {
  const params = new URLSearchParams();
  Object.entries(filterPack.include || {}).forEach(([key, value]) => {
    params.set(key, value);
  });
  Object.entries(filterPack.exclude || {}).forEach(([key, value]) => {
    params.set(`exclude_${key}`, value);
  });
  return `/incidents?${params.toString()}`;
};

const ALL_SECTIONS = [
  { id: 'primary-causes', label: 'Primary Causes' },
  { id: 'contributing-factors', label: 'Contributing Factors' },
  { id: 'flight-phase', label: 'Flight Phase' },
  { id: 'flight-altitude', label: 'Flight Altitude' },
  { id: 'turbulence-type', label: 'Turbulence Type' },
  { id: 'wind-speed', label: 'Wind Speed' },
  { id: 'reserve-usage', label: 'Reserve Usage' },
  { id: 'trim-position', label: 'Trim Position' },
  { id: 'by-country', label: 'By Country' },
  { id: 'by-year', label: 'By Year' }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [severityFilter, setSeverityFilter] = useState('potentially_fatal');
  const [yearFilter, setYearFilter] = useState('all_time');
  const [confidenceFilter, setConfidenceFilter] = useState('high');
  const [pieStats, setPieStats] = useState(null);
  const [barStats, setBarStats] = useState(null);
  const [flightPhaseStats, setFlightPhaseStats] = useState(null);
  const [altitudeStats, setAltitudeStats] = useState(null);
  const [turbulenceStats, setTurbulenceStats] = useState(null);
  const [windSpeedStats, setWindSpeedStats] = useState(null);
  const [windSpeedPercentile, setWindSpeedPercentile] = useState(null);
  const [reserveStats, setReserveStats] = useState(null);
  const [trimStats, setTrimStats] = useState(null);
  const [countryStats, setCountryStats] = useState(null);
  const [yearStats, setYearStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('primary-causes');
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
      const [pieData, barData, flightPhaseData, altitudeData, turbulenceData, windSpeedData, windPercentileData, reserveData, trimData, countryData, yearData] = await Promise.all([
        fetchDashboardStats(getPieFilterPacks(severityFilter, yearFilter, confidenceFilter)),
        fetchDashboardStats(getBarFilterPacks(severityFilter, yearFilter, confidenceFilter)),
        fetchDashboardStats(getFlightPhaseFilterPacks(severityFilter, yearFilter, confidenceFilter)),
        fetchDashboardStats(getAltitudeFilterPacks(severityFilter, yearFilter, confidenceFilter)),
        fetchDashboardStats(getTurbulenceFilterPacks(severityFilter, yearFilter, confidenceFilter)),
        fetchDashboardStats(getWindSpeedFilterPacks(severityFilter, yearFilter, confidenceFilter)),
        fetchWindSpeedPercentile(baseFilter, {}, 40),
        fetchDashboardStats(getReserveFilterPacks(severityFilter, yearFilter, confidenceFilter)),
        fetchDashboardStats(getTrimFilterPacks(severityFilter, yearFilter, confidenceFilter)),
        fetchCountryStats(baseFilter, {}, 10),
        fetchYearStats(baseFilter, {})
      ]);
      setPieStats(pieData);
      setBarStats(barData);
      setFlightPhaseStats(flightPhaseData);
      setAltitudeStats(altitudeData);
      setTurbulenceStats(turbulenceData);
      setWindSpeedStats(windSpeedData);
      setWindSpeedPercentile(windPercentileData.percentile_value);
      setReserveStats(reserveData);
      setTrimStats(trimData);
      setCountryStats(countryData);
      setYearStats(yearData);
      setLoading(false);
    };

    loadStats();
  }, [severityFilter, yearFilter, confidenceFilter]);

  useEffect(() => {
    const sections = severityFilter === 'fatal'
      ? ALL_SECTIONS.filter(s => s.id !== 'reserve-usage')
      : ALL_SECTIONS;

    const handleScroll = () => {
      const sectionElements = sections.map(s => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 200;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(sections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [severityFilter]);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-xl">Loading dashboard...</div>
      </div>
    );
  }

  const pieFilterPacks = getPieFilterPacks(severityFilter, yearFilter, confidenceFilter);
  const barFilterPacks = getBarFilterPacks(severityFilter, yearFilter, confidenceFilter);
  const flightPhaseFilterPacks = getFlightPhaseFilterPacks(severityFilter, yearFilter, confidenceFilter);
  const altitudeFilterPacks = getAltitudeFilterPacks(severityFilter, yearFilter, confidenceFilter);
  const turbulenceFilterPacks = getTurbulenceFilterPacks(severityFilter, yearFilter, confidenceFilter);
  const windSpeedFilterPacks = getWindSpeedFilterPacks(severityFilter, yearFilter, confidenceFilter);
  const reserveFilterPacks = getReserveFilterPacks(severityFilter, yearFilter, confidenceFilter);
  const trimFilterPacks = getTrimFilterPacks(severityFilter, yearFilter, confidenceFilter);

  // Filter sections based on severity filter
  const SECTIONS = severityFilter === 'fatal'
    ? ALL_SECTIONS.filter(s => s.id !== 'reserve-usage')
    : ALL_SECTIONS;

  const pieTotal = pieStats['Total'] || 0;
  const pieChartData = pieFilterPacks
    .filter(p => p.name !== 'Total')
    .map((p, index) => ({ 
      name: p.name, 
      value: pieStats[p.name] || 0, 
      percent: pieTotal > 0 ? ((pieStats[p.name] || 0) / pieTotal) * 100 : 0,
      filterPack: p,
      colorIndex: index
    }))
    .sort((a, b) => b.percent - a.percent);

  const barTotal = barStats['Total'] || 0;
  const barChartData = barFilterPacks
    .filter(p => p.name !== 'Total')
    .map(p => ({
      name: p.name,
      value: barStats[p.name] || 0,
      percent: barTotal > 0 ? ((barStats[p.name] || 0) / barTotal) * 100 : 0,
      filterPack: p
    }))
    .sort((a, b) => b.percent - a.percent);

  const handlePieClick = (data) => {
    if (isTouchDevice) {
      if (activeTooltip === `pie-${data?.name}`) {
        if (data?.filterPack) {
          navigate(buildFilterUrl(data.filterPack));
        }
      } else {
        setActiveTooltip(`pie-${data?.name}`);
        setTimeout(() => setActiveTooltip(null), 3000);
      }
    } else {
      if (data?.filterPack) {
        navigate(buildFilterUrl(data.filterPack));
      }
    }
  };

  const handleBarClick = (data) => {
    if (isTouchDevice) {
      if (activeTooltip === `bar-${data?.name}`) {
        if (data?.filterPack) {
          navigate(buildFilterUrl(data.filterPack));
        }
      } else {
        setActiveTooltip(`bar-${data?.name}`);
        setTimeout(() => setActiveTooltip(null), 3000);
      }
    } else {
      if (data?.filterPack) {
        navigate(buildFilterUrl(data.filterPack));
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex">
        {/* Table of Contents - Hidden on mobile */}
        <div className="hidden lg:block lg:fixed lg:left-0 lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-48 xl:w-64 bg-slate-900 border-r border-slate-800 p-4 xl:p-6 overflow-y-auto">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Contents</h2>
          <nav className="space-y-1.5">
            {SECTIONS.map(section => (
              <button
                key={section.id}
                onClick={() => scrollToSection(section.id)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-colors text-sm ${
                  activeSection === section.id
                    ? 'bg-amber-500/20 text-amber-400 font-medium'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                {section.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:ml-48 xl:ml-64 flex-1">
          <div className="lg:sticky lg:top-16 lg:z-20 bg-slate-950 border-b border-slate-800 p-4 md:p-6 xl:px-8 xl:py-6 lg:shadow-lg">
            <div className="max-w-4xl mx-auto">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-400">Severity:</label>
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/25"
                  >
                    <option value="potentially_fatal">Potentially Fatal</option>
                    <option value="fatal">Fatal</option>
                    <option value="all">All</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-400">Period:</label>
                  <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/25"
                  >
                    <option value="all_time">All time</option>
                    <option value="last_10_years">Last 10 years</option>
                    <option value="last_5_years">Last 5 years</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-slate-400">Confidence:</label>
                  <select
                    value={confidenceFilter}
                    onChange={(e) => setConfidenceFilter(e.target.value)}
                    className="px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-200 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500/25"
                  >
                    <option value="high">High</option>
                    <option value="any">Any</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 md:p-6 xl:p-8">
            <div className="max-w-4xl mx-auto">
              <div className="mb-6 md:mb-8 text-base md:text-lg text-slate-300">
                <span className="font-bold">{pieTotal}</span>
                {' '}
                {severityFilter === 'potentially_fatal' ? 'potentially fatal incidents' : severityFilter === 'fatal' ? 'fatal incidents' : 'incidents'}
                {' '}
                {yearFilter === 'all_time' ? '' : yearFilter === 'last_10_years' ? 'from the last 10 years ' : 'from the last 5 years '}
                {confidenceFilter === 'high' && 'with high cause confidence'}
              </div>
            </div>
            <div className="max-w-4xl mx-auto">
              <div id="primary-causes" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 scroll-mt-8 lg:scroll-mt-48">
              <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Primary Causes</h2>
          
          <div className="h-[450px] md:h-[530px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pieChartData} margin={{ left: 0, right: 0, top: 20, bottom: 90 }}>
                <XAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#64748b" 
                  interval={0} 
                  angle={-45}
                  textAnchor="end"
                  height={90}
                  tick={({ x, y, payload }) => {
                    const shortNames = {
                      'Wrong Control Input': 'Wrong Control Input',
                      'Hardware Failure': 'Hardware Failure',
                      'Turbulence': 'Turbulence',
                      'Powerline Collision / Near Miss': 'Powerline Collision / Near Miss',
                      'Midair Collision / Near Miss': 'Midair Collision / Near Miss',
                      'Water Landing': 'Water',
                      'Lines & Brakes Issues': 'Lines/Brakes Issues',
                      'Ground Starting': 'Ground Starting',
                      'Ground Object Collision': 'Ground Object Collision',
                      'Preflight Error': 'Preflight Error',
                      'Others / Unknown': 'Others / Unknown'
                    };
                    return (
                      <text x={x} y={y} fill="#e2e8f0" fontSize={isMobile ? 9 : 11} textAnchor="end" transform={`rotate(-45 ${x} ${y})`}>
                        {shortNames[payload.value] || payload.value}
                      </text>
                    );
                  }}
                />
                <YAxis type="number" tickFormatter={(v) => `${v}%`} stroke="#64748b" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                <Tooltip
                  trigger={isTouchDevice ? 'click' : 'hover'}
                  formatter={(value) => `${value.toFixed(1)}%`}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Bar dataKey="percent" radius={[4, 4, 0, 0]} onClick={handlePieClick} style={{ cursor: 'pointer' }} isAnimationActive={false}>
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[entry.colorIndex % COLORS.length]} />
                  ))}
                  <LabelList dataKey="percent" position="top" formatter={(v) => `${v.toFixed(0)}%`} fill="#f1f5f9" style={{ fontSize: isMobile ? '9px' : '11px' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div id="contributing-factors" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 mt-6 md:mt-8 scroll-mt-8 lg:scroll-mt-48">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Contributing Factors</h2>
          
          <div className="h-[450px] md:h-[500px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} margin={{ left: 0, right: 0, top: 20, bottom: 100 }}>
                <XAxis 
                  type="category" 
                  dataKey="name" 
                  stroke="#64748b" 
                  interval={0} 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  style={{ fontSize: isMobile ? '9px' : '11px', fill: '#e2e8f0' }}
                />
                <YAxis type="number" tickFormatter={(v) => `${v}%`} stroke="#64748b" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                <Tooltip
                  trigger={isTouchDevice ? 'click' : 'hover'}
                  formatter={(value) => `${value.toFixed(1)}%`}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Bar dataKey="percent" fill="#f97316" radius={[4, 4, 0, 0]} onClick={handleBarClick} style={{ cursor: 'pointer' }} isAnimationActive={false}>
                  <LabelList dataKey="percent" position="top" formatter={(v) => `${v.toFixed(0)}%`} fill="#f1f5f9" style={{ fontSize: isMobile ? '9px' : '11px' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div id="flight-phase" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 mt-6 md:mt-8 scroll-mt-8 lg:scroll-mt-48">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Flight Phase</h2>
          
          {(() => {
            const flightPhaseTotal = flightPhaseStats?.['Total'] || 0;
            const flightPhaseChartData = flightPhaseFilterPacks
              .filter(p => p.name !== 'Total')
              .map(p => ({
                name: p.name,
                count: flightPhaseStats?.[p.name] || 0,
                percent: flightPhaseTotal > 0 ? ((flightPhaseStats?.[p.name] || 0) / flightPhaseTotal) * 100 : 0,
                filterPack: p
              }));

            const handleFlightPhaseClick = (data) => {
              if (isTouchDevice) {
                if (activeTooltip === `flightphase-${data?.name}`) {
                  if (data?.filterPack) {
                    navigate(buildFilterUrl(data.filterPack));
                  }
                } else {
                  setActiveTooltip(`flightphase-${data?.name}`);
                  setTimeout(() => setActiveTooltip(null), 3000);
                }
              } else {
                if (data?.filterPack) {
                  navigate(buildFilterUrl(data.filterPack));
                }
              }
            };

            return (
              <div className="h-[250px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={flightPhaseChartData} margin={{ left: 0, right: 0, top: 20, bottom: 5 }}>
                    <XAxis type="category" dataKey="name" stroke="#64748b" interval={0} style={{ fontSize: isMobile ? '10px' : '12px' }} />
                    <YAxis type="number" tickFormatter={(v) => `${v}%`} stroke="#64748b" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                    <Tooltip
                      trigger={isTouchDevice ? 'click' : 'hover'}
                      formatter={(value) => `${value.toFixed(1)}%`}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                    />
                    <Bar dataKey="percent" fill="#fbbf24" radius={[4, 4, 0, 0]} onClick={handleFlightPhaseClick} style={{ cursor: 'pointer' }} isAnimationActive={false}>
                      <LabelList dataKey="percent" position="top" formatter={(v) => `${v.toFixed(0)}%`} fill="#f1f5f9" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })()}
        </div>

        <div id="flight-altitude" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 mt-6 md:mt-8 scroll-mt-8 lg:scroll-mt-48">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Flight Altitude</h2>
          
          {(() => {
            const altitudeTotal = altitudeStats?.['Total'] || 0;
            
            const altitudeLabels = {
              '0-50': { meters: '0-50 m', feet: '0-160 ft' },
              '50-100': { meters: '50-100 m', feet: '160-330 ft' },
              '100-200': { meters: '100-200 m', feet: '330-660 ft' },
              '200-500': { meters: '200-500 m', feet: '660-1640 ft' },
              '500+': { meters: '500+ m', feet: '1640+ ft' }
            };
            
            const altitudeChartData = altitudeFilterPacks
              .filter(p => p.name !== 'Total')
              .map(p => ({
                name: p.name,
                displayName: altitudeLabels[p.name]?.meters || p.name,
                count: altitudeStats?.[p.name] || 0,
                percent: altitudeTotal > 0 ? ((altitudeStats?.[p.name] || 0) / altitudeTotal) * 100 : 0,
                filterPack: p
              }));

            const handleAltitudeClick = (data) => {
              if (isTouchDevice) {
                if (activeTooltip === `altitude-${data?.name}`) {
                  if (data?.filterPack) {
                    navigate(buildFilterUrl(data.filterPack));
                  }
                } else {
                  setActiveTooltip(`altitude-${data?.name}`);
                  setTimeout(() => setActiveTooltip(null), 3000);
                }
              } else {
                if (data?.filterPack) {
                  navigate(buildFilterUrl(data.filterPack));
                }
              }
            };

            const CustomXAxisTick = ({ x, y, payload }) => {
              const labels = altitudeLabels[payload.value];
              if (!labels) return null;
              
              return (
                <g transform={`translate(${x},${y})`}>
                  <text x={0} y={0} dy={10} textAnchor="middle" fill="#64748b" fontSize={isMobile ? 9 : 11}>
                    {labels.meters}
                  </text>
                  <text x={0} y={0} dy={22} textAnchor="middle" fill="#64748b" fontSize={isMobile ? 8 : 10}>
                    {labels.feet}
                  </text>
                </g>
              );
            };

            const allIncidentsTotal = barStats?.['Total'] || 0;
            const knownAltitudePercent = allIncidentsTotal > 0 ? ((altitudeTotal / allIncidentsTotal) * 100).toFixed(0) : 0;
            const unknownAltitudePercent = allIncidentsTotal > 0 ? (((allIncidentsTotal - altitudeTotal) / allIncidentsTotal) * 100).toFixed(0) : 0;

            return (
              <div>
                <div className="h-[320px] md:h-[370px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={altitudeChartData} margin={{ left: 0, right: 0, top: 20, bottom: 35 }}>
                      <XAxis type="category" dataKey="name" stroke="#64748b" interval={0} tick={<CustomXAxisTick />} />
                      <YAxis type="number" tickFormatter={(v) => `${v}%`} stroke="#64748b" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                      <Tooltip
                        trigger={isTouchDevice ? 'click' : 'hover'}
                        formatter={(value) => `${value.toFixed(1)}%`}
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f1f5f9'
                        }}
                      />
                      <Bar dataKey="percent" fill="#a855f7" radius={[4, 4, 0, 0]} onClick={handleAltitudeClick} style={{ cursor: 'pointer' }} isAnimationActive={false}>
                        <LabelList dataKey="percent" position="top" formatter={(v) => `${v.toFixed(0)}%`} fill="#f1f5f9" style={{ fontSize: isMobile ? '9px' : '11px' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-700 text-center">
                  <span className="text-base md:text-lg text-slate-400">
                    Based on <span className="text-purple-400 font-bold text-lg md:text-xl">{knownAltitudePercent}%</span> incidents with known altitude ({unknownAltitudePercent}% reports missing altitude)
                  </span>
                </div>
              </div>
            );
          })()}
        </div>

        <div id="turbulence-type" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 mt-6 md:mt-8 scroll-mt-8 lg:scroll-mt-48">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Turbulence Type</h2>
          
          {(() => {
            const turbulenceTotal = turbulenceStats?.['Total'] || 0;
            const turbulenceChartData = turbulenceFilterPacks
              .filter(p => p.name !== 'Total')
              .map((p, index) => ({
                name: p.name,
                value: turbulenceStats?.[p.name] || 0,
                percent: turbulenceTotal > 0 ? ((turbulenceStats?.[p.name] || 0) / turbulenceTotal) * 100 : 0,
                filterPack: p,
                colorIndex: index
              }))
              .sort((a, b) => b.percent - a.percent);

            const handleTurbulenceClick = (data) => {
              if (isTouchDevice) {
                if (activeTooltip === `turbulence-${data?.name}`) {
                  if (data?.filterPack) {
                    navigate(buildFilterUrl(data.filterPack));
                  }
                } else {
                  setActiveTooltip(`turbulence-${data?.name}`);
                  setTimeout(() => setActiveTooltip(null), 3000);
                }
              } else {
                if (data?.filterPack) {
                  navigate(buildFilterUrl(data.filterPack));
                }
              }
            };

            const allIncidentsTotal = barStats?.['Total'] || 0;
            const turbulencePercentOfAll = allIncidentsTotal > 0 ? ((turbulenceTotal / allIncidentsTotal) * 100).toFixed(0) : 0;

            return (
              <div>
                <div className="h-[300px] md:h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={turbulenceChartData} margin={{ left: 0, right: 0, top: 20, bottom: 60 }}>
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
                      <Tooltip
                        trigger={isTouchDevice ? 'click' : 'hover'}
                        formatter={(value) => `${value.toFixed(1)}%`}
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f1f5f9'
                        }}
                      />
                      <Bar dataKey="percent" radius={[4, 4, 0, 0]} onClick={handleTurbulenceClick} style={{ cursor: 'pointer' }} isAnimationActive={false}>
                        {turbulenceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[entry.colorIndex % COLORS.length]} />
                        ))}
                        <LabelList dataKey="percent" position="top" formatter={(v) => `${v.toFixed(0)}%`} fill="#f1f5f9" style={{ fontSize: isMobile ? '9px' : '11px' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-700 text-center">
                  <span className="text-base md:text-lg text-slate-400">
                    Based on <span className="text-cyan-400 font-bold text-lg md:text-xl">{turbulencePercentOfAll}%</span> incidents happened in turbulent conditions
                  </span>
                </div>
              </div>
            );
          })()}
        </div>

        <div id="wind-speed" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 mt-6 md:mt-8 scroll-mt-8 lg:scroll-mt-48">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Wind Speed</h2>
          
          {(() => {
            const windSpeedTotal = windSpeedStats?.['Total'] || 0;
            
            const getColorFromGradient = (index, total) => {
              const ratio = index / (total - 1);
              const green = { r: 34, g: 197, b: 94 };
              const orange = { r: 245, g: 158, b: 11 };
              const red = { r: 239, g: 68, b: 68 };
              
              let r, g, b;
              if (ratio < 0.5) {
                const localRatio = ratio * 2;
                r = Math.round(green.r + (orange.r - green.r) * localRatio);
                g = Math.round(green.g + (orange.g - green.g) * localRatio);
                b = Math.round(green.b + (orange.b - green.b) * localRatio);
              } else {
                const localRatio = (ratio - 0.5) * 2;
                r = Math.round(orange.r + (red.r - orange.r) * localRatio);
                g = Math.round(orange.g + (red.g - orange.g) * localRatio);
                b = Math.round(orange.b + (red.b - orange.b) * localRatio);
              }
              
              return `rgb(${r}, ${g}, ${b})`;
            };
            
            const filteredPacks = windSpeedFilterPacks.filter(p => p.name !== 'Total');
            const windSpeedChartData = filteredPacks.map((p, index) => ({
                name: p.name + ' m/s',
                value: windSpeedStats?.[p.name] || 0,
                percent: windSpeedTotal > 0 ? ((windSpeedStats?.[p.name] || 0) / windSpeedTotal) * 100 : 0,
                filterPack: p,
                color: getColorFromGradient(index, filteredPacks.length)
              }));

            const handleWindSpeedClick = (data) => {
              if (isTouchDevice) {
                if (activeTooltip === `windspeed-${data?.name}`) {
                  if (data?.filterPack) {
                    navigate(buildFilterUrl(data.filterPack));
                  }
                } else {
                  setActiveTooltip(`windspeed-${data?.name}`);
                  setTimeout(() => setActiveTooltip(null), 3000);
                }
              } else {
                if (data?.filterPack) {
                  navigate(buildFilterUrl(data.filterPack));
                }
              }
            };

            const allIncidentsTotal = barStats?.['Total'] || 0;
            const windSpeedPercentOfAll = allIncidentsTotal > 0 ? ((windSpeedTotal / allIncidentsTotal) * 100).toFixed(0) : 0;

            return (
              <div>
                <div className="h-[320px] md:h-[370px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={windSpeedChartData} margin={{ left: 0, right: 0, top: 20, bottom: 10 }}>
                      <XAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="#64748b" 
                        interval={0} 
                        style={{ fontSize: isMobile ? '9px' : '11px', fill: '#e2e8f0' }}
                      />
                      <YAxis type="number" tickFormatter={(v) => `${v}%`} stroke="#64748b" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                      <Tooltip
                        trigger={isTouchDevice ? 'click' : 'hover'}
                        formatter={(value) => `${value.toFixed(1)}%`}
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f1f5f9'
                        }}
                      />
                      <Bar dataKey="percent" radius={[4, 4, 0, 0]} onClick={handleWindSpeedClick} style={{ cursor: 'pointer' }} isAnimationActive={false}>
                        {windSpeedChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList dataKey="percent" position="top" formatter={(v) => `${v.toFixed(0)}%`} fill="#f1f5f9" style={{ fontSize: isMobile ? '9px' : '11px' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-700 text-center space-y-2">
                  <div className="text-base md:text-lg text-slate-400">
                    Based on <span className="text-sky-400 font-bold text-lg md:text-xl">{windSpeedPercentOfAll}%</span> incidents with known wind speed
                  </div>
                  {windSpeedPercentile !== null && (
                    <div className="text-base md:text-lg text-slate-400">
                      60% of incidents happened with wind speed higher than <span className="text-sky-400 font-bold text-lg md:text-xl">{windSpeedPercentile}</span> meters/second
                    </div>
                  )}
                </div>
              </div>
            );
          })()}
        </div>

        {severityFilter !== 'fatal' && (
          <div id="reserve-usage" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 mt-6 md:mt-8 scroll-mt-8 lg:scroll-mt-48">
            <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Reserve Usage</h2>
            
            {(() => {
              const total = reserveStats?.['Total'] || 0;
              const attempted = reserveStats?.['Attempted'] || 0;
              const fullyOpened = reserveStats?.['FullyOpened'] || 0;
              const notOpened = reserveStats?.['NotOpened'] || 0;
              const attemptedRate = total > 0 ? (attempted / total * 100).toFixed(0) : 0;
              const successRate = attempted > 0 ? (fullyOpened / attempted * 100).toFixed(0) : 0;

              const reserveChartData = [
                { name: 'Attempted to throw', percent: total > 0 ? (attempted / total * 100) : 0, filterPack: reserveFilterPacks.find(p => p.name === 'Attempted') },
                { name: 'Fully opened', percent: total > 0 ? (fullyOpened / total * 100) : 0, filterPack: reserveFilterPacks.find(p => p.name === 'FullyOpened') },
                { name: 'Not opened', percent: total > 0 ? (notOpened / total * 100) : 0, filterPack: reserveFilterPacks.find(p => p.name === 'NotOpened') }
              ];

              const handleReserveClick = (data) => {
                if (isTouchDevice) {
                  if (activeTooltip === `reserve-${data?.name}`) {
                    if (data?.filterPack) {
                      navigate(buildFilterUrl(data.filterPack));
                    }
                  } else {
                    setActiveTooltip(`reserve-${data?.name}`);
                    setTimeout(() => setActiveTooltip(null), 3000);
                  }
                } else {
                  if (data?.filterPack) {
                    navigate(buildFilterUrl(data.filterPack));
                  }
                }
              };

              return (
                <div>
                  <div className="h-[180px] md:h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={reserveChartData} layout="vertical" margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                        <XAxis type="number" tickFormatter={(v) => `${v}%`} stroke="#64748b" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                        <YAxis type="category" dataKey="name" width={100} stroke="#64748b" interval={0} style={{ fontSize: isMobile ? '9px' : '11px' }} tick={{ width: 100 }} />
                        <Tooltip
                          trigger={isTouchDevice ? 'click' : 'hover'}
                          formatter={(value) => `${value.toFixed(1)}%`}
                          contentStyle={{
                            backgroundColor: '#1e293b',
                            border: '1px solid #334155',
                            borderRadius: '8px',
                            color: '#f1f5f9'
                          }}
                        />
                        <Bar dataKey="percent" fill="#10b981" radius={[0, 4, 4, 0]} onClick={handleReserveClick} style={{ cursor: 'pointer' }} isAnimationActive={false}>
                          <LabelList dataKey="percent" position="right" formatter={(v) => `${v.toFixed(0)}%`} fill="#f1f5f9" style={{ fontSize: isMobile ? '9px' : '11px' }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-700 text-center space-y-2">
                    <div className="text-base md:text-lg text-slate-400">
                      Only <span className="text-emerald-400 font-bold text-lg md:text-xl">{attemptedRate}%</span> attempted to throw
                    </div>
                    <div className="text-base md:text-lg text-slate-400">
                      <span className="text-emerald-400 font-bold text-lg md:text-xl">{successRate}%</span> of all throws were successful
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        <div id="trim-position" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 mt-6 md:mt-8 scroll-mt-8 lg:scroll-mt-48">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Trim Position</h2>
          
          {(() => {
            const total = trimStats?.['Total'] || 0;
            const unknown = trimStats?.['Unknown'] || 0;
            const trimOut = trimStats?.['TrimOut'] || 0;
            const partiallyOpen = trimStats?.['PartiallyOpen'] || 0;
            const trimIn = trimStats?.['TrimIn'] || 0;

            const knownTotal = trimOut + partiallyOpen + trimIn;
            const knownPercent = total > 0 ? (knownTotal / total * 100).toFixed(0) : 0;
            const unknownPercent = total > 0 ? (unknown / total * 100).toFixed(0) : 0;

            const trimChartData = [
              { name: 'Trim-out (open)', percent: knownTotal > 0 ? (trimOut / knownTotal * 100) : 0, filterPack: trimFilterPacks.find(p => p.name === 'TrimOut') },
              { name: 'Partially open', percent: knownTotal > 0 ? (partiallyOpen / knownTotal * 100) : 0, filterPack: trimFilterPacks.find(p => p.name === 'PartiallyOpen') },
              { name: 'Trim-in (closed)', percent: knownTotal > 0 ? (trimIn / knownTotal * 100) : 0, filterPack: trimFilterPacks.find(p => p.name === 'TrimIn') }
            ];

            const handleTrimClick = (data) => {
              if (isTouchDevice) {
                if (activeTooltip === `trim-${data?.name}`) {
                  if (data?.filterPack) {
                    navigate(buildFilterUrl(data.filterPack));
                  }
                } else {
                  setActiveTooltip(`trim-${data?.name}`);
                  setTimeout(() => setActiveTooltip(null), 3000);
                }
              } else {
                if (data?.filterPack) {
                  navigate(buildFilterUrl(data.filterPack));
                }
              }
            };

            return (
              <div>
                <div className="h-[180px] md:h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trimChartData} layout="vertical" margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                      <XAxis type="number" tickFormatter={(v) => `${v}%`} stroke="#64748b" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                      <YAxis type="category" dataKey="name" width={100} stroke="#64748b" interval={0} style={{ fontSize: isMobile ? '9px' : '11px' }} tick={{ width: 100 }} />
                      <Tooltip
                        trigger={isTouchDevice ? 'click' : 'hover'}
                        formatter={(value) => `${value.toFixed(1)}%`}
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f1f5f9'
                        }}
                      />
                      <Bar dataKey="percent" fill="#8b5cf6" radius={[0, 4, 4, 0]} onClick={handleTrimClick} style={{ cursor: 'pointer' }} isAnimationActive={false}>
                        <LabelList dataKey="percent" position="right" formatter={(v) => `${v.toFixed(0)}%`} fill="#f1f5f9" style={{ fontSize: isMobile ? '9px' : '11px' }} />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-700 text-center">
                  <span className="text-sm md:text-base lg:text-lg text-slate-400">
                    Based on <span className="text-violet-400 font-bold">{knownPercent}%</span> incidents with known trim position. Unknown: <span className="text-slate-300">{unknownPercent}%</span>
                  </span>
                </div>
              </div>
            );
          })()}
        </div>

        <div id="by-country" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 mt-6 md:mt-8 scroll-mt-8 lg:scroll-mt-48">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Incidents by Country</h2>
          
          {(() => {
            const total = countryStats?.reduce((sum, c) => sum + c.count, 0) || 0;
            const countryChartData = (countryStats || []).map(c => {
              const code = getCountryCode(c.country);
              return {
                name: `${getFlag(code)} ${code}`,
                fullName: c.country,
                count: c.count,
                percent: total > 0 ? (c.count / total * 100) : 0
              };
            });

            const handleCountryClick = (data) => {
              if (isTouchDevice) {
                if (activeTooltip === `country-${data?.name}`) {
                  if (data?.fullName) {
                    const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
                    const filterPack = {
                      include: { ...baseFilter, country: data.fullName },
                      exclude: {}
                    };
                    navigate(buildFilterUrl(filterPack));
                  }
                } else {
                  setActiveTooltip(`country-${data?.name}`);
                  setTimeout(() => setActiveTooltip(null), 3000);
                }
              } else {
                if (data?.fullName) {
                  const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
                  const filterPack = {
                    include: { ...baseFilter, country: data.fullName },
                    exclude: {}
                  };
                  navigate(buildFilterUrl(filterPack));
                }
              }
            };

            return (
              <div className="h-[250px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={countryChartData} margin={{ left: 0, right: 0, top: 20, bottom: 5 }}>
                    <XAxis type="category" dataKey="name" stroke="#64748b" interval={0} style={{ fontSize: isMobile ? '10px' : '12px' }} />
                    <YAxis type="number" stroke="#64748b" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                    <Tooltip
                      trigger={isTouchDevice ? 'click' : 'hover'}
                      formatter={(value, name, props) => [value, props.payload.fullName]}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} onClick={handleCountryClick} style={{ cursor: 'pointer' }} isAnimationActive={false}>
                      <LabelList dataKey="count" position="top" fill="#f1f5f9" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })()}
        </div>

        <div id="by-year" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 mt-6 md:mt-8 scroll-mt-8 lg:scroll-mt-48">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Incidents by Year</h2>
          
          {(() => {
            const yearChartData = (yearStats || []).map(y => ({
              year: y.year,
              count: y.count
            }));

            const handleYearClick = (data) => {
              if (isTouchDevice) {
                if (activeTooltip === `year-${data?.year}`) {
                  if (data?.year) {
                    const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
                    const filterPack = {
                      include: { ...baseFilter, date_from: `${data.year}-01`, date_to: `${data.year}-12` },
                      exclude: {}
                    };
                    navigate(buildFilterUrl(filterPack));
                  }
                } else {
                  setActiveTooltip(`year-${data?.year}`);
                  setTimeout(() => setActiveTooltip(null), 3000);
                }
              } else {
                if (data?.year) {
                  const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
                  const filterPack = {
                    include: { ...baseFilter, date_from: `${data.year}-01`, date_to: `${data.year}-12` },
                    exclude: {}
                  };
                  navigate(buildFilterUrl(filterPack));
                }
              }
            };

            return (
              <div className="h-[250px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={yearChartData} margin={{ left: 0, right: 0, top: 20, bottom: 5 }}>
                    <XAxis type="category" dataKey="year" stroke="#64748b" interval={isMobile ? 'preserveStartEnd' : 0} tickFormatter={(value, index) => isMobile && index % 5 !== 0 ? '' : value} style={{ fontSize: isMobile ? '10px' : '12px' }} />
                    <YAxis type="number" stroke="#64748b" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                    <Tooltip
                      trigger={isTouchDevice ? 'click' : 'hover'}
                      formatter={(value) => [value, 'Incidents']}
                      contentStyle={{
                        backgroundColor: '#1e293b',
                        border: '1px solid #334155',
                        borderRadius: '8px',
                        color: '#f1f5f9'
                      }}
                    />
                    <Bar dataKey="count" fill="#14b8a6" radius={[4, 4, 0, 0]} onClick={handleYearClick} style={{ cursor: 'pointer' }} isAnimationActive={false}>
                      <LabelList dataKey="count" position="top" fill="#f1f5f9" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            );
          })()}
        </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

