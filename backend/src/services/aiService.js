const Anthropic = require("@anthropic-ai/sdk");
const logger = require("../utils/logger");

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Score a lead 0-100 using Claude
exports.scoreLead = async (lead) => {
  if (!process.env.ANTHROPIC_API_KEY) return 50; // default if no key
  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 100,
      messages: [{
        role: "user",
        content: `Score this sales lead from 0-100 (100=highest intent). Reply with ONLY a number.
Lead: ${JSON.stringify({ firstName: lead.firstName, company: lead.company, source: lead.source, jobTitle: lead.jobTitle, value: lead.value })}`
      }]
    });
    const score = parseInt(msg.content[0].text.trim());
    return isNaN(score) ? 50 : Math.min(100, Math.max(0, score));
  } catch (err) {
    logger.error("AI scoring failed:", err);
    return 50;
  }
};

// Draft a personalized follow-up message
exports.draftMessage = async ({ lead, channel, context }) => {
  if (!process.env.ANTHROPIC_API_KEY) return { draft: `Hi ${lead.firstName}, just following up...` };
  try {
    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      messages: [{
        role: "user",
        content: `Draft a ${channel} follow-up message for this sales lead. Keep it brief, personal, and professional.
Lead info: Name=${lead.firstName} ${lead.lastName||""}, Company=${lead.company||"N/A"}, Status=${lead.status}, Source=${lead.source}
Context: ${context || "General follow-up"}
Channel: ${channel} (${channel==="whatsapp"||channel==="sms" ? "keep under 160 chars, casual tone" : "professional email, include subject"})
Output only the message text, no explanation.`
      }]
    });
    return { draft: msg.content[0].text.trim() };
  } catch (err) {
    logger.error("AI draft failed:", err);
    return { draft: `Hi ${lead.firstName}, I wanted to follow up about your inquiry. Would you be available for a quick call?` };
  }
};

// Analyze a batch of leads
exports.analyzeLeads = async (leads) => {
  if (!process.env.ANTHROPIC_API_KEY) return { insights: "Configure ANTHROPIC_API_KEY for AI insights." };
  try {
    const summary = leads.slice(0, 20).map(l => `${l.firstName} ${l.lastName||""} | ${l.status} | ${l.source} | score:${l.score}`).join("\n");
    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      messages: [{
        role: "user",
        content: `Analyze these ${leads.length} sales leads and give 3-4 actionable insights for the sales team:\n${summary}`
      }]
    });
    return { insights: msg.content[0].text.trim() };
  } catch (err) {
    return { insights: "AI analysis temporarily unavailable." };
  }
};
