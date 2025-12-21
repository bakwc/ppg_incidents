import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LabelList, Legend } from 'recharts';
import { fetchDashboardStats, fetchCountryStats, fetchYearStats } from '../api';
import { getCountryCode, getFlag } from '../countryUtils';
import { 
  getBaseFilter, 
  getPrimaryCauseTrendFilterPacks,
  buildFilterUrl 
} from './dashboardUtils';

export default function TrendsDistributionDashboard({ 
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
  const [primaryCauseTrendStats, setPrimaryCauseTrendStats] = useState(null);
  const [countryStats, setCountryStats] = useState(null);
  const [yearStats, setYearStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      const baseFilter = getBaseFilter(severityFilter, yearFilter, confidenceFilter);
      
      const trendFilterPacks = getPrimaryCauseTrendFilterPacks(severityFilter, confidenceFilter);
      const trendFetchPromises = trendFilterPacks.flatMap(period => 
        period.periods.map(p => fetchDashboardStats([{ name: `${period.name}|${p.cause}`, include: p.include, exclude: p.exclude }]))
      );
      
      const [...trendDataArray] = await Promise.all([
        ...trendFetchPromises
      ]);
      
      const countryData = await fetchCountryStats(baseFilter, {}, 10);
      const yearData = await fetchYearStats(baseFilter, {});
      
      const trendData = {};
      trendDataArray.forEach((data, index) => {
        const periodIndex = Math.floor(index / 6);
        const causeIndex = index % 6;
        const periodName = trendFilterPacks[periodIndex].name;
        const causeName = trendFilterPacks[periodIndex].periods[causeIndex].cause;
        const key = `${periodName}|${causeName}`;
        trendData[key] = data[key] || 0;
      });
      
      setPrimaryCauseTrendStats(trendData);
      setCountryStats(countryData);
      setYearStats(yearData);
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

  const trendFilterPacks = getPrimaryCauseTrendFilterPacks(severityFilter, confidenceFilter);
  
  const trendChartData = trendFilterPacks.map(period => {
    const row = { name: period.name };
    period.periods.forEach(p => {
      const key = `${period.name}|${p.cause}`;
      row[p.cause] = primaryCauseTrendStats?.[key] || 0;
    });
    return row;
  });

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
    <div className="space-y-6 md:space-y-8">
      <div id="primary-cause-trend" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 scroll-mt-8 lg:scroll-mt-48">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Primary Cause Trend</h2>
        
        <div className="h-[400px] md:h-[450px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendChartData} margin={{ left: 0, right: 0, top: 20, bottom: 5 }}>
              <XAxis type="category" dataKey="name" stroke="#64748b" interval={0} style={{ fontSize: isMobile ? '10px' : '12px' }} />
              <YAxis type="number" stroke="#64748b" style={{ fontSize: isMobile ? '10px' : '12px' }} />
              <Tooltip
                trigger={isTouchDevice ? 'click' : 'hover'}
                contentStyle={{
                  backgroundColor: '#1e293b',
                  border: '1px solid #334155',
                  borderRadius: '8px',
                  color: '#f1f5f9'
                }}
              />
              <Legend 
                wrapperStyle={{ fontSize: isMobile ? '11px' : '13px' }}
                iconType="square"
              />
              <Bar dataKey="Wrong Control Input" stackId="a" fill="#ef4444" isAnimationActive={false} />
              <Bar dataKey="Turbulence" stackId="a" fill="#f97316" isAnimationActive={false} />
              <Bar dataKey="Hardware Failure" stackId="a" fill="#eab308" isAnimationActive={false} />
              <Bar dataKey="Ground Starting" stackId="a" fill="#3b82f6" isAnimationActive={false} />
              <Bar dataKey="Powerline Collision" stackId="a" fill="#8b5cf6" isAnimationActive={false} />
              <Bar dataKey="Other" stackId="a" fill="#64748b" isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 md:mt-6 pt-4 md:pt-6 border-t border-slate-700 text-center">
          <div className="text-base md:text-lg text-slate-400">
            How primary causes have changed over time
          </div>
        </div>
      </div>

      <div id="by-country" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 scroll-mt-8 lg:scroll-mt-48">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Incidents by Country</h2>
        
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
      </div>

      <div id="by-year" className="bg-slate-900 rounded-xl p-4 md:p-6 xl:p-8 border border-slate-800 scroll-mt-8 lg:scroll-mt-48">
        <h2 className="text-lg md:text-xl font-semibold mb-4 md:mb-6 text-center">Incidents by Year</h2>
        
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

