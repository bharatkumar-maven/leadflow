const express = require('express');
const Lead = require('../models/Lead');
const FollowUp = require('../models/FollowUp');
const emailService = require('../services/emailService');
const whatsappService = require('../services/whatsappService');
const aiCallService = require('../services/aiCallService');
const aiService = require('../services/aiService');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

// Send email
router.post('/email', async (req, res) => {
  try {
    const { leadId, subject, message, htmlMessage, schedule } = req.body;
    const lead = await Lead.findById(leadId);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    if (!lead.email) return res.status(400).json({ success: false, message: 'Lead has no email' });

    if (schedule) {
      const followUp = await FollowUp.create({
        lead: leadId, type: 'email', subject, message,
        scheduledAt: new Date(schedule), createdBy: req.user._id
      });
      return res.json({ success: true, scheduled: true, followUp });
    }

    const result = await emailService.send({ lead, subject, message, htmlMessage });
    lead.activities.push({ type: 'email', description: `Email sent: ${subject}`, performedBy: req.user._id, metadata: result });
    lead.lastContactedAt = new Date();
    await lead.save();
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Send WhatsApp
router.post('/whatsapp', async (req, res) => {
  try {
    const { leadId, message, schedule, interactive, buttons } = req.body;
    const lead = await Lead.findById(leadId);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    const phone = lead.whatsapp || lead.phone;
    if (!phone) return res.status(400).json({ success: false, message: 'Lead has no WhatsApp/phone' });

    if (schedule) {
      const followUp = await FollowUp.create({
        lead: leadId, type: 'whatsapp', message,
        scheduledAt: new Date(schedule), createdBy: req.user._id
      });
      return res.json({ success: true, scheduled: true, followUp });
    }

    let result;
    if (interactive && buttons) {
      result = await whatsappService.sendInteractiveMessage(phone, message, buttons);
    } else {
      result = await whatsappService.sendTextMessage(phone, message);
    }

    lead.activities.push({ type: 'whatsapp', description: `WhatsApp sent: ${message.substring(0, 50)}...`, performedBy: req.user._id, metadata: result });
    lead.lastContactedAt = new Date();
    await lead.save();
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Initiate AI call
router.post('/ai-call', async (req, res) => {
  try {
    const { leadId, script, objective, schedule } = req.body;
    const lead = await Lead.findById(leadId);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    if (!lead.phone) return res.status(400).json({ success: false, message: 'Lead has no phone number' });

    if (schedule) {
      const followUp = await FollowUp.create({
        lead: leadId, type: 'ai_call', message: script || 'AI follow-up call',
        scheduledAt: new Date(schedule), createdBy: req.user._id
      });
      return res.json({ success: true, scheduled: true, followUp });
    }

    const result = await aiCallService.initiateAICall({ lead, script, objective });
    lead.activities.push({ type: 'ai_call', description: `AI call initiated`, performedBy: req.user._id, metadata: result });
    lead.lastContactedAt = new Date();
    await lead.save();
    res.json({ success: true, result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Generate AI message
router.post('/ai-generate', async (req, res) => {
  try {
    const { leadId, type, purpose } = req.body;
    const lead = await Lead.findById(leadId);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const result = await aiService.generateMessage({ lead, type, purpose });
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// AI lead analysis
router.post('/ai-analyze/:leadId', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.leadId);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    const result = await aiService.analyzeLead(lead);
    res.json({ success: true, ...result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// Bulk communicate
router.post('/bulk', async (req, res) => {
  try {
    const { leadIds, type, subject, message, schedule } = req.body;
    const results = { success: 0, failed: 0, scheduled: 0, errors: [] };

    for (const leadId of leadIds) {
      try {
        const lead = await Lead.findById(leadId);
        if (!lead || lead.doNotContact) continue;

        if (schedule) {
          await FollowUp.create({ lead: leadId, type, subject, message, scheduledAt: new Date(schedule), createdBy: req.user._id });
          results.scheduled++;
        } else if (type === 'email' && lead.email && !lead.optedOutEmail) {
          await emailService.send({ lead, subject, message });
          results.success++;
        } else if (type === 'whatsapp' && (lead.whatsapp || lead.phone) && !lead.optedOutWhatsapp) {
          await whatsappService.sendTextMessage(lead.whatsapp || lead.phone, message);
          results.success++;
          await new Promise(r => setTimeout(r, 500)); // Rate limit
        }
      } catch (e) {
        results.failed++;
        results.errors.push({ leadId, error: e.message });
      }
    }
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
