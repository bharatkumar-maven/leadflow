// followups.js
const express = require('express');
const FollowUp = require('../models/FollowUp');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/', async (req, res) => {
  try {
    const { status, leadId, page = 1, limit = 20 } = req.query;
    const query = {};
    if (status) query.status = { $in: status.split(',') };
    if (leadId) query.lead = leadId;

    const [followUps, total] = await Promise.all([
      FollowUp.find(query).sort({ scheduledAt: 1 }).skip((page - 1) * limit).limit(parseInt(limit)).populate('lead', 'name email phone status'),
      FollowUp.countDocuments(query)
    ]);
    res.json({ success: true, followUps, total });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.post('/', async (req, res) => {
  try {
    const followUp = await FollowUp.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json({ success: true, followUp });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.patch('/:id', async (req, res) => {
  try {
    const followUp = await FollowUp.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json({ success: true, followUp });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

router.delete('/:id', async (req, res) => {
  try {
    await FollowUp.findByIdAndUpdate(req.params.id, { status: 'cancelled' });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;
