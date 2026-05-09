import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { Plus, Search, Upload, Filter, LayoutGrid, List, ChevronDown } from 'lucide-react';

const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const STATUS_COLORS = { new: '#6366f1', contacted: '#8b5cf6', qualified: '#10b981', proposal: '#f59e0b', negotiation: '#f97316', won: '#22c55e', lost: '#6b7280' };
const SOURCES = ['website', 'facebook', 'instagram', 'linkedin', 'google_ads', 'referral', 'cold_call', 'email_campaign', 'whatsapp', 'manual', 'csv_import'];

function LeadCard({ lead, onClick }) {
  return (
    <div onClick={onClick} style={{
      background: '#0d0d1a', border: '1px solid #1e1e3a', borderRadius: 10, padding: 14, cursor: 'pointer',
      marginBottom: 8, transition: 'all 0.2s', borderLeft: `3px solid ${STATUS_COLORS[lead.status] || '#6366f1'}`
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e0e0e0' }}>{lead.name}</div>
        <div style={{ fontSize: 11, color: '#4b5563' }}>Score: {lead.score}</div>
      </div>
      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 4 }}>{lead.company || lead.email || lead.phone}</div>
      {lead.dealValue > 0 && <div style={{ fontSize: 12, color: '#a78bfa', fontWeight: 600 }}>₹{lead.dealValue.toLocaleString()}</div>}
      <div style={{ display: 'flex', gap: 4, marginTop: 8, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#1a1a2e', color: '#6b7280' }}>{lead.source}</span>
        {lead.tags?.slice(0, 2).map(t => <span key={t} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#1e1e3a', color: '#9ca3af' }}>{t}</span>)}
      </div>
    </div>
  );
}

export default function Leads() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [view, setView] = useState('kanban');
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newLead, setNewLead] = useState({ name: '', email: '', phone: '', company: '', source: 'manual', status: 'new' });
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['leads', search, filterStatus, filterSource, page],
    queryFn: () => api.get('/leads', { params: { search, status: filterStatus, source: filterSource, page, limit: 50 } }).then(r => r.data)
  });

  const createMutation = useMutation({
    mutationFn: (data) => api.post('/leads', data),
    onSuccess: () => { queryClient.invalidateQueries(['leads']); setShowNewForm(false); toast.success('Lead created!'); setNewLead({ name: '', email: '', phone: '', company: '', source: 'manual', status: 'new' }); },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to create lead')
  });

  const importMutation = useMutation({
    mutationFn: (file) => { const form = new FormData(); form.append('file', file); return api.post('/leads/import/csv', form); },
    onSuccess: (res) => { queryClient.invalidateQueries(['leads']); toast.success(`Imported ${res.data.imported} leads!`); },
    onError: () => toast.error('Import failed')
  });

  const leads = data?.leads || [];
  const grouped = STATUSES.reduce((acc, s) => { acc[s] = leads.filter(l => l.status === s); return acc; }, {});

  const inputStyle = { padding: '8px 12px', background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 8, color: '#e0e0e0', fontSize: 13, outline: 'none' };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0, flex: 1 }}>Leads <span style={{ color: '#4b5563', fontWeight: 400, fontSize: 16 }}>({data?.total || 0})</span></h1>
        <button onClick={() => setView(v => v === 'kanban' ? 'list' : 'kanban')} style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          {view === 'kanban' ? <List size={15} /> : <LayoutGrid size={15} />} {view === 'kanban' ? 'List' : 'Kanban'}
        </button>
        <label style={{ ...inputStyle, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}>
          <Upload size={15} /> Import CSV
          <input type="file" accept=".csv" style={{ display: 'none' }} onChange={e => e.target.files[0] && importMutation.mutate(e.target.files[0])} />
        </label>
        <button onClick={() => setShowNewForm(true)} style={{ padding: '8px 16px', background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: 'none', borderRadius: 8, color: 'white', fontWeight: 600, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Plus size={15} /> New Lead
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#4b5563' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search leads..." style={{ ...inputStyle, paddingLeft: 32, width: '100%', boxSizing: 'border-box' }} />
        </div>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={inputStyle}>
          <option value="">All Statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={inputStyle}>
          <option value="">All Sources</option>
          {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* New Lead Form */}
      {showNewForm && (
        <div style={{ background: '#111128', border: '1px solid #2d2d4e', borderRadius: 12, padding: 20, marginBottom: 20 }}>
          <h3 style={{ color: '#e0e0e0', margin: '0 0 16px', fontSize: 15 }}>Add New Lead</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12 }}>
            {[['name', 'Name *'], ['email', 'Email'], ['phone', 'Phone'], ['company', 'Company']].map(([key, label]) => (
              <div key={key}>
                <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>{label}</label>
                <input value={newLead[key]} onChange={e => setNewLead(p => ({ ...p, [key]: e.target.value }))} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 4 }}>Source</label>
              <select value={newLead.source} onChange={e => setNewLead(p => ({ ...p, source: e.target.value }))} style={{ ...inputStyle, width: '100%' }}>
                {SOURCES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            <button onClick={() => createMutation.mutate(newLead)} disabled={!newLead.name || createMutation.isPending} style={{ padding: '8px 20px', background: '#6366f1', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
              {createMutation.isPending ? 'Saving...' : 'Save Lead'}
            </button>
            <button onClick={() => setShowNewForm(false)} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid #2d2d4e', borderRadius: 8, color: '#9ca3af', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? <div style={{ color: '#6b7280', textAlign: 'center', padding: 40 }}>Loading leads...</div> : (
        view === 'kanban' ? (
          /* Kanban View */
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 16 }}>
            {STATUSES.slice(0, 6).map(status => (
              <div key={status} style={{ minWidth: 240, flex: '0 0 240px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 10, height: 10, borderRadius: 3, background: STATUS_COLORS[status] }} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#9ca3af', textTransform: 'capitalize' }}>{status}</span>
                  <span style={{ fontSize: 12, color: '#4b5563', marginLeft: 'auto' }}>{grouped[status]?.length || 0}</span>
                </div>
                <div style={{ maxHeight: 'calc(100vh - 320px)', overflowY: 'auto' }}>
                  {(grouped[status] || []).map(lead => <LeadCard key={lead._id} lead={lead} onClick={() => navigate(`/leads/${lead._id}`)} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* List View */
          <div style={{ background: '#111128', border: '1px solid #1e1e3a', borderRadius: 12, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ borderBottom: '1px solid #1e1e3a' }}>
                {['Name', 'Email', 'Phone', 'Company', 'Status', 'Source', 'Score', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {leads.map(lead => (
                  <tr key={lead._id} onClick={() => navigate(`/leads/${lead._id}`)} style={{ borderBottom: '1px solid #1a1a2e', cursor: 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1a1a2e'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#e0e0e0', fontWeight: 500 }}>{lead.name}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>{lead.email || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>{lead.phone || '—'}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#6b7280' }}>{lead.company || '—'}</td>
                    <td style={{ padding: '12px 16px' }}><span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, background: `${STATUS_COLORS[lead.status]}20`, color: STATUS_COLORS[lead.status], fontWeight: 600 }}>{lead.status}</span></td>
                    <td style={{ padding: '12px 16px', fontSize: 12, color: '#6b7280' }}>{lead.source}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#a78bfa' }}>{lead.score}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <button onClick={e => { e.stopPropagation(); navigate(`/leads/${lead._id}`); }} style={{ padding: '4px 12px', background: '#1e1e3a', border: '1px solid #2d2d4e', borderRadius: 6, color: '#9ca3af', cursor: 'pointer', fontSize: 12 }}>View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
}
