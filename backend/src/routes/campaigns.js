const router = require("express").Router();
const auth = require("../middleware/auth");
const { Campaign, Lead } = require("../models");
const outreach = require("../services/outreachService");
router.get("/", auth, async (_req, res) => {
  try { res.json(await Campaign.findAll({ order: [["createdAt","DESC"]] })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.post("/", auth, async (req, res) => {
  try { res.status(201).json(await Campaign.create(req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.post("/:id/send", auth, async (req, res) => {
  try {
    const campaign = await Campaign.findByPk(req.params.id);
    if (!campaign) return res.status(404).json({ error: "Not found" });
    const { status: leadStatus, message, subject, channel } = req.body;
    const leads = await Lead.findAll({ where: leadStatus ? { status: leadStatus } : {} });
    let sent = 0, failed = 0;
    for (const lead of leads) {
      try { await outreach.send({ channel, lead, message, subject, userId: req.user.id }); sent++; }
      catch { failed++; }
    }
    await campaign.update({ "stats.sent": (campaign.stats.sent || 0) + sent });
    res.json({ sent, failed, total: leads.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
