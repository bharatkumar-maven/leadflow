const router = require("express").Router();
const auth = require("../middleware/auth");
const { Activity } = require("../models");
router.get("/", auth, async (req, res) => {
  try {
    const { leadId, type, page=1, limit=30 } = req.query;
    const where = {};
    if (leadId) where.leadId = leadId;
    if (type) where.type = type;
    const { count, rows } = await Activity.findAndCountAll({
      where, limit: +limit, offset: (+page-1)*+limit, order: [["createdAt","DESC"]]
    });
    res.json({ total: count, activities: rows });
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post("/", auth, async (req, res) => {
  try {
    const activity = await Activity.create({ ...req.body, userId: req.user.id });
    res.status(201).json(activity);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
