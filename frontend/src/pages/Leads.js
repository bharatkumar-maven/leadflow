import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import OutreachModal from '../components/OutreachModal';
import LeadModal from '../components/LeadModal';

const STATUS_FILTERS = ['all','new','contacted','qualified','proposal','negotiation','won','lost'];
const SOURCE_COLORS = { web_form:'#6c63ff', facebook:'#06b6d4', whatsapp:'#22c55e', email:'#f59e0b', manual:'#8891a8', linkedin:'#0ea5e9', referral:'#ec4899' };

function ScoreBar({ score }) {
  const color = score >= 70 ? '#22c55e' : score >= 40 ? '#f59e0b' : '#ef4444';
  return (
    <div className="score-bar">
      <div className="score-track"><div className="score-fill" style={{width:score+'%',background:color}}/></div>
      <span className="score-text" style={{color}}>{score}</span>
    </div>
  );
}

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [outreachLead, setOutreachLead] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const navigate = useNavigate();

  const loadLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: 50 };
      if (status !== 'all') params.status = status;
      if (search) params.search = search;
      const { data } = await api.get('/leads', { params });
      setLeads(data.leads); setTotal(data.total);
    } catch { toast.error('Failed to load leads'); }
    finally { setLoading(false); }
  }, [status, search, page]);

  useEffect(() => { loadLeads(); }, [loadLeads]);

  const handleImport = async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const fd = new FormData(); fd.append('file', file);
    setImporting(true);
    try {
      const { data } = await api.post('/leads/import/csv', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success(`Imported ${data.imported} leads`);
      loadLeads();
    } catch { toast.error('Import failed'); }
    finally { setImporting(false); e.target.value = ''; }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div><h1 className="page-title">Leads <span>({total})</span></h1><p className="page-subtitle">Manage and track all your leads</p></div>
        <div style={{display:'flex',gap:10}}>
          <label className="btn btn-secondary btn-sm" style={{cursor:'pointer'}}>
            {importing ? '⏳ Importing...' : '📂 Import CSV'}
            <input type="file" accept=".csv" onChange={handleImport} style={{display:'none'}}/>
          </label>
          <button className="btn btn-primary btn-sm" onClick={()=>setShowModal(true)}>+ Add Lead</button>
        </div>
      </div>

      <div className="filters-bar">
        <input className="form-input search-input" placeholder="🔍 Search leads..." value={search}
          onChange={e=>{setSearch(e.target.value);setPage(1)}}/>
        {STATUS_FILTERS.map(s => (
          <button key={s} className={'filter-chip'+(status===s?' active':'')} onClick={()=>{setStatus(s);setPage(1)}}>
            {s.charAt(0).toUpperCase()+s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? <div className="loading-screen" style={{minHeight:300}}><div className="spinner"/></div> : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Lead</th><th>Contact</th><th>Source</th><th>Status</th><th>Score</th><th>Value</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leads.length === 0 ? (
                <tr><td colSpan={7} style={{textAlign:'center',padding:40,color:'var(--text3)'}}>No leads found</td></tr>
              ) : leads.map(lead => (
                <tr key={lead.id} onClick={()=>navigate(`/leads/${lead.id}`)}>
                  <td>
                    <div style={{fontWeight:600}}>{lead.firstName} {lead.lastName||''}</div>
                    <div style={{fontSize:12,color:'var(--text2)'}}>{lead.company||'—'}</div>
                  </td>
                  <td>
                    <div style={{fontSize:13}}>{lead.email||'—'}</div>
                    <div style={{fontSize:12,color:'var(--text2)'}}>{lead.phone||'—'}</div>
                  </td>
                  <td>
                    <span className="source-dot" style={{background:SOURCE_COLORS[lead.source]||'#8891a8'}}/>
                    {lead.source?.replace(/_/g,' ')}
                  </td>
                  <td><span className={`badge badge-${lead.status}`}>{lead.status}</span></td>
                  <td style={{minWidth:100}}><ScoreBar score={lead.score||0}/></td>
                  <td style={{fontFamily:'var(--font-mono,monospace)',fontSize:13}}>
                    {lead.value > 0 ? `₹${Number(lead.value).toLocaleString()}` : '—'}
                  </td>
                  <td onClick={e=>e.stopPropagation()}>
                    <button className="btn btn-sm btn-secondary" onClick={()=>setOutreachLead(lead)}>
                      📤 Contact
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <LeadModal onClose={()=>setShowModal(false)} onSaved={loadLeads}/>}
      {outreachLead && <OutreachModal lead={outreachLead} onClose={()=>setOutreachLead(null)} onSent={loadLeads}/>}
    </div>
  );
}
