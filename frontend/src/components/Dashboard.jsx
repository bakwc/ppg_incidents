import { useState, useEffect } from 'react';
import { useNavigate, Routes, Route, useLocation, Navigate } from 'react-router-dom';
import { fetchDashboardStats } from '../api';
import { getBaseFilter, getPieFilterPacks } from './dashboardUtils';
import CausesAnalysisDashboard from './CausesAnalysisDashboard';
import FlightConditionsDashboard from './FlightConditionsDashboard';
import SafetyEquipmentDashboard from './SafetyEquipmentDashboard';
import TrendsDistributionDashboard from './TrendsDistributionDashboard';

export default function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const [severityFilter, setSeverityFilter] = useState('potentially_fatal');
  const [yearFilter, setYearFilter] = useState('all_time');
  const [confidenceFilter, setConfidenceFilter] = useState('high');
  const [totalIncidents, setTotalIncidents] = useState(null);
  const [isTouchDevice, setIsTouchDevice] = useState(false);
  const [activeTooltip, setActiveTooltip] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeSection, setActiveSection] = useState('primary-causes');

  useEffect(() => {
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadTotal = async () => {
      const pieFilterPacks = getPieFilterPacks(severityFilter, yearFilter, confidenceFilter);
      const pieData = await fetchDashboardStats(pieFilterPacks);
      setTotalIncidents(pieData['Total'] || 0);
    };
    loadTotal();
  }, [severityFilter, yearFilter, confidenceFilter]);

  const menuStructure = [
    {
      id: 'causes-analysis',
      title: '📊 Causes & Analysis',
      path: '/dashboard/causes-analysis',
      sections: [
        { id: 'primary-causes', label: 'Primary Causes' },
        { id: 'contributing-factors', label: 'Contributing Factors' },
        { id: 'wrong-control-input-breakdown', label: 'Wrong Control Input' },
        { id: 'hardware-failure-breakdown', label: 'Hardware Failure' }
      ]
    },
    {
      id: 'flight-conditions',
      title: '🌤️ Flight Conditions',
      path: '/dashboard/flight-conditions',
      sections: [
        { id: 'flight-phase', label: 'Flight Phase' },
        { id: 'flight-altitude', label: 'Flight Altitude' },
        { id: 'turbulence-type', label: 'Turbulence Type' },
        { id: 'wind-speed', label: 'Wind Speed' }
      ]
    },
    {
      id: 'safety-equipment',
      title: '🪂 Safety & Equipment',
      path: '/dashboard/safety-equipment',
      sections: [
        { id: 'survivability', label: 'Survivability' },
        ...(severityFilter !== 'fatal' ? [{ id: 'reserve-usage', label: 'Reserve Usage' }] : []),
        { id: 'trim-position', label: 'Trim Position' }
      ]
    },
    {
      id: 'trends-distribution',
      title: '📈 Trends & Distribution',
      path: '/dashboard/trends-distribution',
      sections: [
        { id: 'primary-cause-trend', label: 'Primary Cause Trend' },
        { id: 'by-country', label: 'By Country' },
        { id: 'by-year', label: 'By Year' }
      ]
    }
  ];

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    const allSections = menuStructure.flatMap(cat => cat.sections);
    
    const handleScroll = () => {
      const sectionElements = allSections.map(s => document.getElementById(s.id));
      const scrollPosition = window.scrollY + 200;

      for (let i = sectionElements.length - 1; i >= 0; i--) {
        const section = sectionElements[i];
        if (section && section.offsetTop <= scrollPosition) {
          setActiveSection(allSections[i].id);
          break;
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [severityFilter]);

  const currentCategory = menuStructure.find(cat => location.pathname === cat.path)?.id || 'causes-analysis';
  const currentCategoryIndex = menuStructure.findIndex(cat => location.pathname === cat.path);
  const hasPrevious = currentCategoryIndex > 0;
  const hasNext = currentCategoryIndex < menuStructure.length - 1;
  const previousCategory = hasPrevious ? menuStructure[currentCategoryIndex - 1] : null;
  const nextCategory = hasNext ? menuStructure[currentCategoryIndex + 1] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="flex">
        {/* Left Sidebar Menu */}
        <div className="hidden lg:block lg:fixed lg:left-0 lg:top-16 lg:h-[calc(100vh-4rem)] lg:w-64 xl:w-72 bg-slate-900 border-r border-slate-800 p-4 xl:p-6 overflow-y-auto">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Dashboard</h2>
          <nav className="space-y-1">
            {menuStructure.map(category => {
              const isCurrentCategory = location.pathname === category.path;
              return (
                <div key={category.id} className="mb-4">
                  <button
                    onClick={() => navigate(category.path)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm font-semibold ${
                      isCurrentCategory
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'
                    }`}
                  >
                    {category.title}
                  </button>
                  <div className="mt-1.5 ml-3 pl-3 border-l-2 border-slate-700 space-y-1">
                    {category.sections.map(section => (
                      <button
                        key={section.id}
                        onClick={() => {
                          if (location.pathname !== category.path) {
                            navigate(category.path);
                            setTimeout(() => scrollToSection(section.id), 100);
                          } else {
                            scrollToSection(section.id);
                          }
                        }}
                        className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors text-xs ${
                          isCurrentCategory && activeSection === section.id
                            ? 'bg-amber-500/10 text-amber-400 font-medium'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {section.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="lg:ml-64 xl:ml-72 flex-1">
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
              {totalIncidents !== null && (
                <>
                  <div className="mb-6 md:mb-8 text-base md:text-lg text-slate-300">
                    <span className="font-bold">{totalIncidents}</span>
                    {' '}
                    {severityFilter === 'potentially_fatal' ? 'potentially fatal incidents' : severityFilter === 'fatal' ? 'fatal incidents' : 'incidents'}
                    {' '}
                    {yearFilter === 'all_time' ? '' : yearFilter === 'last_10_years' ? 'from the last 10 years ' : 'from the last 5 years '}
                    {confidenceFilter === 'high' && 'with high cause confidence'}
                  </div>
                  <div className="mb-6 md:mb-8 text-base md:text-lg text-slate-300">
                    Click on a column to view individual incidents.
                  </div>
                </>
              )}

              <Routes>
                <Route path="/" element={<Navigate to="/dashboard/causes-analysis" replace />} />
                <Route path="/causes-analysis" element={
                  <CausesAnalysisDashboard
                    severityFilter={severityFilter}
                    yearFilter={yearFilter}
                    confidenceFilter={confidenceFilter}
                    isMobile={isMobile}
                    isTouchDevice={isTouchDevice}
                    activeTooltip={activeTooltip}
                    setActiveTooltip={setActiveTooltip}
                    previousCategory={previousCategory}
                    nextCategory={nextCategory}
                    navigate={navigate}
                  />
                } />
                <Route path="/flight-conditions" element={
                  <FlightConditionsDashboard
                    severityFilter={severityFilter}
                    yearFilter={yearFilter}
                    confidenceFilter={confidenceFilter}
                    isMobile={isMobile}
                    isTouchDevice={isTouchDevice}
                    activeTooltip={activeTooltip}
                    setActiveTooltip={setActiveTooltip}
                    previousCategory={previousCategory}
                    nextCategory={nextCategory}
                    navigate={navigate}
                  />
                } />
                <Route path="/safety-equipment" element={
                  <SafetyEquipmentDashboard
                    severityFilter={severityFilter}
                    yearFilter={yearFilter}
                    confidenceFilter={confidenceFilter}
                    isMobile={isMobile}
                    isTouchDevice={isTouchDevice}
                    activeTooltip={activeTooltip}
                    setActiveTooltip={setActiveTooltip}
                    previousCategory={previousCategory}
                    nextCategory={nextCategory}
                    navigate={navigate}
                  />
                } />
                <Route path="/trends-distribution" element={
                  <TrendsDistributionDashboard
                    severityFilter={severityFilter}
                    yearFilter={yearFilter}
                    confidenceFilter={confidenceFilter}
                    isMobile={isMobile}
                    isTouchDevice={isTouchDevice}
                    activeTooltip={activeTooltip}
                    setActiveTooltip={setActiveTooltip}
                    previousCategory={previousCategory}
                    nextCategory={nextCategory}
                    navigate={navigate}
                  />
                } />
              </Routes>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
