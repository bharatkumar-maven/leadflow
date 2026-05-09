import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Tasks() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ title:'', type:'follow_up', priority:'medium', dueAt:'', description:'' });
  const { user } = useAuth();
  const navigate = useNavigate();

  const load = async () => {
    setLoading(true);
    try { const { data } = await api.get('/tasks', { params: { status: 'pending' } }); setTasks(data); }
    catch { toast.error('Failed to load tasks'); }
    finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);

  const complete = async (id) => {
    try { await api.put(`/tasks/${id}`, { status: 'completed', completedAt: new Date() }); load(); toast.success('Task completed'); }
    catch { toast.error('Failed'); }
  };

  const create = async () => {
    if (!form.title) return toast.error('Title required');
    try { await api.post('/tasks', form); setShowModal(false); load(); toast.success('Task created'); }
    catch { toast.error('Failed to create task'); }
  };

  const PRIORITY_COLOR = { low:'var(--cyan)', medium:'var(--amber)', high:'var(--red)', urgent:'#ff0080' };
  const TYPE_ICON = { call:'📞', email:'📧', whatsapp:'💬', meeting:'🤝', follow_up:'🔔', other:'📌' };

  const overdue = tasks.filter(t => t.dueAt && new Date(t.dueAt) < new Date());
  const today = tasks.filter(t => t.dueAt && new Date(t.dueAt).toDateString() === new Date().toDateString() && new Date(t.dueAt) >= new Date());
  const upcoming = tasks.filter(t => !t.dueAt || new Date(t.dueAt) > new Date());

  return (
    <div className="page">
      <div className="page-header">
        <div><h1 className="page-title">Tasks</h1><p className="page-subtitle">{tasks.length} pending tasks</p></div>
        <button className="btn btn-primary btn-sm" onClick={()=>setShowModal(true)}>+ New Task</button>
      </div>

      {loading ? <div className="loading-screen" style={{minHeight:200}}><div className="spinner"/></div> : (
        <>
          {overdue.length > 0 && (
            <div style={{marginBottom:20}}>
              <h3 style={{fontSize:13,color:'var(--red)',fontWeight:700,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.5px'}}>⚠️ Overdue ({overdue.length})</h3>
              {overdue.map(t=><TaskRow key={t.id} task={t} onComplete={complete} navigate={navigate} PRIORITY_COLOR={PRIORITY_COLOR} TYPE_ICON={TYPE_ICON}/>)}
            </div>
          )}
          {today.length > 0 && (
            <div style={{marginBottom:20}}>
              <h3 style={{fontSize:13,color:'var(--amber)',fontWeight:700,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.5px'}}>📅 Today ({today.length})</h3>
              {today.map(t=><TaskRow key={t.id} task={t} onComplete={complete} navigate={navigate} PRIORITY_COLOR={PRIORITY_COLOR} TYPE_ICON={TYPE_ICON}/>)}
            </div>
          )}
          <div>
            <h3 style={{fontSize:13,color:'var(--text2)',fontWeight:700,marginBottom:10,textTransform:'uppercase',letterSpacing:'0.5px'}}>📋 Upcoming ({upcoming.length})</h3>
            {upcoming.length === 0 ? <div className="empty-state"><div className="empty-icon">✅</div><p className="empty-text">All clear!</p></div> :
              upcoming.map(t=><TaskRow key={t.id} task={t} onComplete={complete} navigate={navigate} PRIORITY_COLOR={PRIORITY_COLOR} TYPE_ICON={TYPE_ICON}/>)}
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&setShowModal(false)}>
          <div className="modal">
            <div className="modal-header"><h2 className="modal-title">New Task</h2><button className="modal-close" onClick={()=>setShowModal(false)}>✕</button></div>
            <div className="modal-body">
              <div className="form-group"><label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={e=>setForm(f=>({...f,title:e.target.value}))}/></div>
              <div className="form-row">
                <div className="form-group"><label className="form-label">Type</label>
                  <select className="form-input form-select" value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}>
                    {['call','email','whatsapp','meeting','follow_up','other'].map(t=><option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
                  </select></div>
                <div className="form-group"><label className="form-label">Priority</label>
                  <select className="form-input form-select" value={form.priority} onChange={e=>setForm(f=>({...f,priority:e.target.value}))}>
                    {['low','medium','high','urgent'].map(p=><option key={p} value={p}>{p}</option>)}
                  </select></div>
              </div>
              <div className="form-group"><label className="form-label">Due Date</label>
                <input className="form-input" type="datetime-local" value={form.dueAt} onChange={e=>setForm(f=>({...f,dueAt:e.target.value}))}/></div>
              <div className="form-group"><label className="form-label">Description</label>
                <textarea className="form-input" rows={3} value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))}/></div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={()=>setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={create}>Create Task</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TaskRow({ task, onComplete, navigate, PRIORITY_COLOR, TYPE_ICON }) {
  return (
    <div className="card" style={{marginBottom:8,display:'flex',alignItems:'center',gap:12,padding:'12px 16px'}}>
      <div style={{fontSize:20}}>{TYPE_ICON[task.type]||'📌'}</div>
      <div style={{flex:1}}>
        <div style={{fontWeight:600,fontSize:14}}>{task.title}</div>
        {task.description && <div style={{fontSize:12,color:'var(--text2)',marginTop:2}}>{task.description}</div>}
        <div style={{display:'flex',gap:12,marginTop:4,fontSize:11,color:'var(--text3)'}}>
          {task.dueAt && <span>📅 {new Date(task.dueAt).toLocaleString()}</span>}
          {task.Lead && <span className="btn-secondary" style={{cursor:'pointer'}} onClick={()=>navigate(`/leads/${task.leadId}`)}>
            👤 {task.Lead.firstName} {task.Lead.lastName||''}
          </span>}
        </div>
      </div>
      <span style={{color:PRIORITY_COLOR[task.priority],fontSize:12,fontWeight:700,textTransform:'uppercase'}}>{task.priority}</span>
      <button className="btn btn-sm btn-secondary" onClick={()=>onComplete(task.id)}>✓ Done</button>
    </div>
  );
}
