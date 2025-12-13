import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LabelList } from 'recharts';
import { fetchDashboardStats, fetchCountryStats, fetchYearStats } from '../api';
import { getCountryCode, getFlag } from '../countryUtils';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#ec4899', '#14b8a6', '#84cc16', '#6366f1'];

const PIE_FILTER_PACKS = [
  {
    name: 'Total',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high' },
    exclude: {}
  },
  {
    name: 'Wrong Control Input',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', primary_cause: 'wrong_control_input' },
    exclude: {}
  },
  {
    name: 'Hardware Failure',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', primary_cause: 'hardware_failure' },
    exclude: {}
  },
  {
    name: 'Turbulence',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', primary_cause: 'turbulence' },
    exclude: {}
  },
  {
    name: 'Powerline Collision / Near Miss',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', primary_cause: 'powerline_collision' },
    exclude: {}
  },
  {
    name: 'Midair Collision / Near Miss',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', primary_cause: 'midair_collision' },
    exclude: {}
  },
  {
    name: 'Water Landing',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', primary_cause: 'water_landing' },
    exclude: {}
  },
  {
    name: 'Lines & Brakes Issues',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', primary_cause: 'lines_brakes_issues' },
    exclude: {}
  },
  {
    name: 'Ground Starting',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', primary_cause: 'ground_starting' },
    exclude: {}
  },
  {
    name: 'Others',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high' },
    exclude: { primary_cause: 'wrong_control_input,hardware_failure,turbulence,powerline_collision,midair_collision,water_landing,lines_brakes_issues,ground_starting' }
  }
];

const RESERVE_FILTER_PACKS = [
  {
    name: 'Total',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high' },
    exclude: {}
  },
  {
    name: 'Attempted',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', reserve_use: 'no_time,tangled,partially_opened,fully_opened' },
    exclude: {}
  },
  {
    name: 'FullyOpened',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', reserve_use: 'fully_opened' },
    exclude: {}
  },
  {
    name: 'NotOpened',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', reserve_use: 'no_time,tangled,partially_opened' },
    exclude: {}
  }
];

const TRIM_FILTER_PACKS = [
  {
    name: 'Total',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high' },
    exclude: {}
  },
  {
    name: 'Unknown',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', factor_trimmer_position: 'null' },
    exclude: {}
  },
  {
    name: 'TrimOut',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', factor_trimmer_position: 'fully_open' },
    exclude: {}
  },
  {
    name: 'PartiallyOpen',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', factor_trimmer_position: 'partially_open' },
    exclude: {}
  },
  {
    name: 'TrimIn',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', factor_trimmer_position: 'closed' },
    exclude: {}
  }
];

const BAR_FILTER_PACKS = [
  {
    name: 'Total',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high' },
    exclude: {}
  },
  {
    name: 'Wrong Pilot Input',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', pilot_actions: 'wrong_input_triggered' },
    exclude: {}
  },
  {
    name: 'Hardware Failure',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', hardware_failure: true },
    exclude: { }
  },
  {
    name: 'Turbulent Conditions',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', factor_turbulent_conditions: true },
  },
  {
    name: 'Powerline Collision',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', factor_powerline_collision: true }
  },
  {
    name: 'Low Acro',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', factor_low_altitude: true, factor_maneuvers: true }
  },
  {
    name: 'Performed Maneuvers',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', factor_maneuvers: true }
  },
  {
    name: 'Water Landing',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', factor_water_landing: true }
  },
  {
    name: 'Wing Collapse',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', collapse: true }
  },
  {
    name: 'Spiral',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', factor_spiral_maneuver: true }
  },
  {
    name: 'Accelerator Engaged',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', factor_accelerator: 'partially_engaged,fully_engaged' }
  }
];

