const router = require("express").Router();
const auth = require("../middleware/auth");
const { Task, Lead } = require("../models");
const { Op } = require("sequelize");
router.get("/", auth, async (req, res) => {
  try {
    const { status, assignedTo, page=1, limit=50 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (assignedTo) where.assignedTo = assignedTo; else where.assignedTo = req.user.id;
    const tasks = await Task.findAll({ where, limit: +limit, offset: (+page-1)*+limit,
      order: [["dueAt","ASC"]], include: [{ model: Lead, attributes: ["id","firstName","lastName","phone"] }] });
    res.json(tasks);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.post("/", auth, async (req, res) => {
  try {
    const task = await Task.create({ ...req.body, assignedTo: req.body.assignedTo || req.user.id });
    res.status(201).json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.put("/:id", auth, async (req, res) => {
  try {
    const task = await Task.findByPk(req.params.id);
    if (!task) return res.status(404).json({ error: "Task not found" });
    await task.update(req.body);
    res.json(task);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.delete("/:id", auth, async (req, res) => {
  try { await Task.destroy({ where: { id: req.params.id } }); res.json({ message: "Deleted" }); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
