const express = require('express');
const Lead = require('../models/Lead');
const FollowUp = require('../models/FollowUp');
const whatsappService = require('../services/whatsappService');

const router = express.Router();

// WhatsApp webhook verification
router.get('/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];
  if (mode === 'subscribe' && token === process.env.WHATSAPP_VERIFY_TOKEN) {
    console.log('WhatsApp webhook verified');
    return res.status(200).send(challenge);
  }
  res.sendStatus(403);
});

// WhatsApp incoming messages
router.post('/whatsapp', async (req, res) => {
  try {
    const messages = whatsappService.processWebhook(req.body);
    for (const msg of messages) {
      if (!msg.text) continue;
      // Find lead by phone
      const lead = await Lead.findOne({ $or: [{ phone: { $regex: msg.from.slice(-10) } }, { whatsapp: { $regex: msg.from.slice(-10) } }] });
      if (lead) {
        lead.activities.push({ type: 'whatsapp', description: `Incoming WhatsApp: ${msg.text}`, metadata: { direction: 'inbound', messageId: msg.id } });
        lead.lastContactedAt = new Date();
        if (lead.status === 'new') lead.status = 'contacted';
        await lead.save();
        req.io?.emit('whatsapp_received', { leadId: lead._id, message: msg.text, from: msg.from });
      } else {
        // Create new lead from WhatsApp
        const newLead = await Lead.create({ name: msg.name || msg.from, whatsapp: msg.from, phone: msg.from, source: 'whatsapp', status: 'new' });
        newLead.activities.push({ type: 'whatsapp', description: `First WhatsApp contact: ${msg.text}` });
        await newLead.save();
        req.io?.emit('lead_created', { lead: newLead, source: 'whatsapp' });
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('WhatsApp webhook error:', err);
    res.sendStatus(200); // Always return 200 to WhatsApp
  }
});

// AI Call result webhook (Bland.ai callback)
router.post('/call-result', async (req, res) => {
  try {
    const { call_id, status, duration, transcript, summary, metadata } = req.body;
    if (metadata?.lead_id) {
      const lead = await Lead.findById(metadata.lead_id);
      if (lead) {
        lead.activities.push({
          type: 'ai_call',
          description: `AI call completed. Duration: ${duration}s. Summary: ${summary || 'N/A'}`,
          metadata: { callId: call_id, status, duration, transcript }
        });
        await lead.save();
        await FollowUp.updateMany({ 'metadata.callId': call_id }, { status: 'delivered', response: transcript });
        req.io?.emit('call_completed', { leadId: lead._id, callId: call_id, summary });
      }
    }
    res.sendStatus(200);
  } catch (err) {
    console.error('Call result webhook error:', err);
    res.sendStatus(200);
  }
});

// Generic lead intake webhook (for forms, Facebook Lead Ads, etc.)
router.post('/lead-intake', async (req, res) => {
  try {
    const secret = req.headers['x-webhook-secret'];
    if (secret !== process.env.WEBHOOK_SECRET) return res.sendStatus(401);

    const { name, email, phone, source, campaign, customFields } = req.body;
    if (!name && !email && !phone) return res.status(400).json({ error: 'Need at least name, email, or phone' });

    // Check for duplicate
    const query = [];
    if (email) query.push({ email });
    if (phone) query.push({ phone: phone.replace(/\D/g, '') });
    let lead = query.length > 0 ? await Lead.findOne({ $or: query }) : null;

    if (!lead) {
      lead = await Lead.create({ name: name || email || phone, email, phone, source: source || 'api', campaign, customFields });
      lead.activities.push({ type: 'created', description: 'Lead created via webhook' });
      await lead.save();
      req.io?.emit('lead_created', { lead, source: 'webhook' });
    }
    res.json({ success: true, leadId: lead._id });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Facebook Lead Ads webhook
router.post('/facebook-leads', async (req, res) => {
  try {
    const entries = req.body.entry || [];
    for (const entry of entries) {
      for (const change of (entry.changes || [])) {
        if (change.field !== 'leadgen') continue;
        const { leadgen_id, form_id } = change.value;
        // In production: fetch lead data from Facebook Graph API using leadgen_id
        req.io?.emit('facebook_lead', { leadgen_id, form_id });
      }
    }
    res.sendStatus(200);
  } catch (err) {
    res.sendStatus(200);
  }
});

module.exports = router;
