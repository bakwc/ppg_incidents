import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { fetchDashboardStats, fetchWindSpeedPercentile } from '../../api';
import { 
  COLORS, 
  getBaseFilter, 
  getFlightPhaseFilterPacks, 
  getAltitudeFilterPacks, 
  getTurbulenceFilterPacks, 
  getWindSpeedFilterPacks,
  buildFilterUrl 
} from './dashboardUtils';

export default function FlightConditionsDashboard({ 
  severityFilter, 
  yearFilter, 
  confidenceFilter,
  isMobile,
  isTouchDevice,
  activeTooltip,
  setActiveTooltip,
  previousCategory,
  nextCategory,
  navigate
}) {
  const [flightPhaseStats, setFlightPhaseStats] = useState(null);
  const [altitudeStats, setAltitudeStats] = useState(null);
  const [turbulenceStats, setTurbulenceStats] = useState(null);
  const [windSpeedStats, setWindSpeedStats] = useState(null);
  const [windSpeedPercentile, setWindSpeedPercentile] = useState(null);
  const [barStats, setBarStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
      
      const [flightPhaseData, altitudeData, turbulenceData, windSpeedData, windPercentileData, totalData] = await Promise.all([
        fetchDashboardStats(getFlightPhaseFilterPacks(severityFilter, yearFilter, confidenceFilter)),
        fetchDashboardStats(getAltitudeFilterPacks(severityFilter, yearFilter, confidenceFilter)),
        fetchDashboardStats(getTurbulenceFilterPacks(severityFilter, yearFilter, confidenceFilter)),
        fetchDashboardStats(getWindSpeedFilterPacks(severityFilter, yearFilter, confidenceFilter)),
        fetchWindSpeedPercentile(baseFilter, {}, 40),
        fetchDashboardStats([{ name: 'Total', include: { ...baseFilter }, exclude: {} }])
      ]);
      
      setFlightPhaseStats(flightPhaseData);
      setAltitudeStats(altitudeData);
      setTurbulenceStats(turbulenceData);
      setWindSpeedStats(windSpeedData);
      setWindSpeedPercentile(windPercentileData.percentile_value);
      setBarStats(totalData);
      setLoading(false);
    };

    loadStats();
  }, [severityFilter, yearFilter, confidenceFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  const flightPhaseFilterPacks = getFlightPhaseFilterPacks(severityFilter, yearFilter, confidenceFilter);
  const altitudeFilterPacks = getAltitudeFilterPacks(severityFilter, yearFilter, confidenceFilter);
  const turbulenceFilterPacks = getTurbulenceFilterPacks(severityFilter, yearFilter, confidenceFilter);
  const windSpeedFilterPacks = getWindSpeedFilterPacks(severityFilter, yearFilter, confidenceFilter);

  const flightPhaseTotal = flightPhaseStats?.['Total'] || 0;
  
  if (flightPhaseStats && flightPhaseTotal > 0) {
    flightPhaseFilterPacks.forEach(p => {
      if (!(p.name in flightPhaseStats)) {
        throw new Error(`MISSING STATS KEY: "${p.name}" not found in flightPhaseStats. Available keys: ${Object.keys(flightPhaseStats).join(', ')}`);
      }
    });
  }
  
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

  const altitudeTotal = altitudeStats?.['Total'] || 0;
  
  if (altitudeStats && altitudeTotal > 0) {
    altitudeFilterPacks.forEach(p => {
      if (!(p.name in altitudeStats)) {
        throw new Error(`MISSING STATS KEY: "${p.name}" not found in altitudeStats. Available keys: ${Object.keys(altitudeStats).join(', ')}`);
      }
    });
  }
  
  const altitudeLabels = {
    '0-15': { meters: '0-15 m', feet: '0-49 ft' },
    '15-50': { meters: '15-50 m', feet: '49-164 ft' },
    '50-100': { meters: '50-100 m', feet: '164-328 ft' },
    '100-200': { meters: '100-200 m', feet: '328-656 ft' },
    '200-500': { meters: '200-500 m', feet: '656-1640 ft' },
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

  const turbulenceTotal = turbulenceStats?.['Total'] || 0;
  
  if (turbulenceStats && turbulenceTotal > 0) {
    turbulenceFilterPacks.forEach(p => {
      if (!(p.name in turbulenceStats)) {
        throw new Error(`MISSING STATS KEY: "${p.name}" not found in turbulenceStats. Available keys: ${Object.keys(turbulenceStats).join(', ')}`);
      }
    });
  }
  
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

  const turbulencePercentOfAll = allIncidentsTotal > 0 ? ((turbulenceTotal / allIncidentsTotal) * 100).toFixed(0) : 0;

  const windSpeedTotal = windSpeedStats?.['Total'] || 0;
  
  if (windSpeedStats && windSpeedTotal > 0) {
    windSpeedFilterPacks.forEach(p => {
      if (!(p.name in windSpeedStats)) {
        throw new Error(`MISSING STATS KEY: "${p.name}" not found in windSpeedStats. Available keys: ${Object.keys(windSpeedStats).join(', ')}`);
      }
    });
  }
  
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
  
  const windSpeedLabels = {
    '0-1': { ms: '0-1 m/s', mph: '0-2 mph' },
    '1-2': { ms: '1-2 m/s', mph: '2-4 mph' },
    '2-3': { ms: '2-3 m/s', mph: '4-7 mph' },
    '3-4': { ms: '3-4 m/s', mph: '7-9 mph' },
    '4-6': { ms: '4-6 m/s', mph: '9-13 mph' },
    '6-8': { ms: '6-8 m/s', mph: '13-18 mph' },
    '8+': { ms: '8+ m/s', mph: '18+ mph' }
  };
  
  const filteredPacks = windSpeedFilterPacks.filter(p => p.name !== 'Total');
  const windSpeedChartData = filteredPacks.map((p, index) => ({
      name: p.name,
      displayName: windSpeedLabels[p.name]?.ms || p.name,
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

  const CustomWindSpeedTick = ({ x, y, payload }) => {
    const labels = windSpeedLabels[payload.value];
    if (!labels) return null;
    
    return (
      <g transform={`translate(${x},${y})`}>
        <text x={0} y={0} dy={10} textAnchor="middle" fill="#64748b" fontSize={isMobile ? 9 : 11}>
          {labels.ms}
        </text>
        <text x={0} y={0} dy={22} textAnchor="middle" fill="#64748b" fontSize={isMobile ? 8 : 10}>
          {labels.mph}
        </text>
      </g>
    );
  };

  const windSpeedPercentOfAll = allIncidentsTotal > 0 ? ((windSpeedTotal / allIncidentsTotal) * 100).toFixed(0) : 0;

  return (
    <div className="space-y-6 md:space-y-8">
      <div id="flight-phase" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 scroll-mt-8 lg:scroll-mt-48">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Flight Phase</h2>
        
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
      </div>

      <div id="flight-altitude" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 scroll-mt-8 lg:scroll-mt-48">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Flight Altitude</h2>
        
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

      <div id="turbulence-type" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 scroll-mt-8 lg:scroll-mt-48">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Turbulence Type</h2>
        
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

      <div id="wind-speed" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 scroll-mt-8 lg:scroll-mt-48">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Wind Speed</h2>
        
        <div className="h-[320px] md:h-[370px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={windSpeedChartData} margin={{ left: 0, right: 0, top: 20, bottom: 35 }}>
              <XAxis 
                type="category" 
                dataKey="name" 
                stroke="#64748b" 
                interval={0} 
                tick={<CustomWindSpeedTick />}
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
              60% of incidents happened with wind speed higher than <span className="text-sky-400 font-bold text-lg md:text-xl">{windSpeedPercentile} m/s ({(windSpeedPercentile * 2.237).toFixed(1)} mph)</span>
            </div>
          )}
        </div>
      </div>

      {/* Navigation Buttons */}
      <div className="flex justify-center items-center gap-4 pt-6 mt-6 border-t border-slate-800">
        {previousCategory && (
          <button
            onClick={() => {
              navigate(previousCategory.path);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex flex-col items-center gap-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <span className="text-amber-400 font-semibold">← Previous</span>
            <span className="text-xs text-slate-400">{previousCategory.title}</span>
          </button>
        )}
        {nextCategory && (
          <button
            onClick={() => {
              navigate(nextCategory.path);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex flex-col items-center gap-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
          >
            <span className="text-amber-400 font-semibold">Next →</span>
            <span className="text-xs text-slate-400">{nextCategory.title}</span>
          </button>
        )}
      </div>
    </div>
  );
}

