const router = require("express").Router();
const auth = require("../middleware/auth");
const aiService = require("../services/aiService");
const { Lead } = require("../models");

router.post("/draft-message", auth, async (req, res) => {
  try {
    const { leadId, channel, context } = req.body;
    const lead = await Lead.findByPk(leadId);
    if (!lead) return res.status(404).json({ error: "Lead not found" });
    const result = await aiService.draftMessage({ lead, channel, context });
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/analyze", auth, async (req, res) => {
  try {
    const leads = await Lead.findAll({ limit: 50, order: [["createdAt","DESC"]] });
    const result = await aiService.analyzeLeads(leads);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/rescore/:id", auth, async (req, res) => {
  try {
    const lead = await Lead.findByPk(req.params.id);
    if (!lead) return res.status(404).json({ error: "Not found" });
    const score = await aiService.scoreLead(lead);
    await lead.update({ score });
    res.json({ score });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
