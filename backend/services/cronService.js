const cron = require('node-cron');
const dayjs = require('dayjs');
const FollowUp = require('../models/FollowUp');
const Lead = require('../models/Lead');
const emailService = require('./emailService');
const whatsappService = require('./whatsappService');
const aiCallService = require('./aiCallService');

async function processScheduledFollowUps(io) {
  try {
    const now = new Date();
    const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);

    const dueFollowUps = await FollowUp.find({
      status: 'scheduled',
      scheduledAt: { $lte: fiveMinutesLater }
    }).populate('lead');

    console.log(`Processing ${dueFollowUps.length} follow-ups`);

    for (const followUp of dueFollowUps) {
      try {
        const lead = followUp.lead;
        if (!lead || lead.doNotContact) {
          followUp.status = 'cancelled';
          await followUp.save();
          continue;
        }

        let result;

        if (followUp.type === 'email' && lead.email && !lead.optedOutEmail) {
          result = await emailService.send({ lead, subject: followUp.subject || 'Follow-up', message: followUp.message });
          followUp.status = 'sent';
          followUp.sentAt = new Date();

        } else if (followUp.type === 'whatsapp' && (lead.whatsapp || lead.phone) && !lead.optedOutWhatsapp) {
          result = await whatsappService.sendTextMessage(lead.whatsapp || lead.phone, followUp.message);
          followUp.status = 'sent';
          followUp.sentAt = new Date();

        } else if (followUp.type === 'ai_call' && lead.phone) {
          result = await aiCallService.initiateAICall({ lead, script: followUp.message });
          followUp.status = 'sent';
          followUp.sentAt = new Date();
          if (result?.callId) followUp.metadata = { callId: result.callId };
        }

        // Log activity on lead
        if (result) {
          lead.activities.push({
            type: followUp.type,
            description: `${followUp.type} follow-up sent: ${followUp.subject || followUp.message.substring(0, 50)}...`,
            metadata: result
          });
          lead.lastContactedAt = new Date();
          lead.followUpCount = (lead.followUpCount || 0) + 1;
          await lead.save();
        }

        await followUp.save();

        // Real-time notification
        if (io) {
          io.emit('followup_sent', { followUpId: followUp._id, leadId: lead._id, type: followUp.type });
        }

      } catch (err) {
        console.error(`Follow-up ${followUp._id} failed:`, err.message);
        followUp.status = 'failed';
        followUp.metadata = { error: err.message };
        await followUp.save();
      }
    }
  } catch (err) {
    console.error('Cron job error:', err);
  }
}

// Reminder: leads with no contact in X days
async function sendStaleLeadReminders(io) {
  try {
    const threeDaysAgo = dayjs().subtract(3, 'day').toDate();
    const staleLeads = await Lead.find({
      status: { $in: ['new', 'contacted', 'qualified'] },
      $or: [{ lastContactedAt: { $lt: threeDaysAgo } }, { lastContactedAt: { $exists: false } }],
      isArchived: false
    }).limit(50);

    if (staleLeads.length > 0 && io) {
      io.emit('stale_leads_alert', { count: staleLeads.length, leads: staleLeads.map(l => ({ _id: l._id, name: l.name, daysSinceContact: dayjs().diff(dayjs(l.lastContactedAt || l.createdAt), 'day') })) });
    }
  } catch (err) {
    console.error('Stale lead reminder error:', err);
  }
}

function setupCronJobs(io) {
  // Process follow-ups every minute
  cron.schedule('* * * * *', () => processScheduledFollowUps(io));
  
  // Stale lead reminders every 2 hours
  cron.schedule('0 */2 * * *', () => sendStaleLeadReminders(io));
  
  console.log('✅ Cron jobs initialized');
}

module.exports = { setupCronJobs, processScheduledFollowUps };
