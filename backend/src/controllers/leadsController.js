const { Lead, Activity, User, Campaign } = require('../models');
const { Op } = require('sequelize');
const outreachService = require('../services/outreachService');
const aiService = require('../services/aiService');
const csv = require('csv-parser');
const fs = require('fs');

exports.list = async (req, res) => {
  try {
    const { status, source, search, page = 1, limit = 50, assignedTo, sortBy = 'createdAt', order = 'DESC' } = req.query;
    const where = {};
    if (status) where.status = status;
    if (source) where.source = source;
    if (assignedTo) where.assignedTo = assignedTo;
    if (search) where[Op.or] = [
      { firstName: { [Op.iLike]: `%${search}%` } },
      { lastName:  { [Op.iLike]: `%${search}%` } },
      { email:     { [Op.iLike]: `%${search}%` } },
      { phone:     { [Op.iLike]: `%${search}%` } },
      { company:   { [Op.iLike]: `%${search}%` } }
    ];
    const { count, rows } = await Lead.findAndCountAll({
      where, limit: +limit, offset: (+page - 1) * +limit,
      order: [[sortBy, order]],
      include: [{ model: User, as: 'assignee', attributes: ['id','name','email'] }]
    });
    res.json({ total: count, page: +page, leads: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.create = async (req, res) => {
  try {
    const lead = await Lead.create({ ...req.body, assignedTo: req.body.assignedTo || req.user.id });
    await Activity.create({ leadId: lead.id, userId: req.user.id, type: 'created', body: 'Lead created', direction: 'internal' });
    const score = await aiService.scoreLead(lead);
    await lead.update({ score });
    res.status(201).json(lead);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.get = async (req, res) => {
  try {
    const lead = await Lead.findByPk(req.params.id, {
      include: [
        { model: Activity, as: 'activities', order: [['createdAt','DESC']], limit: 50 },
        { model: User, as: 'assignee', attributes: ['id','name','email'] }
      ]
    });
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    res.json(lead);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.update = async (req, res) => {
  try {
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    const oldStatus = lead.status;
    await lead.update(req.body);
    if (oldStatus !== lead.status) {
      await Activity.create({ leadId: lead.id, userId: req.user.id, type: 'status_change',
        body: `Status changed from ${oldStatus} to ${lead.status}`, direction: 'internal' });
    }
    res.json(lead);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.remove = async (req, res) => {
  try {
    await Lead.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Lead deleted' });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.contact = async (req, res) => {
  try {
    const { channel, message, subject, scheduledAt } = req.body;
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });
    const result = await outreachService.send({ channel, lead, message, subject, userId: req.user.id, scheduledAt });
    await lead.update({ lastContactedAt: new Date(), status: lead.status === 'new' ? 'contacted' : lead.status });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.stats = async (req, res) => {
  try {
    const { sequelize } = require('../models');
    const [byStatus, bySource, recentCount] = await Promise.all([
      Lead.findAll({ attributes: ['status', [sequelize.fn('COUNT','*'), 'count']], group: ['status'] }),
      Lead.findAll({ attributes: ['source', [sequelize.fn('COUNT','*'), 'count']], group: ['source'] }),
      Lead.count({ where: { createdAt: { [Op.gte]: new Date(Date.now() - 30*24*60*60*1000) } } })
    ]);
    res.json({ byStatus, bySource, recentCount });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

exports.importCSV = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const leads = [];
    fs.createReadStream(req.file.path)
      .pipe(csv())
      .on('data', (row) => leads.push({ firstName: row.first_name || row.name || row.firstName || 'Unknown',
        lastName: row.last_name || row.lastName || '', email: row.email || '', phone: row.phone || '',
        company: row.company || '', source: 'manual', assignedTo: req.user.id }))
      .on('end', async () => {
        const created = await Lead.bulkCreate(leads, { ignoreDuplicates: true });
        fs.unlink(req.file.path, () => {});
        res.json({ imported: created.length, total: leads.length });
      });
  } catch (err) { res.status(500).json({ error: err.message }); }
};
