const mongoose = require('mongoose');

const followUpSchema = new mongoose.Schema({
  lead: { type: mongoose.Schema.Types.ObjectId, ref: 'Lead', required: true },
  type: { type: String, enum: ['email', 'whatsapp', 'ai_call', 'manual_call', 'sms'], required: true },
  status: { type: String, enum: ['scheduled', 'sent', 'delivered', 'read', 'failed', 'cancelled'], default: 'scheduled' },
  scheduledAt: { type: Date, required: true },
  sentAt: Date,
  subject: String,
  message: { type: String, required: true },
  templateId: String,
  aiGenerated: { type: Boolean, default: false },
  response: String,
  metadata: mongoose.Schema.Types.Mixed,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  sequence: { type: Number, default: 1 },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign' }
}, { timestamps: true });

followUpSchema.index({ scheduledAt: 1, status: 1 });
followUpSchema.index({ lead: 1 });

module.exports = mongoose.model('FollowUp', followUpSchema);
