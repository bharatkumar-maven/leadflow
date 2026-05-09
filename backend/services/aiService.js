const axios = require('axios');

class AIService {
  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY;
    this.model = 'claude-sonnet-4-20250514';
  }

  async generateMessage({ lead, type, purpose, companyContext = '' }) {
    const prompts = {
      email: `Generate a professional sales follow-up email for this lead:
        Name: ${lead.name}
        Company: ${lead.company || 'Unknown'}
        Status: ${lead.status}
        Source: ${lead.source}
        Notes: ${lead.notes || 'None'}
        Purpose: ${purpose || 'follow up and move them forward in the sales process'}
        ${companyContext ? `Company context: ${companyContext}` : ''}
        
        Write a compelling, personalized email. Return JSON with: { "subject": "...", "message": "..." }
        Keep it under 150 words. Be conversational, not salesy.`,
      
      whatsapp: `Generate a short WhatsApp follow-up message for:
        Name: ${lead.name}
        Status: ${lead.status}
        Purpose: ${purpose || 'follow up'}
        ${companyContext ? `Company context: ${companyContext}` : ''}
        
        Return JSON: { "message": "..." }
        Keep it under 100 words. Use WhatsApp-friendly formatting (emojis okay). Casual but professional.`,
      
      call_script: `Generate an AI call script for:
        Lead: ${lead.name}, ${lead.company || ''}
        Purpose: ${purpose || 'qualification and follow-up'}
        ${companyContext ? `Our company: ${companyContext}` : ''}
        
        Return JSON: { "script": "..." }
        Make it conversational, include how to handle common objections.`
    };

    try {
      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: this.model,
        max_tokens: 500,
        messages: [{ role: 'user', content: prompts[type] || prompts.email }]
      }, {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json'
        }
      });

      const text = response.data.content[0].text;
      try {
        const clean = text.replace(/```json|```/g, '').trim();
        return { success: true, data: JSON.parse(clean) };
      } catch {
        return { success: true, data: { message: text, subject: 'Follow-up' } };
      }
    } catch (error) {
      console.error('AI service error:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  async analyzeLead(lead) {
    try {
      const response = await axios.post('https://api.anthropic.com/v1/messages', {
        model: this.model,
        max_tokens: 300,
        messages: [{
          role: 'user',
          content: `Analyze this sales lead and provide insights:
            ${JSON.stringify({ name: lead.name, company: lead.company, source: lead.source, status: lead.status, activities: lead.activities?.length, dealValue: lead.dealValue })}
            
            Return JSON: { "score": 0-100, "recommendation": "next best action", "insights": ["insight1", "insight2"], "priority": "low|medium|high" }`
        }]
      }, {
        headers: { 'x-api-key': this.apiKey, 'anthropic-version': '2023-06-01', 'Content-Type': 'application/json' }
      });
      const clean = response.data.content[0].text.replace(/```json|```/g, '').trim();
      return { success: true, data: JSON.parse(clean) };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

module.exports = new AIService();
