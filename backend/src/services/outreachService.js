const nodemailer = require("nodemailer");
const axios = require("axios");
const { Activity } = require("../models");
const logger = require("../utils/logger");

// ─── Email via SMTP (Brevo free tier: 300 emails/day free) ───────────────────
async function sendEmail({ lead, subject, message, userId }) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-relay.brevo.com",
    port: process.env.SMTP_PORT || 587,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
  });
  let info;
  try {
    info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || "LeadFlow CRM"}" <${process.env.EMAIL_FROM}>`,
      to: lead.email,
      subject: subject || "Following up",
      html: message.replace(/\n/g, "<br>")
    });
    logger.info(`Email sent to ${lead.email}: ${info.messageId}`);
  } catch (err) {
    logger.error("Email failed:", err);
    await Activity.create({ leadId: lead.id, userId, type: "email", direction: "outbound",
      subject, body: message, status: "failed", metadata: { error: err.message } });
    throw err;
  }
  await Activity.create({ leadId: lead.id, userId, type: "email", direction: "outbound",
    subject, body: message, status: "sent", metadata: { messageId: info.messageId } });
  return { success: true, messageId: info.messageId };
}

// ─── WhatsApp via Twilio (cheapest option ~$0.005/msg) ──────────────────────
async function sendWhatsApp({ lead, message, userId }) {
  const phone = lead.whatsapp || lead.phone;
  if (!phone) throw new Error("No WhatsApp number for lead");
  if (!process.env.TWILIO_ACCOUNT_SID) {
    // Mock for demo mode
    await Activity.create({ leadId: lead.id, userId, type: "whatsapp", direction: "outbound",
      body: message, status: "sent", metadata: { demo: true, to: phone } });
    return { success: true, demo: true };
  }
  const twilio = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  let msg;
  try {
    msg = await twilio.messages.create({
      body: message,
      from: process.env.TWILIO_WHATSAPP_NUMBER || "whatsapp:+14155238886",
      to: `whatsapp:${phone.startsWith("+") ? phone : "+" + phone}`
    });
  } catch (err) {
    await Activity.create({ leadId: lead.id, userId, type: "whatsapp", direction: "outbound",
      body: message, status: "failed", metadata: { error: err.message } });
    throw err;
  }
  await Activity.create({ leadId: lead.id, userId, type: "whatsapp", direction: "outbound",
    body: message, status: "sent", metadata: { sid: msg.sid } });
  return { success: true, sid: msg.sid };
}

// ─── SMS via Twilio ──────────────────────────────────────────────────────────
async function sendSMS({ lead, message, userId }) {
  const phone = lead.phone;
  if (!phone) throw new Error("No phone number for lead");
  if (!process.env.TWILIO_ACCOUNT_SID) {
    await Activity.create({ leadId: lead.id, userId, type: "sms", direction: "outbound",
      body: message, status: "sent", metadata: { demo: true } });
    return { success: true, demo: true };
  }
  const twilio = require("twilio")(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  const msg = await twilio.messages.create({
    body: message, from: process.env.TWILIO_PHONE_NUMBER, to: phone.startsWith("+") ? phone : "+" + phone
  });
  await Activity.create({ leadId: lead.id, userId, type: "sms", direction: "outbound",
    body: message, status: "sent", metadata: { sid: msg.sid } });
  return { success: true, sid: msg.sid };
}

// ─── AI Voice Call via Vapi.ai (~$0.05/min, free trial $10) ─────────────────
async function makeAICall({ lead, script, userId }) {
  const phone = lead.phone;
  if (!phone) throw new Error("No phone number for lead");
  if (!process.env.VAPI_API_KEY) {
    await Activity.create({ leadId: lead.id, userId, type: "ai_call", direction: "outbound",
      body: script || "AI call initiated", status: "sent", metadata: { demo: true } });
    return { success: true, demo: true, message: "Demo mode: configure VAPI_API_KEY to make real AI calls" };
  }
  const resp = await axios.post("https://api.vapi.ai/call/phone", {
    phoneNumberId: process.env.VAPI_PHONE_NUMBER_ID,
    assistantId: process.env.VAPI_ASSISTANT_ID,
    customer: { number: phone.startsWith("+") ? phone : "+" + phone, name: `${lead.firstName} ${lead.lastName || ""}` },
    assistantOverrides: script ? { firstMessage: script } : undefined
  }, { headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}` } });
  await Activity.create({ leadId: lead.id, userId, type: "ai_call", direction: "outbound",
    body: script || "AI call initiated", status: "sent", metadata: { callId: resp.data.id } });
  return { success: true, callId: resp.data.id };
}

// ─── Manual call log ─────────────────────────────────────────────────────────
async function logCall({ lead, notes, duration, userId }) {
  await Activity.create({ leadId: lead.id, userId, type: "call", direction: "outbound",
    body: notes, status: "completed", duration, completedAt: new Date() });
  return { success: true };
}

// ─── Main dispatch ────────────────────────────────────────────────────────────
exports.send = async ({ channel, lead, message, subject, userId, notes, duration, script }) => {
  switch (channel) {
    case "email":     return sendEmail({ lead, subject, message, userId });
    case "whatsapp":  return sendWhatsApp({ lead, message, userId });
    case "sms":       return sendSMS({ lead, message, userId });
    case "ai_call":   return makeAICall({ lead, script, userId });
    case "call":      return logCall({ lead, notes: notes || message, duration, userId });
    default: throw new Error(`Unknown channel: ${channel}`);
  }
};
