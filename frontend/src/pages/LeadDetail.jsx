import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { ArrowLeft, Mail, MessageSquare, Phone, Zap, Edit2, Save, X, Clock, Sparkles } from 'lucide-react';

const STATUS_COLORS = { new: '#6366f1', contacted: '#8b5cf6', qualified: '#10b981', proposal: '#f59e0b', negotiation: '#f97316', won: '#22c55e', lost: '#6b7280' };
const STATUSES = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];
const inputStyle = { padding: '8px 12px', background: '#1a1a2e', border: '1px solid #2d2d4e', borderRadius: 8, color: '#e0e0e0', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box' };

function ActivityItem({ act }) {
  const icons = { email: '📧', whatsapp: '💬', ai_call: '🤖', call: '📞', note: '📝', status_change: '🔄', created: '✨', imported: '📥' };
  return (
    <div style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid #1a1a2e' }}>
      <span style={{ fontSize: 16 }}>{icons[act.type] || '•'}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, color: '#e0e0e0' }}>{act.description}</div>
        <div style={{ fontSize: 11, color: '#4b5563', marginTop: 2 }}>{new Date(act.createdAt).toLocaleString()}</div>
      </div>
    </div>
  );
}

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('email');
  const [editing, setEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [waMessage, setWaMessage] = useState('');
  const [callScript, setCallScript] = useState('');
  const [note, setNote] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  const { data, isLoading } = useQuery({ queryKey: ['lead', id], queryFn: () => api.get(`/leads/${id}`).then(r => r.data.lead) });
  const updateMutation = useMutation({ mutationFn: (d) => api.patch(`/leads/${id}`, d), onSuccess: () => { queryClient.invalidateQueries(['lead', id]); setEditing(false); toast.success('Updated!'); } });
  const emailMutation = useMutation({ mutationFn: (d) => api.post('/communications/email', d), onSuccess: () => { toast.success('Email sent!'); queryClient.invalidateQueries(['lead', id]); setEmailBody(''); setEmailSubject(''); } });
  const waMutation = useMutation({ mutationFn: (d) => api.post('/communications/whatsapp', d), onSuccess: () => { toast.success('WhatsApp sent!'); queryClient.invalidateQueries(['lead', id]); setWaMessage(''); } });
  const callMutation = useMutation({ mutationFn: (d) => api.post('/communications/ai-call', d), onSuccess: () => { toast.success('AI call initiated!'); queryClient.invalidateQueries(['lead', id]); } });
  const noteMutation = useMutation({ mutationFn: (d) => api.post(`/leads/${id}/activities`, d), onSuccess: () => { toast.success('Note saved!'); queryClient.invalidateQueries(['lead', id]); setNote(''); } });

  const generateAI = async (type) => {
    setAiLoading(true);
    try {
      const { data: res } = await api.post('/communications/ai-generate', { leadId: id, type });
      if (res.success) {
        if (type === 'email') { setEmailSubject(res.data.subject || ''); setEmailBody(res.data.message || ''); }
        else if (type === 'whatsapp') setWaMessage(res.data.message || '');
        else if (type === 'call_script') setCallScript(res.data.script || '');
        toast.success('AI message generated!');
      }
    } catch { toast.error('AI generation failed'); }
    setAiLoading(false);
  };

  if (isLoading) return <div style={{ color: '#6b7280', padding: 20 }}>Loading...</div>;
  if (!data) return <div style={{ color: '#6b7280', padding: 20 }}>Lead not found</div>;

  const lead = data;

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <button onClick={() => navigate('/leads')} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', display: 'flex' }}><ArrowLeft size={20} /></button>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: '#fff', fontSize: 22, fontWeight: 700, margin: 0 }}>{lead.name}</h1>
          <div style={{ color: '#6b7280', fontSize: 13 }}>{lead.company || lead.email}</div>
        </div>
        <select value={lead.status} onChange={e => updateMutation.mutate({ status: e.target.value })} style={{ ...inputStyle, width: 'auto', color: STATUS_COLORS[lead.status], background: `${STATUS_COLORS[lead.status]}15`, borderColor: STATUS_COLORS[lead.status] + '40', fontWeight: 600 }}>
          {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        {!editing ? <button onClick={() => { setEditing(true); setEditData({ name: lead.name, email: lead.email, phone: lead.phone, company: lead.company, notes: lead.notes, dealValue: lead.dealValue }); }} style={{ padding: '8px 16px', background: '#1e1e3a', border: '1px solid #2d2d4e', borderRadius: 8, color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}><Edit2 size={14} /> Edit</button>
          : <><button onClick={() => updateMutation.mutate(editData)} style={{ padding: '8px 16px', background: '#22c55e', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Save</button>
            <button onClick={() => setEditing(false)} style={{ padding: '8px 12px', background: 'transparent', border: '1px solid #2d2d4e', borderRadius: 8, color: '#9ca3af', cursor: 'pointer', fontSize: 13 }}>Cancel</button></>}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
        {/* Left panel - Info */}
        <div>
          <div style={{ background: '#111128', border: '1px solid #1e1e3a', borderRadius: 12, padding: 20, marginBottom: 16 }}>
            <h3 style={{ color: '#e0e0e0', fontSize: 14, fontWeight: 600, margin: '0 0 16px' }}>Contact Details</h3>
            {editing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[['name', 'Name'], ['email', 'Email'], ['phone', 'Phone'], ['company', 'Company']].map(([k, l]) => (
                  <div key={k}><label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>{l}</label>
                    <input value={editData[k] || ''} onChange={e => setEditData(p => ({ ...p, [k]: e.target.value }))} style={inputStyle} /></div>
                ))}
                <div><label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>Deal Value (₹)</label>
                  <input type="number" value={editData.dealValue || ''} onChange={e => setEditData(p => ({ ...p, dealValue: e.target.value }))} style={inputStyle} /></div>
                <div><label style={{ fontSize: 11, color: '#6b7280', display: 'block', marginBottom: 4 }}>Notes</label>
                  <textarea value={editData.notes || ''} onChange={e => setEditData(p => ({ ...p, notes: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} /></div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[['📧', 'Email', lead.email], ['📱', 'Phone', lead.phone], ['💬', 'WhatsApp', lead.whatsapp], ['🏢', 'Company', lead.company], ['🌐', 'Website', lead.website], ['💰', 'Deal Value', lead.dealValue ? `₹${lead.dealValue.toLocaleString()}` : null], ['📊', 'Score', lead.score], ['🎯', 'Source', lead.source]].map(([icon, label, val]) => val ? (
                  <div key={label} style={{ display: 'flex', gap: 8, fontSize: 13 }}>
                    <span>{icon}</span>
                    <span style={{ color: '#6b7280' }}>{label}:</span>
                    <span style={{ color: '#e0e0e0', flex: 1 }}>{val}</span>
                  </div>
                ) : null)}
                {lead.notes && <div style={{ marginTop: 8, padding: 10, background: '#0d0d1a', borderRadius: 8, fontSize: 13, color: '#9ca3af' }}>{lead.notes}</div>}
              </div>
            )}
          </div>

          {/* Quick stats */}
          <div style={{ background: '#111128', border: '1px solid #1e1e3a', borderRadius: 12, padding: 20 }}>
            <h3 style={{ color: '#e0e0e0', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Activity</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[['Total', lead.activities?.length || 0, '#6366f1'], ['Contacts', lead.followUpCount || 0, '#8b5cf6'], ['Days Old', Math.floor((new Date() - new Date(lead.createdAt)) / 86400000), '#f59e0b']].map(([l, v, c]) => (
                <div key={l} style={{ background: '#0d0d1a', borderRadius: 8, padding: 10, textAlign: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 700, color: c }}>{v}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right panel - Communications */}
        <div>
          {/* Tabs */}
          <div style={{ background: '#111128', border: '1px solid #1e1e3a', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', borderBottom: '1px solid #1e1e3a' }}>
              {[['email', '📧 Email', Mail], ['whatsapp', '💬 WhatsApp', MessageSquare], ['ai_call', '🤖 AI Call', Phone], ['note', '📝 Note', Edit2]].map(([tab, label]) => (
                <button key={tab} onClick={() => setActiveTab(tab)} style={{
                  flex: 1, padding: '12px 8px', background: activeTab === tab ? '#1a1a2e' : 'transparent',
                  border: 'none', borderBottom: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
                  color: activeTab === tab ? '#a78bfa' : '#6b7280', cursor: 'pointer', fontSize: 13, fontWeight: activeTab === tab ? 600 : 400
                }}>{label}</button>
              ))}
            </div>

            <div style={{ padding: 20 }}>
              {activeTab === 'email' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button onClick={() => generateAI('email')} disabled={aiLoading} style={{ padding: '8px 16px', background: '#1e1e3a', border: '1px solid #4f46e5', borderRadius: 8, color: '#a78bfa', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
                    <Sparkles size={14} /> {aiLoading ? 'Generating...' : 'Generate with AI'}
                  </button>
                  <input value={emailSubject} onChange={e => setEmailSubject(e.target.value)} placeholder="Subject" style={inputStyle} />
                  <textarea value={emailBody} onChange={e => setEmailBody(e.target.value)} placeholder="Email body..." rows={6} style={{ ...inputStyle, resize: 'vertical' }} />
                  <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} style={inputStyle} />
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={() => emailMutation.mutate({ leadId: id, subject: emailSubject, message: emailBody, schedule: scheduleDate || undefined })} disabled={!emailBody || emailMutation.isPending} style={{ padding: '10px 20px', background: '#6366f1', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                      {scheduleDate ? '⏰ Schedule' : '📧 Send Now'}
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'whatsapp' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <button onClick={() => generateAI('whatsapp')} disabled={aiLoading} style={{ padding: '8px 16px', background: '#1e1e3a', border: '1px solid #4f46e5', borderRadius: 8, color: '#a78bfa', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
                    <Sparkles size={14} /> {aiLoading ? 'Generating...' : 'Generate with AI'}
                  </button>
                  <textarea value={waMessage} onChange={e => setWaMessage(e.target.value)} placeholder="WhatsApp message..." rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
                  <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} style={inputStyle} />
                  <button onClick={() => waMutation.mutate({ leadId: id, message: waMessage, schedule: scheduleDate || undefined })} disabled={!waMessage || waMutation.isPending} style={{ padding: '10px 20px', background: '#22c55e', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, width: 'fit-content' }}>
                    {scheduleDate ? '⏰ Schedule' : '💬 Send WhatsApp'}
                  </button>
                </div>
              )}

              {activeTab === 'ai_call' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ background: '#0d0d1a', borderRadius: 8, padding: 12, fontSize: 13, color: '#9ca3af' }}>
                    🤖 AI will call the lead and have a natural conversation. The call is recorded and transcribed automatically.
                  </div>
                  <button onClick={() => generateAI('call_script')} disabled={aiLoading} style={{ padding: '8px 16px', background: '#1e1e3a', border: '1px solid #4f46e5', borderRadius: 8, color: '#a78bfa', cursor: 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, width: 'fit-content' }}>
                    <Sparkles size={14} /> Generate Script
                  </button>
                  <textarea value={callScript} onChange={e => setCallScript(e.target.value)} placeholder="AI call instructions/script..." rows={6} style={{ ...inputStyle, resize: 'vertical' }} />
                  <select style={inputStyle}>
                    <option value="follow_up">Follow-up call</option>
                    <option value="qualification">Lead qualification</option>
                    <option value="reminder">Appointment reminder</option>
                  </select>
                  <input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} style={inputStyle} />
                  <button onClick={() => callMutation.mutate({ leadId: id, script: callScript, schedule: scheduleDate || undefined })} disabled={callMutation.isPending} style={{ padding: '10px 20px', background: '#8b5cf6', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, width: 'fit-content' }}>
                    {scheduleDate ? '⏰ Schedule Call' : '🤖 Call Now'}
                  </button>
                </div>
              )}

              {activeTab === 'note' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note..." rows={5} style={{ ...inputStyle, resize: 'vertical' }} />
                  <button onClick={() => noteMutation.mutate({ type: 'note', description: note })} disabled={!note || noteMutation.isPending} style={{ padding: '10px 20px', background: '#f59e0b', border: 'none', borderRadius: 8, color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 13, width: 'fit-content' }}>
                    Save Note
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Activity timeline */}
          <div style={{ background: '#111128', border: '1px solid #1e1e3a', borderRadius: 12, padding: 20, marginTop: 16 }}>
            <h3 style={{ color: '#e0e0e0', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Activity Timeline</h3>
            {(lead.activities || []).length === 0 ? <div style={{ color: '#4b5563', fontSize: 13 }}>No activity yet</div> :
              [...(lead.activities || [])].reverse().map((act, i) => <ActivityItem key={i} act={act} />)}
          </div>
        </div>
      </div>
    </div>
  );
}
