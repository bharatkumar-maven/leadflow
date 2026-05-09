import React, { useState } from 'react';
import api from '../utils/api';
import toast from 'react-hot-toast';

export default function LeadModal({ lead, onClose, onSaved }) {
  const [form, setForm] = useState({
    firstName: lead?.firstName || '', lastName: lead?.lastName || '',
    email: lead?.email || '', phone: lead?.phone || '', whatsapp: lead?.whatsapp || '',
    company: lead?.company || '', jobTitle: lead?.jobTitle || '',
    source: lead?.source || 'manual', status: lead?.status || 'new',
    value: lead?.value || '', notes: lead?.notes || '', city: lead?.city || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  const save = async () => {
    if (!form.firstName) return toast.error('First name required');
    setSaving(true);
    try {
      if (lead?.id) { await api.put(`/leads/${lead.id}`, form); toast.success('Lead updated'); }
      else { await api.post('/leads', form); toast.success('Lead created'); }
      onSaved?.(); onClose();
    } catch (err) { toast.error(err.response?.data?.error || 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2 className="modal-title">{lead ? 'Edit Lead' : 'New Lead'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-row">
            <div className="form-group"><label className="form-label">First Name *</label>
              <input className="form-input" value={form.firstName} onChange={e=>set('firstName',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Last Name</label>
              <input className="form-input" value={form.lastName} onChange={e=>set('lastName',e.target.value)}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Email</label>
              <input className="form-input" type="email" value={form.email} onChange={e=>set('email',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">Phone</label>
              <input className="form-input" value={form.phone} onChange={e=>set('phone',e.target.value)} placeholder="+91xxxxxxxxxx"/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">WhatsApp</label>
              <input className="form-input" value={form.whatsapp} onChange={e=>set('whatsapp',e.target.value)} placeholder="+91xxxxxxxxxx"/></div>
            <div className="form-group"><label className="form-label">Company</label>
              <input className="form-input" value={form.company} onChange={e=>set('company',e.target.value)}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Source</label>
              <select className="form-input form-select" value={form.source} onChange={e=>set('source',e.target.value)}>
                {['manual','web_form','facebook','whatsapp','email','linkedin','referral','other'].map(s=><option key={s} value={s}>{s.replace(/_/g,' ')}</option>)}
              </select></div>
            <div className="form-group"><label className="form-label">Status</label>
              <select className="form-input form-select" value={form.status} onChange={e=>set('status',e.target.value)}>
                {['new','contacted','qualified','proposal','negotiation','won','lost','unresponsive'].map(s=><option key={s} value={s}>{s}</option>)}
              </select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label className="form-label">Deal Value (₹)</label>
              <input className="form-input" type="number" value={form.value} onChange={e=>set('value',e.target.value)}/></div>
            <div className="form-group"><label className="form-label">City</label>
              <input className="form-input" value={form.city} onChange={e=>set('city',e.target.value)}/></div>
          </div>
          <div className="form-group"><label className="form-label">Notes</label>
            <textarea className="form-input" rows={3} value={form.notes} onChange={e=>set('notes',e.target.value)}/></div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={save} disabled={saving}>{saving?'Saving...':'Save Lead'}</button>
        </div>
      </div>
    </div>
  );
}
