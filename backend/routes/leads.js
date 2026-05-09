const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const Lead = require('../models/Lead');
const { protect } = require('../middleware/auth');

const router = express.Router();
const upload = multer({ dest: 'uploads/', limits: { fileSize: 10 * 1024 * 1024 } });

router.use(protect);

// GET all leads with filtering, search, pagination
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, status, source, priority, assignedTo, tag, sortBy = 'createdAt', sortOrder = 'desc', dateFrom, dateTo } = req.query;
    const query = { isArchived: false };

    if (search) query.$text = { $search: search };
    if (status) query.status = { $in: status.split(',') };
    if (source) query.source = { $in: source.split(',') };
    if (priority) query.priority = { $in: priority.split(',') };
    if (assignedTo) query.assignedTo = assignedTo;
    if (tag) query.tags = { $in: tag.split(',') };
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo);
    }

    // Non-admin can only see assigned leads
    if (req.user.role === 'sales') query.assignedTo = req.user._id;

    const sort = { [sortBy]: sortOrder === 'desc' ? -1 : 1 };
    const skip = (page - 1) * limit;

    const [leads, total] = await Promise.all([
      Lead.find(query).sort(sort).skip(skip).limit(parseInt(limit)).populate('assignedTo', 'name email avatar'),
      Lead.countDocuments(query)
    ]);

    res.json({ success: true, leads, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// GET single lead
router.get('/:id', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('assignedTo', 'name email avatar').populate('activities.performedBy', 'name');
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST create lead
router.post('/', async (req, res) => {
  try {
    const lead = await Lead.create({ ...req.body, createdBy: req.user._id });
    lead.activities.push({ type: 'created', description: 'Lead created', performedBy: req.user._id });
    await lead.save();
    req.io?.emit('lead_created', { lead });
    res.status(201).json({ success: true, lead });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// PATCH update lead
router.patch('/:id', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const oldStatus = lead.status;
    Object.assign(lead, req.body);

    if (oldStatus !== req.body.status && req.body.status) {
      lead.activities.push({ type: 'status_change', description: `Status changed from ${oldStatus} to ${req.body.status}`, performedBy: req.user._id });
    }

    await lead.save();
    req.io?.to(`user_${lead.assignedTo}`).emit('lead_updated', { lead });
    res.json({ success: true, lead });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// DELETE lead (archive)
router.delete('/:id', async (req, res) => {
  try {
    await Lead.findByIdAndUpdate(req.params.id, { isArchived: true });
    res.json({ success: true, message: 'Lead archived' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST add note/activity
router.post('/:id/activities', async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    lead.activities.push({ ...req.body, performedBy: req.user._id });
    await lead.save();
    res.json({ success: true, lead });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// POST bulk import from CSV
router.post('/import/csv', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

  const results = [];
  const errors = [];

  fs.createReadStream(req.file.path)
    .pipe(csv())
    .on('data', (row) => results.push(row))
    .on('end', async () => {
      fs.unlinkSync(req.file.path);
      let imported = 0;

      for (const row of results) {
        try {
          const leadData = {
            name: row.name || row.Name || row['Full Name'],
            email: row.email || row.Email,
            phone: row.phone || row.Phone || row.Mobile,
            company: row.company || row.Company,
            source: row.source || 'csv_import',
            createdBy: req.user._id,
            assignedTo: req.user._id
          };
          if (!leadData.name) continue;
          await Lead.create(leadData);
          imported++;
        } catch (e) {
          errors.push({ row, error: e.message });
        }
      }
      res.json({ success: true, imported, errors, total: results.length });
    })
    .on('error', (err) => res.status(500).json({ success: false, message: err.message }));
});

// GET lead stats
router.get('/stats/overview', async (req, res) => {
  try {
    const query = req.user.role === 'sales' ? { assignedTo: req.user._id } : {};
    const stats = await Lead.aggregate([
      { $match: { ...query, isArchived: false } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalValue: { $sum: '$dealValue' } } }
    ]);
    const total = await Lead.countDocuments({ ...query, isArchived: false });
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const newToday = await Lead.countDocuments({ ...query, createdAt: { $gte: todayStart } });
    res.json({ success: true, stats, total, newToday });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
