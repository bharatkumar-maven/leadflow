import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../utils/api';
import toast from 'react-hot-toast';
import OutreachModal from '../components/OutreachModal';
import LeadModal from '../components/LeadModal';

const CHANNEL_ICONS = { email:'📧', whatsapp:'💬', sms:'📱', call:'📞', ai_call:'🤖', note:'📝', status_change:'🔄', created:'✨' };
const STATUS_COLORS = { new:'var(--cyan)',contacted:'var(--accent)',qualified:'var(--amber)',proposal:'var(--pink)',negotiation:'#fbbf24',won:'var(--green)',lost:'var(--red)',unresponsive:'#9ca3af' };

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOutreach, setShowOutreach] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [rescoring, setRescoring] = useState(false);
  const [newNote, setNewNote] = useState('');
  const [addingNote, setAddingNote] = useState(false);

  const load = async () => {
    try {
      const { data } = await api.get(`/leads/${id}`);
      setLead(data);
    } catch { toast.error('Lead not found'); navigate('/leads'); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [id]);

  const rescore = async () => {
    setRescoring(true);
    try {
      const { data } = await api.post(`/ai/rescore/${id}`);
      setLead(l => ({...l, score: data.score}));
      toast.success(`New score: ${data.score}`);
    } catch { toast.error('Rescore failed'); }
    finally { setRescoring(false); }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      await api.post('/activities', { leadId: id, type: 'note', body: newNote, direction: 'internal' });
      setNewNote(''); load();
    } catch { toast.error('Failed to add note'); }
    finally { setAddingNote(false); }
  };

  const changeStatus = async (status) => {
    try { await api.put(`/leads/${id}`, { status }); load(); toast.success('Status updated'); }
    catch { toast.error('Update failed'); }
  };

  if (loading) return <div className="loading-screen"><div className="spinner"/></div>;
  if (!lead) return null;

  const score = lead.score || 0;
  const scoreColor = score >= 70 ? 'var(--green)' : score >= 40 ? 'var(--amber)' : 'var(--red)';

  return (
    <div className="page">
      <div className="page-header">
        <div style={{display:'flex',alignItems:'center',gap:12}}>
          <button className="btn btn-secondary btn-sm" onClick={()=>navigate('/leads')}>← Back</button>
          <div>
            <h1 className="page-title">{lead.firstName} {lead.lastName||''}</h1>
            <p className="page-subtitle">{lead.company||'No company'} {lead.jobTitle?'· '+lead.jobTitle:''}</p>
          </div>
        </div>
        <div style={{display:'flex',gap:10}}>
          <button className="btn btn-secondary btn-sm" onClick={()=>setShowEdit(true)}>✏️ Edit</button>
          <button className="btn btn-primary btn-sm" onClick={()=>setShowOutreach(true)}>📤 Contact</button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:20}}>
        <div>
          {/* Lead Info Card */}
          <div className="card" style={{marginBottom:20}}>
            <div className="card-header">
              <span className="card-title">Lead Info</span>
              <div style={{display:'flex',alignItems:'center',gap:12}}>
                <div style={{textAlign:'right'}}>
                  <div style={{fontSize:28,fontWeight:700,color:scoreColor}}>{score}</div>
                  <div style={{fontSize:11,color:'var(--text3)'}}>AI Score</div>
                </div>
                <button className="btn btn-secondary btn-sm" onClick={rescore} disabled={rescoring}>
                  {rescoring?'⏳':'🤖'} Rescore
                </button>
              </div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:16}}>
              {[
                { label: 'Email', value: lead.email },
                { label: 'Phone', value: lead.phone },
                { label: 'WhatsApp', value: lead.whatsapp },
                { label: 'Source', value: lead.source?.replace(/_/g,' ') },
                { label: 'Status', value: <span className={`badge badge-${lead.status}`}>{lead.status}</span> },
                { label: 'Deal Value', value: lead.value > 0 ? `₹${Number(lead.value).toLocaleString()}` : '—' },
                { label: 'City', value: lead.city },
                { label: 'Last Contacted', value: lead.lastContactedAt ? new Date(lead.lastContactedAt).toLocaleDateString() : 'Never' },
                { label: 'Next Follow-up', value: lead.nextFollowUpAt ? new Date(lead.nextFollowUpAt).toLocaleDateString() : 'Not scheduled' },
              ].map(f => (
                <div key={f.label}>
                  <div style={{fontSize:11,color:'var(--text3)',marginBottom:3,textTransform:'uppercase',letterSpacing:'0.5px'}}>{f.label}</div>
                  <div style={{fontSize:14}}>{f.value||'—'}</div>
                </div>
              ))}
            </div>
            {lead.notes && <div style={{marginTop:16,padding:12,background:'var(--bg3)',borderRadius:'var(--radius)',fontSize:13,color:'var(--text2)'}}>
              <strong>Notes:</strong> {lead.notes}
            </div>}
          </div>

          {/* Add note */}
          <div className="card" style={{marginBottom:20}}>
            <div className="card-header"><span className="card-title">Add Note</span></div>
            <div style={{display:'flex',gap:10}}>
              <input className="form-input" style={{flex:1}} placeholder="Add a note..." value={newNote} onChange={e=>setNewNote(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&addNote()}/>
              <button className="btn btn-primary" onClick={addNote} disabled={addingNote}>Add</button>
            </div>
          </div>

          {/* Activity Timeline */}
          <div className="card">
            <div className="card-header"><span className="card-title">Activity Timeline ({lead.activities?.length||0})</span></div>
            <div className="timeline">
              {(lead.activities||[]).length === 0 ? (
                <div className="empty-state"><div className="empty-icon">📭</div><p className="empty-text">No activities yet</p></div>
              ) : (lead.activities||[]).map(a => (
                <div className="timeline-item" key={a.id}>
                  <div className="timeline-dot" style={{background:'var(--bg3)',fontSize:14}}>{CHANNEL_ICONS[a.type]||'📌'}</div>
                  <div className="timeline-content">
                    <div style={{display:'flex',justifyContent:'space-between'}}>
                      <span className="timeline-type">{a.type.replace(/_/g,' ').toUpperCase()}</span>
                      <span className={`badge badge-${a.status}`} style={{fontSize:10}}>{a.status}</span>
                    </div>
                    {a.subject && <div style={{fontWeight:600,fontSize:13,marginTop:2}}>{a.subject}</div>}
                    {a.body && <div className="timeline-body">{a.body}</div>}
                    <div className="timeline-time">{new Date(a.createdAt).toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div>
          {/* Status changer */}
          <div className="card" style={{marginBottom:16}}>
            <div className="card-header"><span className="card-title">Pipeline Stage</span></div>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {['new','contacted','qualified','proposal','negotiation','won','lost'].map(s => (
                <button key={s} onClick={()=>changeStatus(s)}
                  className={'btn btn-sm'+(lead.status===s?' btn-primary':' btn-secondary')}
                  style={{justifyContent:'flex-start', borderColor: lead.status===s ? undefined : 'transparent', background: lead.status===s ? STATUS_COLORS[s]+'33' : undefined, color: lead.status===s ? STATUS_COLORS[s] : undefined}}>
                  {lead.status===s?'● ':''}{s.charAt(0).toUpperCase()+s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="card">
            <div className="card-header"><span className="card-title">Quick Contact</span></div>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[
                {channel:'email', label:'Send Email', icon:'📧', disabled:!lead.email},
                {channel:'whatsapp', label:'WhatsApp', icon:'💬', disabled:!lead.phone&&!lead.whatsapp},
                {channel:'sms', label:'Send SMS', icon:'📱', disabled:!lead.phone},
                {channel:'ai_call', label:'AI Voice Call', icon:'🤖', disabled:!lead.phone},
                {channel:'call', label:'Log Manual Call', icon:'📞'},
              ].map(c => (
                <button key={c.channel} className="btn btn-secondary btn-sm" style={{justifyContent:'flex-start'}}
                  disabled={c.disabled} onClick={()=>setShowOutreach(true)}>
                  {c.icon} {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {showOutreach && <OutreachModal lead={lead} onClose={()=>setShowOutreach(false)} onSent={load}/>}
      {showEdit && <LeadModal lead={lead} onClose={()=>setShowEdit(false)} onSaved={load}/>}
    </div>
  );
}
