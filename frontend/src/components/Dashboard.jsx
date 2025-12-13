import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LabelList } from 'recharts';
import { fetchDashboardStats } from '../api';

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
    exclude: { hardware_failure: true, pilot_actions: 'wrong_input_triggered', factor_powerline_collision: true }
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

export default function Dashboard() {
  const navigate = useNavigate();
  const [pieStats, setPieStats] = useState(null);
  const [barStats, setBarStats] = useState(null);
  const [reserveStats, setReserveStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const [pieData, barData, reserveData] = await Promise.all([
        fetchDashboardStats(PIE_FILTER_PACKS),
        fetchDashboardStats(BAR_FILTER_PACKS),
        fetchDashboardStats(RESERVE_FILTER_PACKS)
      ]);
      setPieStats(pieData);
      setBarStats(barData);
      setReserveStats(reserveData);
      setLoading(false);
    };

    loadStats();
  }, []);

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
    if (data?.filterPack) {
      navigate(buildFilterUrl(data.filterPack));
    }
  };

  const handleBarClick = (data) => {
    if (data?.filterPack) {
      navigate(buildFilterUrl(data.filterPack));
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-amber-400">Potentially Fatal Incidents</h1>
          <Link
            to="/"
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors"
          >
            ← Back to List
          </Link>
        </div>

        <div className="bg-slate-900 rounded-xl p-8 border border-slate-800">
          <h2 className="text-xl font-semibold mb-6 text-center">Primary Causes</h2>
          
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value} (${pieTotal > 0 ? ((value / pieTotal) * 100).toFixed(0) : 0}%)`}
                  outerRadius={120}
                  dataKey="value"
                  onClick={handlePieClick}
                  style={{ cursor: 'pointer' }}
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
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

        <div className="bg-slate-900 rounded-xl p-8 border border-slate-800 mt-8">
          <h2 className="text-xl font-semibold mb-6 text-center">Contributing Factors</h2>
          
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="#64748b" />
                <YAxis type="category" dataKey="name" width={150} stroke="#64748b" interval={0} />
                <Tooltip
                  formatter={(value) => `${value.toFixed(1)}%`}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Bar dataKey="percent" fill="#f97316" radius={[0, 4, 4, 0]} onClick={handleBarClick} style={{ cursor: 'pointer' }}>
                  <LabelList dataKey="percent" position="right" formatter={(v) => `${v.toFixed(0)}%`} fill="#f1f5f9" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 rounded-xl p-8 border border-slate-800 mt-8">
          <h2 className="text-xl font-semibold mb-6 text-center">Reserve Usage</h2>
          
          {(() => {
            const total = reserveStats?.['Total'] || 0;
            const attempted = reserveStats?.['Attempted'] || 0;
            const fullyOpened = reserveStats?.['FullyOpened'] || 0;
            const notOpened = reserveStats?.['NotOpened'] || 0;
            const successRate = attempted > 0 ? (fullyOpened / attempted * 100).toFixed(0) : 0;

            const reserveChartData = [
              { name: 'Attempted to throw', percent: total > 0 ? (attempted / total * 100) : 0, filterPack: RESERVE_FILTER_PACKS.find(p => p.name === 'Attempted') },
              { name: 'Fully opened', percent: total > 0 ? (fullyOpened / total * 100) : 0, filterPack: RESERVE_FILTER_PACKS.find(p => p.name === 'FullyOpened') },
              { name: 'Not opened', percent: total > 0 ? (notOpened / total * 100) : 0, filterPack: RESERVE_FILTER_PACKS.find(p => p.name === 'NotOpened') }
            ];

            const handleReserveClick = (data) => {
              if (data?.filterPack) {
                navigate(buildFilterUrl(data.filterPack));
              }
            };

            return (
              <div>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={reserveChartData} layout="vertical">
                      <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="#64748b" />
                      <YAxis type="category" dataKey="name" width={150} stroke="#64748b" interval={0} />
                      <Tooltip
                        formatter={(value) => `${value.toFixed(1)}%`}
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          color: '#f1f5f9'
                        }}
                      />
                      <Bar dataKey="percent" fill="#10b981" radius={[0, 4, 4, 0]} onClick={handleReserveClick} style={{ cursor: 'pointer' }}>
                        <LabelList dataKey="percent" position="right" formatter={(v) => `${v.toFixed(0)}%`} fill="#f1f5f9" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-700 text-center">
                  <span className="text-lg text-slate-400">
                    <span className="text-emerald-400 font-bold text-xl">{successRate}%</span> of all throws were successful
                  </span>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

