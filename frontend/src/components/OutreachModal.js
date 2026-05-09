import React, { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

const CHANNELS = [
  { id: 'email',    icon: '📧', label: 'Email',        req: 'email' },
  { id: 'whatsapp', icon: '💬', label: 'WhatsApp',     req: 'phone' },
  { id: 'sms',      icon: '📱', label: 'SMS',          req: 'phone' },
  { id: 'ai_call',  icon: '🤖', label: 'AI Voice Call',req: 'phone' },
  { id: 'call',     icon: '📞', label: 'Log Call',     req: null },
];

export default function OutreachModal({ lead, onClose, onSent }) {
  const [channel, setChannel] = useState('email');
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [sending, setSending] = useState(false);
  const [drafting, setDrafting] = useState(false);
  const [scheduleFollowUp, setScheduleFollowUp] = useState(false);
  const [followUpDate, setFollowUpDate] = useState('');

  const draftWithAI = async () => {
    setDrafting(true);
    try {
      const { data } = await api.post('/ai/draft-message', { leadId: lead.id, channel, context: 'Follow up on their inquiry' });
      setMessage(data.draft);
      if (channel === 'email' && data.draft.includes('Subject:')) {
        const lines = data.draft.split('\n');
        const subjLine = lines.find(l => l.startsWith('Subject:'));
        if (subjLine) { setSubject(subjLine.replace('Subject:', '').trim()); setMessage(lines.filter(l=>!l.startsWith('Subject:')).join('\n').trim()); }
      }
    } catch { toast.error('AI draft failed'); }
    finally { setDrafting(false); }
  };

  const send = async () => {
    if (!message.trim() && channel !== 'ai_call') return toast.error('Please enter a message');
    setSending(true);
    try {
      const body = { channel, message, subject };
      if (scheduleFollowUp && followUpDate) body.nextFollowUpAt = followUpDate;
      await api.post(`/leads/${lead.id}/contact`, body);
      if (scheduleFollowUp && followUpDate) await api.put(`/leads/${lead.id}`, { nextFollowUpAt: followUpDate });
      toast.success(`${channel.replace('_',' ')} sent successfully!`);
      onSent?.(); onClose();
    } catch (err) { toast.error(err.response?.data?.error || 'Send failed'); }
    finally { setSending(false); }
  };

  const selectedChannel = CHANNELS.find(c=>c.id===channel);

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">Contact {lead.firstName} {lead.lastName||''}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <p style={{fontSize:13,color:'var(--text2)',marginBottom:16}}>
            📧 {lead.email||'—'} &nbsp;|&nbsp; 📱 {lead.phone||'—'} &nbsp;|&nbsp; 💬 {lead.whatsapp||lead.phone||'—'}
          </p>
          <div className="channel-grid">
            {CHANNELS.map(c => {
              const missing = c.req === 'email' ? !lead.email : c.req === 'phone' ? !lead.phone && !lead.whatsapp : false;
              return (
                <button key={c.id} className={'channel-btn'+(channel===c.id?' selected':'')}
                  onClick={()=>setChannel(c.id)} disabled={missing} style={missing?{opacity:0.4}:{}}>
                  <span>{c.icon}</span>{c.label}{missing&&<span style={{fontSize:11,color:'var(--red)'}}>No number</span>}
                </button>
              );
            })}
          </div>
          {channel === 'email' && (
            <div className="form-group">
              <label className="form-label">Subject</label>
              <input className="form-input" value={subject} onChange={e=>setSubject(e.target.value)} placeholder="Email subject..."/>
            </div>
          )}
          {channel !== 'ai_call' && (
            <div className="form-group">
              <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
                <label className="form-label" style={{margin:0}}>Message</label>
                <button className="btn btn-sm btn-secondary" onClick={draftWithAI} disabled={drafting}>
                  {drafting ? '⏳ Drafting...' : '🤖 AI Draft'}
                </button>
              </div>
              <textarea className="form-input" rows={5} value={message} onChange={e=>setMessage(e.target.value)}
                placeholder={channel==='call'?'Call notes...':'Type your message...'}/>
            </div>
          )}
          {channel === 'ai_call' && (
            <div style={{background:'var(--bg3)',borderRadius:'var(--radius)',padding:16,fontSize:13,color:'var(--text2)'}}>
              🤖 An AI voice agent will call <strong>{lead.phone}</strong> and introduce your company, qualify the lead, and schedule a follow-up. Powered by Vapi.ai (~₹4/min).
            </div>
          )}
          <div style={{display:'flex',alignItems:'center',gap:10,marginTop:12}}>
            <input type="checkbox" id="fu" checked={scheduleFollowUp} onChange={e=>setScheduleFollowUp(e.target.checked)}/>
            <label htmlFor="fu" style={{fontSize:13,color:'var(--text2)'}}>Schedule follow-up</label>
            {scheduleFollowUp && <input type="datetime-local" className="form-input" style={{flex:1}} value={followUpDate} onChange={e=>setFollowUpDate(e.target.value)}/>}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={send} disabled={sending}>{sending?'Sending...':'Send '+ selectedChannel?.icon}</button>
        </div>
      </div>
    </div>
  );
}