const TURBULENCE_FILTER_PACKS = [
  {
    name: 'Total',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', factor_turbulent_conditions: true },
    exclude: {}
  },
  {
    name: 'Rotor',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', factor_turbulent_conditions: true, factor_rotor_turbulence: true },
    exclude: {}
  },
  {
    name: 'Thermal Activity',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', factor_turbulent_conditions: true, factor_thermal_weather: true },
    exclude: {}
  },
  // {
  //   name: 'Wake Turbulence',
  //   include: { potentially_fatal: true, cause_confidence: 'maximum,high', factor_turbulent_conditions: true, factor_wake_turbulence: true },
  //   exclude: {}
  // },
  {
    name: 'Wind',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', factor_turbulent_conditions: true, wind_speed_ms_min: 3 },
    exclude: { factor_rotor_turbulence: true, factor_thermal_weather: true }
  },
  {
    name: 'Other',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', factor_turbulent_conditions: true },
    exclude: { factor_rotor_turbulence: true, factor_thermal_weather: true, wind_speed_ms_min: 3 }
  }
];

const buildFilterUrl = (filterPack) => {
  const params = new URLSearchParams();
  Object.entries(filterPack.include || {}).forEach(([key, value]) => {
    params.set(key, value);
  });
  Object.entries(filterPack.exclude || {}).forEach(([key, value]) => {
    params.set(`exclude_${key}`, value);
  });
  return `/?${params.toString()}`;
};

const SECTIONS = [
  { id: 'primary-causes', label: 'Primary Causes' },
  { id: 'contributing-factors', label: 'Contributing Factors' },
  { id: 'turbulence-type', label: 'Turbulence Type' },
  { id: 'reserve-usage', label: 'Reserve Usage' },
  { id: 'trim-position', label: 'Trim Position' },
  { id: 'by-country', label: 'By Country' },
  { id: 'by-year', label: 'By Year' }
];

