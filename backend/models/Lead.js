const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  type: { type: String, enum: ['email', 'whatsapp', 'call', 'ai_call', 'note', 'status_change', 'created', 'imported'], required: true },
  description: String,
  metadata: mongoose.Schema.Types.Mixed,
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdAt: { type: Date, default: Date.now }
});

const leadSchema = new mongoose.Schema({
  // Basic Info
  name: { type: String, required: true, trim: true },
  email: { type: String, trim: true, lowercase: true },
  phone: { type: String, trim: true },
  whatsapp: { type: String, trim: true },
  company: { type: String, trim: true },
  designation: { type: String, trim: true },
  website: { type: String, trim: true },

  // Lead Management
  status: {
    type: String,
    enum: ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won', 'lost', 'unqualified'],
    default: 'new'
  },
  priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium' },
  score: { type: Number, default: 0, min: 0, max: 100 },
  stage: { type: String, default: 'Awareness' },

  // Source
  source: {
    type: String,
    enum: ['website', 'facebook', 'instagram', 'linkedin', 'google_ads', 'referral', 'cold_call', 'email_campaign', 'whatsapp', 'manual', 'csv_import', 'api', 'other'],
    default: 'manual'
  },
  campaign: { type: String },
  sourceDetails: mongoose.Schema.Types.Mixed,

  // Deal Info
  dealValue: { type: Number, default: 0 },
  currency: { type: String, default: 'INR' },
  expectedCloseDate: Date,
  probability: { type: Number, default: 0, min: 0, max: 100 },

  // Tags & Custom Fields
  tags: [String],
  customFields: mongoose.Schema.Types.Mixed,
  notes: String,

  // Assignment
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  team: { type: String },

  // Communication Preferences
  preferredChannel: { type: String, enum: ['email', 'whatsapp', 'call', 'any'], default: 'any' },
  doNotContact: { type: Boolean, default: false },
  optedOutEmail: { type: Boolean, default: false },
  optedOutWhatsapp: { type: Boolean, default: false },

  // Follow-up
  nextFollowUp: Date,
  lastContactedAt: Date,
  followUpCount: { type: Number, default: 0 },

  // Activity log
  activities: [activitySchema],

  // Meta
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isArchived: { type: Boolean, default: false },

}, { timestamps: true });

// Indexes
leadSchema.index({ email: 1 });
leadSchema.index({ phone: 1 });
leadSchema.index({ status: 1 });
leadSchema.index({ assignedTo: 1 });
leadSchema.index({ nextFollowUp: 1 });
leadSchema.index({ createdAt: -1 });
leadSchema.index({ name: 'text', email: 'text', company: 'text', phone: 'text' });

// Auto-calculate score
leadSchema.pre('save', function(next) {
  let score = 0;
  if (this.email) score += 15;
  if (this.phone) score += 15;
  if (this.company) score += 10;
  if (this.dealValue > 0) score += 20;
  if (this.expectedCloseDate) score += 10;
  if (this.activities.length > 0) score += Math.min(this.activities.length * 5, 30);
  this.score = Math.min(score, 100);
  next();
});

module.exports = mongoose.model('Lead', leadSchema);
