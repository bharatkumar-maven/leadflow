import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [sending, setSending] = useState(null);
  const [form, setForm] = useState({ name:'', type:'email', description:'' });

  useEffect(() => {
    api.get('/campaigns').then(r=>setCampaigns(r.data));
    api.get('/settings/templates').then(r=>setTemplates(r.data));
  }, []);

  const create = async () => {
    if (!form.name) return toast.error('Name required');
    try {
      const { data } = await api.post('/campaigns', form);
      setCampaigns(c=>[data,...c]); setShowModal(false); setForm({name:'',type:'email',description:''});
      toast.success('Campaign created');
    } catch { toast.error('Failed'); }
  };

  const sendCampaign = async (campaign) => {
    const channel = campaign.type;
    const message = prompt(`Enter ${channel} message for "${campaign.name}":`);
    if (!message) return;
    const subject = channel === 'email' ? (prompt('Email subject:') || 'Campaign message') : null;
    setSending(campaign.id);
    try {
      const { data } = await api.post(`/campaigns/${campaign.id}/send`, { channel, message, subject, leadStatus: 'new' });
      toast.success(`Sent to ${data.sent} leads (${data.failed} failed)`);
      api.get('/campaigns').then(r=>setCampaigns(r.data));
    } catch { toast.error('Campaign send failed'); }
    finally { setSending(null); }
  };

  const TYPE_ICON = { email:'📧', whatsapp:'💬', sms:'📱', mixed:'📡' };

  return (
    <div className="page">
      <div className="page-header">
        <div><h1 className="page-title">Campaigns</h1><p className="page-subtitle">Bulk outreach to your leads</p></div>
        <button className="btn btn-primary btn-sm" onClick={()=>setShowModal(true)}>+ New Campaign</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
        {campaigns.length === 0 ? (
          <div className="empty-state" style={{gridColumn:'1/-1'}}>
            <div className="empty-icon">📢</div><p className="empty-text">No campaigns yet</p>
            <p className="empty-sub">Create bulk outreach campaigns for email, WhatsApp, or SMS</p>
          </div>
        ) : campaigns.map(c => (
          <div className="card" key={c.id}>
            <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:12}}>
              <div>
                <div style={{fontSize:16,fontWeight:700}}>{TYPE_ICON[c.type]} {c.name}</div>
                <div style={{fontSize:12,color:'var(--text2)',marginTop:4}}>{c.description||'No description'}</div>
              </div>
              <span className={`badge badge-${c.status==='active'?'qualified':c.status==='completed'?'won':'new'}`}>{c.status}</span>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(5,1fr)',gap:4,marginBottom:12}}>
              {['sent','delivered','opened','replied','converted'].map(k=>(
                <div key={k} style={{textAlign:'center',padding:8,background:'var(--bg3)',borderRadius:6}}>
                  <div style={{fontSize:16,fontWeight:700}}>{c.stats?.[k]||0}</div>
                  <div style={{fontSize:10,color:'var(--text3)',textTransform:'uppercase'}}>{k}</div>
                </div>
              ))}
            </div>
            <button className="btn btn-primary btn-sm" style={{width:'100%',justifyContent:'center'}}
              onClick={()=>sendCampaign(c)} disabled={sending===c.id}>
              {sending===c.id ? '⏳ Sending...' : '🚀 Send Campaign'}
            </button>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-header"><h2 className="modal-title">New Campaign</h2><button className="modal-close" onClick={()=>setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Campaign Name *</label>
                <input className="form-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">Channel</label>
                <select className="form-input form-select" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                  {['email','whatsapp','sms','mixed'].map(t=><option key={t} value={t}>{t}</option>)}
                </select></div>
              <div className="form-group"><label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={create}>Create</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
