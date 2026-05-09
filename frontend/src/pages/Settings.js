import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const SECTIONS = ['Templates','Integrations','Team'];

export default function Settings() {
  const [section, setSection] = useState('Templates');
  const [templates, setTemplates] = useState([]);
  const [users, setUsers] = useState([]);
  const [showTplModal, setShowTplModal] = useState(false);
  const [tplForm, setTplForm] = useState({ name:'', type:'email', subject:'', body:'' });

  useEffect(() => {
    api.get('/settings/templates').then(r=>setTemplates(r.data));
    api.get('/settings/users').then(r=>setUsers(r.data));
  }, []);

  const createTemplate = async () => {
    if (!tplForm.name || !tplForm.body) return toast.error('Name and body required');
    try {
      const { data } = await api.post('/settings/templates', tplForm);
      setTemplates(t=>[...t, data]); setShowTplModal(false);
      toast.success('Template created');
    } catch { toast.error('Failed'); }
  };

  return (
    <div className="page">
      <div className="page-header">
        <div><h1 className="page-title">Settings</h1></div>
      </div>
      <div style={{display:'flex',gap:8,marginBottom:24}}>
        {SECTIONS.map(s=><button key={s} className={'filter-chip'+(section===s?' active':'')} onClick={()=>setSection(s)}>{s}</button>)}
      </div>

      {section==='Templates' && (
        <div>
          <div style={{display:'flex',justifyContent:'flex-end',marginBottom:16}}>
            <button className="btn btn-primary btn-sm" onClick={()=>setShowTplModal(true)}>+ New Template</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
            {templates.length===0 ? <div className="empty-state"><div className="empty-icon">📄</div><p className="empty-text">No templates yet</p></div> :
              templates.map(t=>(
                <div className="card" key={t.id}>
                  <div style={{display:'flex',gap:8,marginBottom:8}}>
                    <span className="badge badge-new">{t.type}</span>
                    <span style={{fontWeight:600,fontSize:14}}>{t.name}</span>
                  </div>
                  {t.subject && <div style={{fontSize:12,color:'var(--text2)',marginBottom:6}}>Subject: {t.subject}</div>}
                  <div style={{fontSize:13,color:'var(--text3)',background:'var(--bg3)',padding:10,borderRadius:6,maxHeight:80,overflow:'hidden'}}>{t.body}</div>
                </div>
              ))}
          </div>
        </div>
      )}

      {section==='Integrations' && (
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:16}}>
          {[
            {name:'Twilio', desc:'WhatsApp, SMS, Voice calls', cost:'~$0.005/msg for WhatsApp', url:'https://twilio.com', icon:'📱', env:'TWILIO_ACCOUNT_SID'},
            {name:'Vapi.ai', desc:'AI Voice Calls (powered by LLMs)', cost:'~$0.05/min, $10 free credit', url:'https://vapi.ai', icon:'🤖', env:'VAPI_API_KEY'},
            {name:'Brevo', desc:'Email sending (SMTP)', cost:'300 free emails/day forever', url:'https://brevo.com', icon:'📧', env:'SMTP_HOST'},
            {name:'Claude AI', desc:'Lead scoring, message drafting', cost:'Free during Anthropic trial', url:'https://anthropic.com', icon:'🧠', env:'ANTHROPIC_API_KEY'},
            {name:'Facebook Lead Ads', desc:'Auto-capture Facebook leads', cost:'Webhook, no extra cost', url:'https://developers.facebook.com', icon:'📘', env:'FB_PAGE_ACCESS_TOKEN'},
          ].map(int=>(
            <div className="card" key={int.name}>
              <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:12}}>
                <div style={{fontSize:28}}>{int.icon}</div>
                <div><div style={{fontWeight:700}}>{int.name}</div><div style={{fontSize:12,color:'var(--text2)'}}>{int.desc}</div></div>
              </div>
              <div style={{fontSize:12,color:'var(--green)',marginBottom:8}}>💰 {int.cost}</div>
              <div style={{fontSize:12,color:'var(--text3)',marginBottom:12}}>Set <code style={{background:'var(--bg3)',padding:'1px 6px',borderRadius:4}}>{int.env}</code> in .env</div>
              <a href={int.url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm" style={{textDecoration:'none',display:'inline-flex'}}>
                Get API Key →
              </a>
            </div>
          ))}
        </div>
      )}

      {section==='Team' && (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Name</th><th>Email</th><th>Role</th><th>Status</th></tr></thead>
            <tbody>
              {users.map(u=>(
                <tr key={u.id}>
                  <td><div style={{display:'flex',alignItems:'center',gap:8}}>
                    <div className="user-avatar" style={{width:28,height:28,fontSize:11}}>{u.name?.[0]}</div>{u.name}
                  </div></td>
                  <td>{u.email}</td>
                  <td><span className="badge badge-new">{u.role}</span></td>
                  <td><span className={`badge badge-${u.isActive?'won':'lost'}`}>{u.isActive?'Active':'Inactive'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showTplModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowTplModal(false)}>
          <div className="modal">
            <div className="modal-header"><h2 className="modal-title">New Template</h2><button className="modal-close" onClick={()=>setShowTplModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-row">
                <div className="form-group"><label className="form-label">Name *</label>
                  <input className="form-input" value={tplForm.name} onChange={e=>setTplForm(f=>({...f,name:e.target.value}))}/></div>
                <div className="form-group"><label className="form-label">Type</label>
                  <select className="form-input form-select" value={tplForm.type} onChange={e=>setTplForm(f=>({...f,type:e.target.value}))}>
                    {['email','whatsapp','sms'].map(t=><option key={t}>{t}</option>)}
                  </select></div>
              </div>
              {tplForm.type==='email' && <div className="form-group"><label className="form-label">Subject</label>
                <input className="form-input" value={tplForm.subject} onChange={e=>setTplForm(f=>({...f,subject:e.target.value}))}/></div>}
              <div className="form-group"><label className="form-label">Body * (use {"{firstName}"}, {"{company}"} etc)</label>
                <textarea className="form-input" rows={6} value={tplForm.body} onChange={e=>setTplForm(f=>({...f,body:e.target.value}))}/></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setShowTplModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={createTemplate}>Save Template</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
