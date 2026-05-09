const mongoose = require('mongoose');

const sequenceStepSchema = new mongoose.Schema({
  order: { type: Number, required: true },
  type: { type: String, enum: ['email', 'whatsapp', 'ai_call', 'wait'], required: true },
  delayDays: { type: Number, default: 0 },
  delayHours: { type: Number, default: 0 },
  subject: String,
  message: { type: String, required: true },
  condition: { type: String, enum: ['always', 'if_no_reply', 'if_opened', 'if_clicked'], default: 'always' }
});

const campaignSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  status: { type: String, enum: ['draft', 'active', 'paused', 'completed'], default: 'draft' },
  type: { type: String, enum: ['drip', 'blast', 'triggered'], default: 'drip' },
  sequence: [sequenceStepSchema],
  targetSegment: {
    status: [String],
    source: [String],
    tags: [String],
    assignedTo: [mongoose.Schema.Types.ObjectId]
  },
  stats: {
    totalLeads: { type: Number, default: 0 },
    sent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    replied: { type: Number, default: 0 },
    converted: { type: Number, default: 0 }
  },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

module.exports = mongoose.model('Campaign', campaignSchema);
