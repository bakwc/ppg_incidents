import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Cell } from 'recharts';
import { fetchDashboardStats } from '../../api';
import { 
  COLORS, 
  getSurvivabilityFilterPacks, 
  getSurvivabilityFatalFilterPacks, 
  getReserveFilterPacks, 
  getTrimFilterPacks,
  buildFilterUrl 
} from './dashboardUtils';

export default function SafetyEquipmentDashboard({ 
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
  const [survivabilityStats, setSurvivabilityStats] = useState(null);
  const [survivabilityFatalStats, setSurvivabilityFatalStats] = useState(null);
  const [reserveStats, setReserveStats] = useState(null);
  const [trimStats, setTrimStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      
      const [survivabilityData, survivabilityFatalData, reserveData, trimData] = await Promise.all([
        fetchDashboardStats(getSurvivabilityFilterPacks(yearFilter, confidenceFilter)),
        fetchDashboardStats(getSurvivabilityFatalFilterPacks(yearFilter, confidenceFilter)),
        fetchDashboardStats(getReserveFilterPacks(severityFilter, yearFilter, confidenceFilter)),
        fetchDashboardStats(getTrimFilterPacks(severityFilter, yearFilter, confidenceFilter))
      ]);
      
      setSurvivabilityStats(survivabilityData);
      setSurvivabilityFatalStats(survivabilityFatalData);
      setReserveStats(reserveData);
      setTrimStats(trimData);
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

  const survivabilityFilterPacks = getSurvivabilityFilterPacks(yearFilter, confidenceFilter);
  const survivabilityFatalFilterPacks = getSurvivabilityFatalFilterPacks(yearFilter, confidenceFilter);
  const reserveFilterPacks = getReserveFilterPacks(severityFilter, yearFilter, confidenceFilter);
  const trimFilterPacks = getTrimFilterPacks(severityFilter, yearFilter, confidenceFilter);

  if (survivabilityFilterPacks.length !== survivabilityFatalFilterPacks.length) {
    throw new Error(`FILTER PACK LENGTH MISMATCH: All=${survivabilityFilterPacks.length} vs Fatal=${survivabilityFatalFilterPacks.length}`);
  }
  
  survivabilityFilterPacks.forEach((pack, index) => {
    const fatalPack = survivabilityFatalFilterPacks[index];
    if (pack.name !== fatalPack.name) {
      throw new Error(`FILTER PACK NAME MISMATCH at index ${index}: All="${pack.name}" vs Fatal="${fatalPack.name}"`);
    }
  });
  
  const survivabilityChartData = survivabilityFilterPacks.map((p, index) => {
    const totalCount = survivabilityStats?.[p.name] || 0;
    const fatalCount = survivabilityFatalStats?.[p.name] || 0;
    
    if (totalCount > 0 && fatalCount === 0 && !survivabilityFatalStats) {
      throw new Error(`MISSING FATAL STATS DATA for "${p.name}"`);
    }
    
    const survivedCount = totalCount - fatalCount;
    const survivabilityPercent = totalCount > 0 ? (survivedCount / totalCount * 100) : 0;
    
    return {
      name: p.name,
      survivability: survivabilityPercent,
      totalCount: totalCount,
      fatalCount: fatalCount,
      survivedCount: survivedCount,
      filterPack: p,
      colorIndex: index
    };
  }).sort((a, b) => b.survivability - a.survivability);

  const handleSurvivabilityClick = (data) => {
    if (isTouchDevice) {
      if (activeTooltip === `survivability-${data?.name}`) {
        if (data?.filterPack) {
          navigate(buildFilterUrl(data.filterPack));
        }
      } else {
        setActiveTooltip(`survivability-${data?.name}`);
        setTimeout(() => setActiveTooltip(null), 3000);
      }
    } else {
      if (data?.filterPack) {
        navigate(buildFilterUrl(data.filterPack));
      }
    }
  };

  const total = reserveStats?.['Total'] || 0;
  
  if (reserveStats && total > 0) {
    reserveFilterPacks.forEach(p => {
      if (!(p.name in reserveStats)) {
        throw new Error(`MISSING STATS KEY: "${p.name}" not found in reserveStats. Available keys: ${Object.keys(reserveStats).join(', ')}`);
      }
    });
  }
  
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

  const trimTotal = trimStats?.['Total'] || 0;
  
  if (trimStats && trimTotal > 0) {
    trimFilterPacks.forEach(p => {
      if (!(p.name in trimStats)) {
        throw new Error(`MISSING STATS KEY: "${p.name}" not found in trimStats. Available keys: ${Object.keys(trimStats).join(', ')}`);
      }
    });
  }
  
  const unknown = trimStats?.['Unknown'] || 0;
  const trimOut = trimStats?.['TrimOut'] || 0;
  const partiallyOpen = trimStats?.['PartiallyOpen'] || 0;
  const trimIn = trimStats?.['TrimIn'] || 0;

  const knownTotal = trimOut + partiallyOpen + trimIn;
  const knownPercent = trimTotal > 0 ? (knownTotal / trimTotal * 100).toFixed(0) : 0;
  const unknownPercent = trimTotal > 0 ? (unknown / trimTotal * 100).toFixed(0) : 0;

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
    <div className="space-y-6 md:space-y-8">
      <div id="survivability" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 scroll-mt-8 lg:scroll-mt-48">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Survivability</h2>
        
        <div className="h-[280px] md:h-[330px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={survivabilityChartData} margin={{ left: 0, right: 0, top: 20, bottom: 5 }}>
              <XAxis 
                type="category" 
                dataKey="name" 
                stroke="#64748b" 
                interval={0}
                style={{ fontSize: isMobile ? '10px' : '12px' }}
              />
              <YAxis type="number" tickFormatter={(v) => `${v}%`} stroke="#64748b" style={{ fontSize: isMobile ? '10px' : '12px' }} />
              <Tooltip
                trigger={isTouchDevice ? 'click' : 'hover'}
                formatter={(value, name, props) => [
                  `${value.toFixed(1)}%`,
                  `Survived: ${props.payload.survivedCount} / Total: ${props.payload.totalCount}`
                ]}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
              />
              <Bar dataKey="survivability" radius={[4, 4, 0, 0]} onClick={handleSurvivabilityClick} style={{ cursor: 'pointer' }} isAnimationActive={false}>
                {survivabilityChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.colorIndex % COLORS.length]} />
                ))}
                <LabelList dataKey="survivability" position="top" formatter={(v) => `${v.toFixed(0)}%`} fill="#f1f5f9" style={{ fontSize: isMobile ? '10px' : '12px' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-700 text-center">
          <div className="text-base md:text-lg text-slate-400">
            How likely are you to survive in different scenarios
          </div>
        </div>
      </div>

      {severityFilter !== 'fatal' && (
        <div id="reserve-usage" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 scroll-mt-8 lg:scroll-mt-48">
          <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Reserve Usage</h2>
          
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
      )}

      <div id="trim-position" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 scroll-mt-8 lg:scroll-mt-48">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Trim Position</h2>
        
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

