import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, LabelList } from 'recharts';
import { fetchDashboardStats } from '../api';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6'];

const PIE_FILTER_PACKS = [
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
    exclude: { pilot_actions: 'wrong_input_triggered' }
  },
  {
    name: 'Turbulent Conditions',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', factor_turbulent_conditions: true },
    exclude: { hardware_failure: true, pilot_actions: 'wrong_input_triggered' }
  },
  {
    name: 'Powerline Collision',
    include: { potentially_fatal: true, cause_confidence: 'maximum,high', factor_powerline_collision: true }
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
    exclude: { }
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
  }
];

export default function Dashboard() {
  const [pieStats, setPieStats] = useState(null);
  const [barStats, setBarStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const [pieData, barData] = await Promise.all([
        fetchDashboardStats(PIE_FILTER_PACKS),
        fetchDashboardStats(BAR_FILTER_PACKS)
      ]);
      setPieStats(pieData);
      setBarStats(barData);
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
    .map(p => ({ name: p.name, value: pieStats[p.name] || 0 }));

  const barTotal = barStats['Total'] || 0;
  const barChartData = BAR_FILTER_PACKS
    .filter(p => p.name !== 'Total')
    .map(p => ({
      name: p.name,
      value: barStats[p.name] || 0,
      percent: barTotal > 0 ? ((barStats[p.name] || 0) / barTotal) * 100 : 0
    }))
    .sort((a, b) => b.percent - a.percent);

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
          
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barChartData} layout="vertical">
                <XAxis type="number" domain={[0, 100]} tickFormatter={(v) => `${v}%`} stroke="#64748b" />
                <YAxis type="category" dataKey="name" width={150} stroke="#64748b" />
                <Tooltip
                  formatter={(value) => `${value.toFixed(1)}%`}
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    color: '#f1f5f9'
                  }}
                />
                <Bar dataKey="percent" fill="#f97316" radius={[0, 4, 4, 0]}>
                  <LabelList dataKey="percent" position="right" formatter={(v) => `${v.toFixed(0)}%`} fill="#f1f5f9" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}

