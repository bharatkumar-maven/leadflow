import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar } from 'recharts';
import api from '../utils/api';
import { Users, TrendingUp, DollarSign, Target, Phone, Mail, MessageSquare, Zap } from 'lucide-react';

const COLORS = ['#6366f1', '#8b5cf6', '#a78bfa', '#7c3aed', '#4f46e5', '#3730a3'];
const STATUS_COLORS = { new: '#6366f1', contacted: '#8b5cf6', qualified: '#10b981', proposal: '#f59e0b', negotiation: '#ef4444', won: '#22c55e', lost: '#6b7280' };

function StatCard({ icon: Icon, label, value, sub, color = '#6366f1', trend }) {
  return (
    <div style={{ background: '#111128', border: '1px solid #1e1e3a', borderRadius: 12, padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 8 }}>{label}</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: '#fff', letterSpacing: '-1px' }}>{value}</div>
          {sub && <div style={{ fontSize: 12, color: '#4b5563', marginTop: 4 }}>{sub}</div>}
        </div>
        <div style={{ width: 44, height: 44, background: `${color}20`, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={22} color={color} />
        </div>
      </div>
      {trend && <div style={{ marginTop: 12, fontSize: 12, color: trend > 0 ? '#22c55e' : '#ef4444' }}>{trend > 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last month</div>}
    </div>
  );
}

export default function Dashboard() {
  const { data, isLoading } = useQuery({ queryKey: ['dashboard'], queryFn: () => api.get('/analytics/dashboard').then(r => r.data.data), refetchInterval: 60000 });
  const { data: funnelData } = useQuery({ queryKey: ['funnel'], queryFn: () => api.get('/analytics/funnel').then(r => r.data.funnel) });

  if (isLoading) return <div style={{ color: '#6b7280', padding: 20 }}>Loading dashboard...</div>;
  const d = data || {};

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ color: '#fff', fontSize: 24, fontWeight: 700, margin: '0 0 4px', letterSpacing: '-0.5px' }}>Dashboard</h1>
        <p style={{ color: '#6b7280', fontSize: 14, margin: 0 }}>Your lead pipeline at a glance</p>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
        <StatCard icon={Users} label="Total Leads" value={d.totalLeads || 0} sub={`${d.newLeads || 0} new this month`} color="#6366f1" />
        <StatCard icon={Target} label="Won This Month" value={d.wonLeads || 0} sub={`${d.conversionRate || 0}% conversion`} color="#22c55e" />
        <StatCard icon={DollarSign} label="Pipeline Value" value={`₹${((d.pipelineValue || 0) / 100000).toFixed(1)}L`} sub={`${d.pipelineCount || 0} active deals`} color="#f59e0b" />
        <StatCard icon={TrendingUp} label="New Today" value={d.newToday || 0} sub="Across all sources" color="#8b5cf6" />
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Lead trend */}
        <div style={{ background: '#111128', border: '1px solid #1e1e3a', borderRadius: 12, padding: 20 }}>
          <h3 style={{ color: '#e0e0e0', fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>Lead Trend (30 days)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={d.dailyLeads || []}>
              <defs><linearGradient id="grad" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
              <XAxis dataKey="_id" tick={{ fontSize: 11, fill: '#4b5563' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#4b5563' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 8, fontSize: 12 }} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={2} fill="url(#grad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Lead by status */}
        <div style={{ background: '#111128', border: '1px solid #1e1e3a', borderRadius: 12, padding: 20 }}>
          <h3 style={{ color: '#e0e0e0', fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>By Status</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={d.byStatus || []} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="count" nameKey="_id">
                {(d.byStatus || []).map((entry, i) => <Cell key={i} fill={STATUS_COLORS[entry._id] || COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 8, fontSize: 12 }} formatter={(v, n) => [v, n]} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: 8 }}>
            {(d.byStatus || []).map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#9ca3af' }}>
                <div style={{ width: 8, height: 8, borderRadius: 2, background: STATUS_COLORS[s._id] || COLORS[i % COLORS.length] }} />
                {s._id} ({s.count})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Source & Funnel row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* By Source */}
        <div style={{ background: '#111128', border: '1px solid #1e1e3a', borderRadius: 12, padding: 20 }}>
          <h3 style={{ color: '#e0e0e0', fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>Lead Sources</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={(d.bySource || []).slice(0, 6)} layout="vertical">
              <XAxis type="number" tick={{ fontSize: 10, fill: '#4b5563' }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="_id" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} width={80} />
              <Tooltip contentStyle={{ background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 8, fontSize: 12 }} />
              <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Activity */}
        <div style={{ background: '#111128', border: '1px solid #1e1e3a', borderRadius: 12, padding: 20 }}>
          <h3 style={{ color: '#e0e0e0', fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>Recent Activity</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {(d.recentActivity || []).slice(0, 6).map(lead => (
              <div key={lead._id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #1a1a2e' }}>
                <div style={{ width: 28, height: 28, background: '#1e1e3a', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#a78bfa', flexShrink: 0 }}>
                  {lead.name[0]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, color: '#e0e0e0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{lead.name}</div>
                  <div style={{ fontSize: 11, color: '#4b5563' }}>{lead.source}</div>
                </div>
                <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: `${STATUS_COLORS[lead.status]}20`, color: STATUS_COLORS[lead.status] }}>
                  {lead.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Follow-up stats */}
      {d.followUpStats && (
        <div style={{ background: '#111128', border: '1px solid #1e1e3a', borderRadius: 12, padding: 20 }}>
          <h3 style={{ color: '#e0e0e0', fontSize: 15, fontWeight: 600, margin: '0 0 16px' }}>Follow-up Performance</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 12 }}>
            {d.followUpStats.map(stat => (
              <div key={stat._id} style={{ background: '#0d0d1a', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 4, textTransform: 'capitalize' }}>
                  {stat._id === 'ai_call' ? '🤖 AI Call' : stat._id === 'email' ? '📧 Email' : stat._id === 'whatsapp' ? '💬 WhatsApp' : stat._id}
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#a78bfa' }}>{stat.sent || 0}</div>
                <div style={{ fontSize: 11, color: '#4b5563' }}>sent</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
