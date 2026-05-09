const axios = require('axios');

class AICallService {
  constructor() {
    this.blandApiKey = process.env.BLAND_API_KEY;
    this.blandBaseUrl = 'https://api.bland.ai/v1';
  }

  // Initiate AI call via Bland.ai (~$0.09/min - cheapest option)
  async initiateAICall({ lead, script, objective }) {
    try {
      const payload = {
        phone_number: lead.phone || lead.whatsapp,
        task: script || this.buildDefaultScript(lead, objective),
        voice: 'nat', // Natural sounding voice
        reduce_latency: true,
        wait_for_greeting: true,
        record: true,
        max_duration: 10, // minutes
        answered_by_enabled: true, // Detect if human answered
        pathway_id: process.env.BLAND_PATHWAY_ID,
        metadata: {
          lead_id: lead._id.toString(),
          lead_name: lead.name,
          company: lead.company
        },
        // Webhook to receive call results
        webhook: `${process.env.BACKEND_URL || 'https://your-domain.com'}/api/webhooks/call-result`
      };

      const response = await axios.post(`${this.blandBaseUrl}/calls`, payload, {
        headers: { authorization: this.blandApiKey, 'Content-Type': 'application/json' }
      });
      return { success: true, callId: response.data.call_id, status: response.data.status };
    } catch (error) {
      console.error('Bland.ai error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  buildDefaultScript(lead, objective = 'follow_up') {
    const scripts = {
      follow_up: `You are a friendly sales representative from ${process.env.COMPANY_NAME || 'our company'}. 
        You are calling ${lead.name}${lead.company ? ` from ${lead.company}` : ''} to follow up on their inquiry.
        Be professional but friendly. Ask if they have any questions and gauge their interest level.
        Try to schedule a meeting or get a commitment for next steps.
        Key points to cover: 1) Thank them for their interest, 2) Ask about their needs, 3) Schedule next steps.`,
      
      qualification: `You are a sales representative calling to qualify a lead.
        Ask ${lead.name} about their budget, timeline, decision-making process, and specific needs.
        Be conversational and listen carefully to their responses.`,
      
      reminder: `You are calling ${lead.name} as a friendly reminder about their upcoming appointment or demo.
        Confirm the details and ask if they have any questions beforehand.`
    };
    return scripts[objective] || scripts.follow_up;
  }

  // Get call status and transcript
  async getCallDetails(callId) {
    try {
      const response = await axios.get(`${this.blandBaseUrl}/calls/${callId}`, {
        headers: { authorization: this.blandApiKey }
      });
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // VAPI.ai alternative (~$0.05/min) - swap in if needed
  async initiateVAPICall({ lead, script }) {
    try {
      const response = await axios.post('https://api.vapi.ai/call', {
        assistantId: process.env.VAPI_ASSISTANT_ID,
        customer: { number: lead.phone, name: lead.name },
        assistant: {
          firstMessage: `Hello, may I speak with ${lead.name}?`,
          systemPrompt: script || this.buildDefaultScript(lead)
        }
      }, {
        headers: { Authorization: `Bearer ${process.env.VAPI_API_KEY}`, 'Content-Type': 'application/json' }
      });
      return { success: true, callId: response.data.id };
    } catch (error) {
      throw new Error(error.response?.data?.message || error.message);
    }
  }
}

module.exports = new AICallService();
