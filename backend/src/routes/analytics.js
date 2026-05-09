const router = require("express").Router();
const auth = require("../middleware/auth");
const { Lead, Activity, Task } = require("../models");
const { Op, fn, col, literal } = require("sequelize");

router.get("/overview", auth, async (req, res) => {
  try {
    const now = new Date();
    const thirtyDaysAgo = new Date(now - 30*24*60*60*1000);
    const [total, newLeads, contacted, qualified, won, lost, activities] = await Promise.all([
      Lead.count(),
      Lead.count({ where: { status: "new" } }),
      Lead.count({ where: { status: "contacted" } }),
      Lead.count({ where: { status: "qualified" } }),
      Lead.count({ where: { status: "won" } }),
      Lead.count({ where: { status: "lost" } }),
      Activity.count({ where: { createdAt: { [Op.gte]: thirtyDaysAgo } } })
    ]);
    const conversionRate = total > 0 ? ((won / total) * 100).toFixed(1) : 0;
    res.json({ total, newLeads, contacted, qualified, won, lost, activities, conversionRate });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/pipeline", auth, async (req, res) => {
  try {
    const { sequelize } = require("../models");
    const pipeline = await Lead.findAll({
      attributes: ["status", [fn("COUNT", col("id")), "count"], [fn("SUM", col("value")), "totalValue"]],
      group: ["status"]
    });
    res.json(pipeline);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/activity-feed", auth, async (req, res) => {
  try {
    const activities = await Activity.findAll({
      order: [["createdAt","DESC"]], limit: 50,
      include: [{ model: require("../models").Lead, attributes: ["id","firstName","lastName","email"] }]
    });
    res.json(activities);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get("/sources", auth, async (req, res) => {
  try {
    const { sequelize } = require("../models");
    const data = await Lead.findAll({
      attributes: ["source", [fn("COUNT", col("id")), "count"]],
      group: ["source"]
    });
    res.json(data);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
