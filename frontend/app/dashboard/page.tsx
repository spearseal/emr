'use client';

import { useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface KPIs {
  total_leads: number;
  new_leads_this_week: number;
  appointments_booked: number;
  appointments_showed: number;
  pipeline_value: number;
  deals_won: number;
  conversion_rate: number;
  last_updated: string;
}

const weeklyTrend = [
  { day: 'Mon', leads: 12, appts: 4 },
  { day: 'Tue', leads: 19, appts: 6 },
  { day: 'Wed', leads: 15, appts: 5 },
  { day: 'Thu', leads: 22, appts: 8 },
  { day: 'Fri', leads: 18, appts: 7 },
  { day: 'Sat', leads: 8, appts: 3 },
  { day: 'Sun', leads: 5, appts: 2 },
];

export default function Dashboard() {
  const [kpis, setKpis] = useState<KPIs | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchKPIs();
    const interval = setInterval(fetchKPIs, 300000);
    return () => clearInterval(interval);
  }, []);

  const fetchKPIs = async () => {
    try {
      const res = await fetch(\`\${API_URL}/api/kpis\`);
      if (!res.ok) throw new Error(\`Server error: \${res.status}\`);
      const data = await res.json();
      setKpis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load KPIs');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-gray-600">Loading KPIs...</div>;
  if (error) return <div className="p-10 text-red-600">Error: {error}</div>;
  if (!kpis) return null;

  const showRate = kpis.appointments_booked > 0
    ? ((kpis.appointments_showed / kpis.appointments_booked) * 100).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-gray-50 p-6 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">MedSpa Performance</h1>
          <p className="text-gray-500 mt-1">
            GoHighLevel Integration • Updated{' '}
            {new Date(kpis.last_updated).toLocaleTimeString()}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <Card label="Total Leads" value={kpis.total_leads.toLocaleString()} badge={\`+\${kpis.new_leads_this_week} this week\`} accent="blue" />
          <Card label="Pipeline Value" value={\`\$${kpis.pipeline_value.toLocaleString()}\`} badge={\`\${kpis.deals_won} deals won\`} accent="emerald" />
          <Card label="Appointments" value={kpis.appointments_booked.toString()} badge={\`\${showRate}% show rate\`} accent="violet" />
          <Card label="Conversion Rate" value={\`\${(kpis.conversion_rate * 100).toFixed(1)}%\`} badge="Lead → Closed" accent="amber" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Weekly Trend</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="leads" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Leads" />
                <Bar dataKey="appts" fill="#8b5cf6" radius={[4, 4, 0, 0]} name="Appointments" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-5">Conversion Funnel</h3>
            <div className="space-y-5">
              <FunnelBar label="Total Leads" value={kpis.total_leads} max={kpis.total_leads} color="bg-blue-500" />
              <FunnelBar label="Appointments Booked" value={kpis.appointments_booked} max={kpis.total_leads} color="bg-violet-500" />
              <FunnelBar label="Showed Up" value={kpis.appointments_showed} max={kpis.total_leads} color="bg-indigo-500" />
              <FunnelBar label="Deals Won" value={kpis.deals_won} max={kpis.total_leads} color="bg-emerald-500" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Card({ label, value, badge, accent }: {
  label: string; value: string; badge: string;
  accent: 'blue' | 'emerald' | 'violet' | 'amber';
}) {
  const accents: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-900',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-900',
    violet: 'border-violet-200 bg-violet-50 text-violet-900',
    amber: 'border-amber-200 bg-amber-50 text-amber-900',
  };
  return (
    <div className={\`rounded-xl border p-5 \${accents[accent]}\`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs font-medium mt-2 opacity-70">{badge}</p>
    </div>
  );
}

function FunnelBar({ label, value, max, color }: {
  label: string; value: number; max: number; color: string;
}) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-sm font-medium text-gray-700 mb-1">
        <span>{label}</span>
        <span>{value.toLocaleString()} <span className="text-gray-400">({pct.toFixed(0)}%)</span></span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-2.5">
        <div className={\`\${color} h-2.5 rounded-full transition-all duration-700\`} style={{ width: \`\${pct}%\` }} />
      </div>
    </div>
  );
}
