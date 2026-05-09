const router = require("express").Router();
const { Lead, Activity } = require("../models");
const aiService = require("../services/aiService");
const logger = require("../utils/logger");

// Twilio WhatsApp inbound
router.post("/twilio/whatsapp", async (req, res) => {
  try {
    const { From, Body, ProfileName } = req.body;
    const phone = From.replace("whatsapp:", "");
    let lead = await Lead.findOne({ where: { whatsapp: phone } }) ||
               await Lead.findOne({ where: { phone } });
    if (!lead) {
      const nameParts = (ProfileName || "Unknown").split(" ");
      lead = await Lead.create({ firstName: nameParts[0], lastName: nameParts.slice(1).join(" "),
        phone, whatsapp: phone, source: "whatsapp", status: "new" });
      logger.info(`New lead from WhatsApp: ${phone}`);
    }
    await Activity.create({ leadId: lead.id, type: "whatsapp", direction: "inbound", body: Body, status: "delivered" });
    res.set("Content-Type","text/xml").send("<?xml version=\"1.0\"?><Response></Response>");
  } catch (err) { logger.error("Webhook error:", err); res.status(500).send("Error"); }
});

// Facebook Lead Ads webhook
router.get("/facebook", (req, res) => {
  if (req.query["hub.verify_token"] === process.env.FB_VERIFY_TOKEN)
    return res.send(req.query["hub.challenge"]);
  res.status(403).send("Forbidden");
});
router.post("/facebook", async (req, res) => {
  try {
    const entries = req.body.entry || [];
    for (const entry of entries) {
      for (const change of entry.changes || []) {
        if (change.field === "leadgen") {
          const { leadgen_id, form_id } = change.value;
          logger.info(`Facebook lead: ${leadgen_id} form: ${form_id}`);
          // Fetch lead details from FB Graph API if token configured
          if (process.env.FB_PAGE_ACCESS_TOKEN) {
            const axios = require("axios");
            const resp = await axios.get(`https://graph.facebook.com/${leadgen_id}?access_token=${process.env.FB_PAGE_ACCESS_TOKEN}`);
            const fields = {};
            (resp.data.field_data || []).forEach(f => { fields[f.name] = f.values[0]; });
            const [first, ...rest] = (fields.full_name || "").split(" ");
            await Lead.create({ firstName: first || "Unknown", lastName: rest.join(" "),
              email: fields.email, phone: fields.phone_number, source: "facebook", status: "new" });
          }
        }
      }
    }
    res.json({ success: true });
  } catch (err) { logger.error("FB webhook error:", err); res.json({ success: false }); }
});

// Web form capture (embed on your website)
router.post("/form", async (req, res) => {
  try {
    const { firstName, lastName, email, phone, company, message, source } = req.body;
    const lead = await Lead.create({ firstName: firstName || "Unknown", lastName, email, phone, company,
      notes: message, source: source || "web_form", status: "new" });
    const score = await aiService.scoreLead(lead);
    await lead.update({ score });
    res.json({ success: true, leadId: lead.id });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