export default function Dashboard() {
  const navigate = useNavigate();
  const [pieStats, setPieStats] = useState(null);
  const [barStats, setBarStats] = useState(null);
  const [turbulenceStats, setTurbulenceStats] = useState(null);
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
      const [pieData, barData, turbulenceData, reserveData, trimData, countryData, yearData] = await Promise.all([
        fetchDashboardStats(PIE_FILTER_PACKS),
        fetchDashboardStats(BAR_FILTER_PACKS),
        fetchDashboardStats(TURBULENCE_FILTER_PACKS),
        fetchDashboardStats(RESERVE_FILTER_PACKS),
        fetchDashboardStats(TRIM_FILTER_PACKS),
        fetchCountryStats({ potentially_fatal: true, cause_confidence: 'maximum,high' }, {}, 10),
        fetchYearStats({ potentially_fatal: true, cause_confidence: 'maximum,high' }, {})
      ]);
      setPieStats(pieData);
      setBarStats(barData);
      setTurbulenceStats(turbulenceData);
      setReserveStats(reserveData);
      setTrimStats(trimData);
      setCountryStats(countryData);
      setYearStats(yearData);
      setLoading(false);
    };

    loadStats();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      const sections = SECTIONS.map(s => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(SECTIONS[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

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

  const pieTotal = pieStats['Total'] || 0;
  const pieChartData = PIE_FILTER_PACKS
    .filter(p => p.name !== 'Total')
    .map(p => ({ name: p.name, value: pieStats[p.name] || 0, filterPack: p }));

  const barTotal = barStats['Total'] || 0;
  const barChartData = BAR_FILTER_PACKS
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
        <div className="hidden lg:block fixed left-0 top-0 h-screen w-48 xl:w-64 bg-slate-900 border-r border-slate-800 p-4 xl:p-6 overflow-y-auto">
          <div className="mb-6 xl:mb-8">
            <Link
              to="/"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors inline-block text-sm"
            >
              ← Back
            </Link>
          </div>
          
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
        <div className="lg:ml-48 xl:ml-64 flex-1 p-4 md:p-6 xl:p-8">
          {/* Mobile header with back button */}
          <div className="lg:hidden mb-4">
            <Link
              to="/"
              className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-sm"
            >
              ← Back to List
            </Link>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 md:mb-8">
              <h1 className="text-2xl md:text-3xl font-bold text-amber-400">Potentially Fatal Incidents</h1>
            </div>

            <div id="primary-causes" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 scroll-mt-8">
              <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Primary Causes</h2>
          
          <div className="h-[380px] md:h-[450px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart margin={{ left: 40, right: 20, top: 10, bottom: 10 }}>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                  label={({ name, percent, index, x, y, cx }) => {
                    const shortNames = {
                      'Wrong Control Input': 'Wrong Input',
                      'Hardware Failure': 'Hardware',
                      'Turbulence': 'Turbulence',
                      'Powerline Collision / Near Miss': 'Powerline',
                      'Midair Collision / Near Miss': 'Midair',
                      'Water Landing': 'Water',
                      'Lines & Brakes Issues': 'Lines/Brakes',
                      'Ground Starting': 'Ground Start',
                      'Others': 'Others'
                    };
                    return (
                      <text x={x} y={y} fill={COLORS[index % COLORS.length]} fontSize={isMobile ? 11 : 13} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                        {`${shortNames[name] || name} ${(percent * 100).toFixed(0)}%`}
                      </text>
                    );
                  }}
                  outerRadius="55%"
                  dataKey="value"
                  onClick={handlePieClick}
                  style={{ cursor: 'pointer' }}
                  isAnimationActive={false}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  trigger={isTouchDevice ? 'click' : 'hover'}
                  formatter={(value, name) => [`${value} (${pieTotal > 0 ? ((value / pieTotal) * 100).toFixed(0) : 0}%)`, name]}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div id="contributing-factors" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 mt-6 md:mt-8 scroll-mt-8">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Contributing Factors</h2>
          
          <div className="h-[350px] md:h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} layout="vertical" margin={{ left: 0, right: 10, top: 5, bottom: 5 }}>
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="#64748b" style={{ fontSize: isMobile ? '10px' : '12px' }} />
                <YAxis type="category" dataKey="name" width={80} stroke="#64748b" interval={0} style={{ fontSize: isMobile ? '9px' : '11px' }} tick={{ width: 80 }} />
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
                <Bar dataKey="percent" fill="#f97316" radius={[0, 4, 4, 0]} onClick={handleBarClick} style={{ cursor: 'pointer' }} isAnimationActive={false}>
                  <LabelList dataKey="percent" position="right" formatter={(v) => `${v.toFixed(0)}%`} fill="#f1f5f9" style={{ fontSize: isMobile ? '9px' : '11px' }} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div id="turbulence-type" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 mt-6 md:mt-8 scroll-mt-8">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Turbulence Type</h2>
          
          {(() => {
            const turbulenceTotal = turbulenceStats?.['Total'] || 0;
            const turbulenceChartData = TURBULENCE_FILTER_PACKS
              .filter(p => p.name !== 'Total')
              .map(p => ({
                name: p.name,
                value: turbulenceStats?.[p.name] || 0,
                percent: turbulenceTotal > 0 ? ((turbulenceStats?.[p.name] || 0) / turbulenceTotal) * 100 : 0,
                filterPack: p
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
                <div className="h-[350px] md:h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ left: 40, right: 20, top: 10, bottom: 10 }}>
                      <Pie
                        data={turbulenceChartData}
                        cx="50%"
                        cy="50%"
                        labelLine={{ stroke: '#64748b', strokeWidth: 1 }}
                        label={({ name, index, x, y, cx, payload }) => {
                          return (
                            <text x={x} y={y} fill={COLORS[index % COLORS.length]} fontSize={isMobile ? 11 : 13} textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
                              {`${name} ${payload.percent.toFixed(0)}%`}
                            </text>
                          );
                        }}
                        outerRadius="55%"
                        innerRadius="35%"
                        dataKey="value"
                        onClick={handleTurbulenceClick}
                        style={{ cursor: 'pointer' }}
                        isAnimationActive={false}
                      >
                        {turbulenceChartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        trigger={isTouchDevice ? 'click' : 'hover'}
                        formatter={(value, name) => [`${value} (${turbulenceTotal > 0 ? ((value / turbulenceTotal) * 100).toFixed(0) : 0}%)`, name]}
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f1f5f9'
                        }}
                      />
                    </PieChart>
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

        <div id="reserve-usage" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 mt-6 md:mt-8 scroll-mt-8">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Reserve Usage</h2>
          
          {(() => {
            const total = reserveStats?.['Total'] || 0;
            const attempted = reserveStats?.['Attempted'] || 0;
            const fullyOpened = reserveStats?.['FullyOpened'] || 0;
            const notOpened = reserveStats?.['NotOpened'] || 0;
            const attemptedRate = total > 0 ? (attempted / total * 100).toFixed(0) : 0;
            const successRate = attempted > 0 ? (fullyOpened / attempted * 100).toFixed(0) : 0;

            const reserveChartData = [
              { name: 'Attempted to throw', percent: total > 0 ? (attempted / total * 100) : 0, filterPack: RESERVE_FILTER_PACKS.find(p => p.name === 'Attempted') },
              { name: 'Fully opened', percent: total > 0 ? (fullyOpened / total * 100) : 0, filterPack: RESERVE_FILTER_PACKS.find(p => p.name === 'FullyOpened') },
              { name: 'Not opened', percent: total > 0 ? (notOpened / total * 100) : 0, filterPack: RESERVE_FILTER_PACKS.find(p => p.name === 'NotOpened') }
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
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="#64748b" style={{ fontSize: isMobile ? '10px' : '12px' }} />
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

        <div id="trim-position" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 mt-6 md:mt-8 scroll-mt-8">
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
              { name: 'Trim-out (open)', percent: knownTotal > 0 ? (trimOut / knownTotal * 100) : 0, filterPack: TRIM_FILTER_PACKS.find(p => p.name === 'TrimOut') },
              { name: 'Partially open', percent: knownTotal > 0 ? (partiallyOpen / knownTotal * 100) : 0, filterPack: TRIM_FILTER_PACKS.find(p => p.name === 'PartiallyOpen') },
              { name: 'Trim-in (closed)', percent: knownTotal > 0 ? (trimIn / knownTotal * 100) : 0, filterPack: TRIM_FILTER_PACKS.find(p => p.name === 'TrimIn') }
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
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="#64748b" style={{ fontSize: isMobile ? '10px' : '12px' }} />
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

        <div id="by-country" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 mt-6 md:mt-8 scroll-mt-8">
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
                    const params = new URLSearchParams();
                    params.set('potentially_fatal', 'true');
                    params.set('cause_confidence', 'maximum,high');
                    params.set('country', data.fullName);
                    navigate(`/?${params.toString()}`);
                  }
                } else {
                  setActiveTooltip(`country-${data?.name}`);
                  setTimeout(() => setActiveTooltip(null), 3000);
                }
              } else {
                if (data?.fullName) {
                  const params = new URLSearchParams();
                  params.set('potentially_fatal', 'true');
                  params.set('cause_confidence', 'maximum,high');
                  params.set('country', data.fullName);
                  navigate(`/?${params.toString()}`);
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

        <div id="by-year" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 mt-6 md:mt-8 scroll-mt-8">
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
                    const params = new URLSearchParams();
                    params.set('potentially_fatal', 'true');
                    params.set('cause_confidence', 'maximum,high');
                    params.set('date_from', `${data.year}-01`);
                    params.set('date_to', `${data.year}-12`);
                    navigate(`/?${params.toString()}`);
                  }
                } else {
                  setActiveTooltip(`year-${data?.year}`);
                  setTimeout(() => setActiveTooltip(null), 3000);
                }
              } else {
                if (data?.year) {
                  const params = new URLSearchParams();
                  params.set('potentially_fatal', 'true');
                  params.set('cause_confidence', 'maximum,high');
                  params.set('date_from', `${data.year}-01`);
                  params.set('date_to', `${data.year}-12`);
                  navigate(`/?${params.toString()}`);
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
  );
}

