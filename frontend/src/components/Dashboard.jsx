import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import { fetchDashboardStats } from '../api';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6'];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      const filterPacks = [
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

      const data = await fetchDashboardStats(filterPacks);
      setStats(data);
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

  const total = stats['Total'] || 0;

  const chartData = [
    { name: 'Wrong Pilot Input', value: stats['Wrong Pilot Input'] || 0 },
    { name: 'Hardware Failure', value: stats['Hardware Failure'] || 0 },
    { name: 'Turbulent Conditions', value: stats['Turbulent Conditions'] || 0 },
    { name: 'Powerline Collision', value: stats['Powerline Collision'] || 0 },
  ];

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
          <h2 className="text-xl font-semibold mb-6 text-center">Causes Breakdown</h2>
          
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value} (${total > 0 ? ((value / total) * 100).toFixed(0) : 0}%)`}
                  outerRadius={120}
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
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
                <Legend
                  wrapperStyle={{ color: '#f1f5f9' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-8 mb-6 bg-slate-800/50 rounded-lg p-4 text-center">
            <div className="text-4xl font-bold text-slate-200">{total}</div>
            <div className="text-sm text-slate-400 mt-1">Total Potentially Fatal Incidents</div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            {chartData.map((item, index) => (
              <div
                key={item.name}
                className="bg-slate-800 rounded-lg p-4 text-center border-l-4"
                style={{ borderLeftColor: COLORS[index] }}
              >
                <div className="text-3xl font-bold" style={{ color: COLORS[index] }}>
                  {item.value}
                </div>
                <div className="text-xs text-slate-500">
                  {total > 0 ? `${((item.value / total) * 100).toFixed(0)}%` : '0%'}
                </div>
                <div className="text-sm text-slate-400 mt-1">{item.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

