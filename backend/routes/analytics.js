const express = require('express');
const dayjs = require('dayjs');
const Lead = require('../models/Lead');
const FollowUp = require('../models/FollowUp');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

router.get('/dashboard', async (req, res) => {
  try {
    const { from, to } = req.query;
    const start = from ? new Date(from) : dayjs().subtract(30, 'day').toDate();
    const end = to ? new Date(to) : new Date();
    const baseQuery = req.user.role === 'sales' ? { assignedTo: req.user._id } : {};

    const [
      totalLeads, newLeads, wonLeads, pipeline,
      byStatus, bySource, recentActivity, followUpStats
    ] = await Promise.all([
      Lead.countDocuments({ ...baseQuery, isArchived: false }),
      Lead.countDocuments({ ...baseQuery, isArchived: false, createdAt: { $gte: start, $lte: end } }),
      Lead.countDocuments({ ...baseQuery, status: 'won', updatedAt: { $gte: start } }),
      Lead.aggregate([
        { $match: { ...baseQuery, isArchived: false, status: { $nin: ['won', 'lost'] } } },
        { $group: { _id: null, total: { $sum: '$dealValue' }, count: { $sum: 1 } } }
      ]),
      Lead.aggregate([
        { $match: { ...baseQuery, isArchived: false } },
        { $group: { _id: '$status', count: { $sum: 1 }, value: { $sum: '$dealValue' } } }
      ]),
      Lead.aggregate([
        { $match: { ...baseQuery, isArchived: false, createdAt: { $gte: start } } },
        { $group: { _id: '$source', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]),
      Lead.find({ ...baseQuery, isArchived: false }).sort({ updatedAt: -1 }).limit(10).select('name status updatedAt source score'),
      FollowUp.aggregate([
        { $match: { scheduledAt: { $gte: start } } },
        { $group: { _id: '$type', sent: { $sum: { $cond: [{ $eq: ['$status', 'sent'] }, 1, 0] } }, failed: { $sum: { $cond: [{ $eq: ['$status', 'failed'] }, 1, 0] } }, scheduled: { $sum: { $cond: [{ $eq: ['$status', 'scheduled'] }, 1, 0] } } } }
      ])
    ]);

    // Daily leads chart
    const dailyLeads = await Lead.aggregate([
      { $match: { ...baseQuery, createdAt: { $gte: start, $lte: end } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 }, value: { $sum: '$dealValue' } } },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        totalLeads,
        newLeads,
        wonLeads,
        pipelineValue: pipeline[0]?.total || 0,
        pipelineCount: pipeline[0]?.count || 0,
        conversionRate: totalLeads > 0 ? ((wonLeads / totalLeads) * 100).toFixed(1) : 0,
        byStatus,
        bySource,
        recentActivity,
        followUpStats,
        dailyLeads
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/funnel', async (req, res) => {
  try {
    const baseQuery = req.user.role === 'sales' ? { assignedTo: req.user._id } : {};
    const stages = ['new', 'contacted', 'qualified', 'proposal', 'negotiation', 'won'];
    const funnel = await Promise.all(stages.map(async (stage) => {
      const count = await Lead.countDocuments({ ...baseQuery, status: stage, isArchived: false });
      const value = await Lead.aggregate([{ $match: { ...baseQuery, status: stage } }, { $group: { _id: null, total: { $sum: '$dealValue' } } }]);
      return { stage, count, value: value[0]?.total || 0 };
    }));
    res.json({ success: true, funnel });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
