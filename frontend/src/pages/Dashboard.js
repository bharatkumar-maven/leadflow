import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import api from '../utils/api';
import toast from 'react-hot-toast';

const COLORS = ['#6c63ff','#06b6d4','#f59e0b','#ec4899','#22c55e','#ef4444'];
const STATUS_ORDER = ['new','contacted','qualified','proposal','negotiation','won','lost'];

export default function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [pipeline, setPipeline] = useState([]);
  const [sources, setSources] = useState([]);
  const [feed, setFeed] = useState([]);
  const [insights, setInsights] = useState('');
  const [loadingInsights, setLoadingInsights] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      api.get('/analytics/overview'),
      api.get('/analytics/pipeline'),
      api.get('/analytics/sources'),
      api.get('/analytics/activity-feed')
    ]).then(([o, p, s, f]) => {
      setOverview(o.data);
      const sorted = STATUS_ORDER.map(s => ({ status: s, count: 0, totalValue: 0, ...p.data.find(x=>x.status===s) }));
      setPipeline(sorted);
      setSources(s.data);
      setFeed(f.data.slice(0,10));
    }).catch(() => toast.error('Failed to load dashboard'));
  }, []);

  const loadInsights = async () => {
    setLoadingInsights(true);
    try {
      const { data } = await api.post('/ai/analyze');
      setInsights(data.insights);
    } catch { toast.error('AI insights unavailable'); }
    finally { setLoadingInsights(false); }
  };

  const CHANNEL_ICONS = { email: '📧', whatsapp: '💬', sms: '📱', call: '📞', ai_call: '🤖', note: '📝', status_change: '🔄', created: '✨' };

  if (!overview) return <div className="loading-screen"><div className="spinner"/></div>;

  const stats = [
    { label: 'Total Leads', value: overview.total, icon: '👥', color: 'var(--accent)' },
    { label: 'New Leads', value: overview.newLeads, icon: '✨', color: 'var(--cyan)' },
    { label: 'Qualified', value: overview.qualified, icon: '⭐', color: 'var(--amber)' },
    { label: 'Won', value: overview.won, icon: '🏆', color: 'var(--green)' },
    { label: 'Lost', value: overview.lost, icon: '❌', color: 'var(--red)' },
    { label: 'Conversion', value: overview.conversionRate + '%', icon: '📈', color: 'var(--pink)' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Your sales pipeline at a glance</p>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={loadInsights} disabled={loadingInsights}>
          {loadingInsights ? '⏳ Analyzing...' : '🤖 AI Insights'}
        </button>
      </div>

      {insights && (
        <div className="card" style={{marginBottom:20,borderColor:'rgba(108,99,255,0.3)',background:'rgba(108,99,255,0.05)'}}>
          <div className="card-header"><span className="card-title">🤖 AI Insights</span>
            <button className="btn btn-sm btn-secondary" onClick={()=>setInsights('')}>✕</button></div>
          <p style={{fontSize:14,lineHeight:1.7,color:'var(--text2)',whiteSpace:'pre-wrap'}}>{insights}</p>
        </div>
      )}

      <div className="stats-grid">
        {stats.map(s => (
          <div className="stat-card" key={s.label} style={{'--accent-color':s.color}}>
            <div className="stat-icon" style={{background:`${s.color}22`}}>{s.icon}</div>
            <div className="stat-label">{s.label}</div>
            <div className="stat-value" style={{color:s.color}}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{display:'grid',gridTemplateColumns:'2fr 1fr',gap:20,marginBottom:20}}>
        <div className="card">
          <div className="card-header"><span className="card-title">Pipeline by Stage</span></div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={pipeline}>
                <XAxis dataKey="status" tick={{fill:'var(--text2)',fontSize:11}} axisLine={false} tickLine={false}/>
                <YAxis tick={{fill:'var(--text2)',fontSize:11}} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={{background:'var(--bg3)',border:'1px solid var(--border2)',borderRadius:8,color:'var(--text)'}}/>
                <Bar dataKey="count" fill="var(--accent)" radius={[4,4,0,0]}/>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Lead Sources</span></div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sources} dataKey="count" nameKey="source" cx="50%" cy="50%" outerRadius={80} label={({source})=>source}>
                  {sources.map((_,i) => <Cell key={i} fill={COLORS[i%COLORS.length]}/>)}
                </Pie>
                <Tooltip contentStyle={{background:'var(--bg3)',border:'1px solid var(--border2)',borderRadius:8}}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Recent Activity</span>
          <button className="btn btn-sm btn-secondary" onClick={()=>navigate('/leads')}>View Leads →</button>
        </div>
        <div className="timeline">
          {feed.length === 0 ? <div className="empty-state"><div className="empty-icon">📭</div><p className="empty-text">No activity yet</p></div> :
          feed.map(a => (
            <div className="timeline-item" key={a.id}>
              <div className="timeline-dot" style={{background:'var(--bg3)'}}>{CHANNEL_ICONS[a.type]||'📌'}</div>
              <div className="timeline-content">
                <div className="timeline-type">{a.type.replace(/_/g,' ').toUpperCase()} · {a.Lead ? `${a.Lead.firstName} ${a.Lead.lastName||''}` : 'System'}</div>
                <div className="timeline-body">{a.subject || a.body?.slice(0,100) || '—'}</div>
                <div className="timeline-time">{new Date(a.createdAt).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
