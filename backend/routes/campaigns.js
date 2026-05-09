const express = require('express');
const Campaign = require('../models/Campaign');
const Lead = require('../models/Lead');
const FollowUp = require('../models/FollowUp');
const { protect } = require('../middleware/auth');
const dayjs = require('dayjs');

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const campaigns = await Campaign.find({}).sort({ createdAt: -1 }).populate('createdBy', 'name');
    res.json({ success: true, campaigns });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const campaign = await Campaign.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, campaign });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// Launch campaign - enroll matching leads
router.post('/:id/launch', async (req, res) => {
  try {
    const campaign = await Campaign.findById(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

    // Find matching leads
    const query = { isArchived: false };
    if (campaign.targetSegment.status?.length) query.status = { $in: campaign.targetSegment.status };
    if (campaign.targetSegment.source?.length) query.source = { $in: campaign.targetSegment.source };
    if (campaign.targetSegment.tags?.length) query.tags = { $in: campaign.targetSegment.tags };

    const leads = await Lead.find(query);
    let scheduled = 0;

    for (const lead of leads) {
      for (const step of campaign.sequence) {
        if (step.type === 'wait') continue;
        const scheduledAt = dayjs().add(step.delayDays, 'day').add(step.delayHours, 'hour').toDate();
        await FollowUp.create({
          lead: lead._id, type: step.type, subject: step.subject,
          message: step.message, scheduledAt, sequence: step.order,
          campaignId: campaign._id, createdBy: req.user._id
        });
        scheduled++;
      }
    }

    campaign.status = 'active';
    campaign.stats.totalLeads = leads.length;
    await campaign.save();

    res.json({ success: true, campaign, leadsEnrolled: leads.length, followUpsScheduled: scheduled });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.patch('/:id', async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, campaign });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

module.exports = router;
