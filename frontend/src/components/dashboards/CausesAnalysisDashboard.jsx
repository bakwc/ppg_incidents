import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, LabelList, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchDashboardStats } from '../../api';
import { 
  COLORS, 
  getBaseFilter, 
  getPieFilterPacks, 
  getBarFilterPacks, 
  getWrongControlInputFilterPacks, 
  getHardwareFailureFilterPacks,
  buildFilterUrl 
} from './dashboardUtils';

export default function CausesAnalysisDashboard({ 
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
  const [pieStats, setPieStats] = useState(null);
  const [barStats, setBarStats] = useState(null);
  const [wrongControlInputStats, setWrongControlInputStats] = useState(null);
  const [hardwareFailureStats, setHardwareFailureStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      
      const [pieData, barData, wrongControlInputData, hardwareFailureData] = await Promise.all([
        fetchDashboardStats(getPieFilterPacks(severityFilter, yearFilter, confidenceFilter)),
        fetchDashboardStats(getBarFilterPacks(severityFilter, yearFilter, confidenceFilter)),
        fetchDashboardStats(getWrongControlInputFilterPacks(severityFilter, yearFilter, confidenceFilter)),
        fetchDashboardStats(getHardwareFailureFilterPacks(severityFilter, yearFilter, confidenceFilter))
      ]);
      
      setPieStats(pieData);
      setBarStats(barData);
      setWrongControlInputStats(wrongControlInputData);
      setHardwareFailureStats(hardwareFailureData);
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

  const pieFilterPacks = getPieFilterPacks(severityFilter, yearFilter, confidenceFilter);
  const barFilterPacks = getBarFilterPacks(severityFilter, yearFilter, confidenceFilter);
  const wrongControlInputFilterPacks = getWrongControlInputFilterPacks(severityFilter, yearFilter, confidenceFilter);
  const hardwareFailureFilterPacks = getHardwareFailureFilterPacks(severityFilter, yearFilter, confidenceFilter);

  const pieTotal = pieStats['Total'] || 0;
  
  if (pieStats && pieTotal > 0) {
    pieFilterPacks.forEach(p => {
      if (!(p.name in pieStats)) {
        throw new Error(`MISSING STATS KEY: "${p.name}" not found in pieStats. Available keys: ${Object.keys(pieStats).join(', ')}`);
      }
    });
  }
  
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
  
  if (barStats && barTotal > 0) {
    barFilterPacks.forEach(p => {
      if (!(p.name in barStats)) {
        throw new Error(`MISSING STATS KEY: "${p.name}" not found in barStats. Available keys: ${Object.keys(barStats).join(', ')}`);
      }
    });
  }
  
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

  const wrongControlInputTotal = wrongControlInputStats?.['Total'] || 0;
  
  if (wrongControlInputStats && wrongControlInputTotal > 0) {
    wrongControlInputFilterPacks.forEach(p => {
      if (!(p.name in wrongControlInputStats)) {
        throw new Error(`MISSING STATS KEY: "${p.name}" not found in wrongControlInputStats. Available keys: ${Object.keys(wrongControlInputStats).join(', ')}`);
      }
    });
  }
  
  const wrongControlInputChartData = wrongControlInputFilterPacks
    .filter(p => p.name !== 'Total')
    .map((p, index) => ({
      name: p.name,
      value: wrongControlInputStats?.[p.name] || 0,
      percent: wrongControlInputTotal > 0 ? ((wrongControlInputStats?.[p.name] || 0) / wrongControlInputTotal) * 100 : 0,
      filterPack: p,
      colorIndex: index
    }))
    .sort((a, b) => b.percent - a.percent);

  const handleWrongControlInputClick = (data) => {
    if (isTouchDevice) {
      if (activeTooltip === `wrongcontrol-${data?.name}`) {
        if (data?.filterPack) {
          navigate(buildFilterUrl(data.filterPack));
        }
      } else {
        setActiveTooltip(`wrongcontrol-${data?.name}`);
        setTimeout(() => setActiveTooltip(null), 3000);
      }
    } else {
      if (data?.filterPack) {
        navigate(buildFilterUrl(data.filterPack));
      }
    }
  };

  const allIncidentsTotal = barStats?.['Total'] || 0;
  const wrongControlInputPercentOfAll = allIncidentsTotal > 0 ? ((wrongControlInputTotal / allIncidentsTotal) * 100).toFixed(0) : 0;

  const hardwareFailureTotal = hardwareFailureStats?.['Total'] || 0;
  
  if (hardwareFailureStats && hardwareFailureTotal > 0) {
    hardwareFailureFilterPacks.forEach(p => {
      if (!(p.name in hardwareFailureStats)) {
        throw new Error(`MISSING STATS KEY: "${p.name}" not found in hardwareFailureStats. Available keys: ${Object.keys(hardwareFailureStats).join(', ')}`);
      }
    });
  }
  
  const hardwareFailureChartData = hardwareFailureFilterPacks
    .filter(p => p.name !== 'Total')
    .map((p, index) => ({
      name: p.name,
      value: hardwareFailureStats?.[p.name] || 0,
      percent: hardwareFailureTotal > 0 ? ((hardwareFailureStats?.[p.name] || 0) / hardwareFailureTotal) * 100 : 0,
      filterPack: p,
      colorIndex: index
    }))
    .sort((a, b) => b.percent - a.percent);

  const handleHardwareFailureClick = (data) => {
    if (isTouchDevice) {
      if (activeTooltip === `hardwarefailure-${data?.name}`) {
        if (data?.filterPack) {
          navigate(buildFilterUrl(data.filterPack));
        }
      } else {
        setActiveTooltip(`hardwarefailure-${data?.name}`);
        setTimeout(() => setActiveTooltip(null), 3000);
      }
    } else {
      if (data?.filterPack) {
        navigate(buildFilterUrl(data.filterPack));
      }
    }
  };

  const hardwareFailurePercentOfAll = allIncidentsTotal > 0 ? ((hardwareFailureTotal / allIncidentsTotal) * 100).toFixed(0) : 0;

  return (
    <div className="space-y-6 md:space-y-8">
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

      <div id="contributing-factors" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 scroll-mt-8 lg:scroll-mt-48">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Cause & Contributing Factors</h2>
        
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

      <div id="wrong-control-input-breakdown" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 scroll-mt-8 lg:scroll-mt-48">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Wrong Control Input - Breakdown</h2>
        
        <div className="h-[350px] md:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={wrongControlInputChartData} margin={{ left: 0, right: 0, top: 20, bottom: 90 }}>
              <XAxis 
                type="category" 
                dataKey="name" 
                stroke="#64748b" 
                interval={0} 
                angle={-45}
                textAnchor="end"
                height={90}
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
              <Bar dataKey="percent" radius={[4, 4, 0, 0]} onClick={handleWrongControlInputClick} style={{ cursor: 'pointer' }} isAnimationActive={false}>
                {wrongControlInputChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.colorIndex % COLORS.length]} />
                ))}
                <LabelList dataKey="percent" position="top" formatter={(v) => `${v.toFixed(0)}%`} fill="#f1f5f9" style={{ fontSize: isMobile ? '9px' : '11px' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-700 text-center">
          <span className="text-base md:text-lg text-slate-400">
            Based on <span className="text-orange-400 font-bold text-lg md:text-xl">{wrongControlInputPercentOfAll}%</span> incidents with wrong control input as primary cause ({wrongControlInputTotal} incidents)
          </span>
        </div>
      </div>

      <div id="hardware-failure-breakdown" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 scroll-mt-8 lg:scroll-mt-48">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Hardware Failure - Breakdown</h2>
        
        <div className="h-[350px] md:h-[400px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={hardwareFailureChartData} margin={{ left: 0, right: 0, top: 20, bottom: 90 }}>
              <XAxis 
                type="category" 
                dataKey="name" 
                stroke="#64748b" 
                interval={0} 
                angle={-45}
                textAnchor="end"
                height={90}
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
              <Bar dataKey="percent" radius={[4, 4, 0, 0]} onClick={handleHardwareFailureClick} style={{ cursor: 'pointer' }} isAnimationActive={false}>
                {hardwareFailureChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[entry.colorIndex % COLORS.length]} />
                ))}
                <LabelList dataKey="percent" position="top" formatter={(v) => `${v.toFixed(0)}%`} fill="#f1f5f9" style={{ fontSize: isMobile ? '9px' : '11px' }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-700 text-center">
          <span className="text-base md:text-lg text-slate-400">
            Based on <span className="text-orange-400 font-bold text-lg md:text-xl">{hardwareFailurePercentOfAll}%</span> incidents with hardware failure as primary cause ({hardwareFailureTotal} incidents)
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

