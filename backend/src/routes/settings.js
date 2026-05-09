const router = require("express").Router();
const auth = require("../middleware/auth");
const { User, Template } = require("../models");

router.get("/templates", auth, async (_req, res) => {
  try { res.json(await Template.findAll({ where: { isActive: true } })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.post("/templates", auth, async (req, res) => {
  try { res.status(201).json(await Template.create(req.body)); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
router.put("/templates/:id", auth, async (req, res) => {
  try {
    const t = await Template.findByPk(req.params.id);
    if (!t) return res.status(404).json({ error: "Not found" });
    await t.update(req.body);
    res.json(t);
  } catch (err) { res.status(500).json({ error: err.message }); }
});
router.get("/users", auth, async (_req, res) => {
  try { res.json(await User.findAll({ attributes: { exclude: ["password"] }, where: { isActive: true } })); }
  catch (err) { res.status(500).json({ error: err.message }); }
});
module.exports = router;
