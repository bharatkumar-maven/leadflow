const axios = require('axios');

class WhatsAppService {
  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    this.baseUrl = `https://graph.facebook.com/v18.0/${this.phoneNumberId}/messages`;
  }

  formatPhone(phone) {
    // Remove all non-digits, ensure starts with country code
    let cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = '91' + cleaned.slice(1); // India default
    if (!cleaned.startsWith('91') && cleaned.length === 10) cleaned = '91' + cleaned;
    return cleaned;
  }

  async sendTextMessage(to, message) {
    try {
      const response = await axios.post(this.baseUrl, {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: this.formatPhone(to),
        type: 'text',
        text: { preview_url: true, body: message }
      }, {
        headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' }
      });
      return { success: true, messageId: response.data.messages?.[0]?.id };
    } catch (error) {
      console.error('WhatsApp API error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.error?.message || error.message);
    }
  }

  // Send template message (for marketing - must use approved templates)
  async sendTemplateMessage(to, templateName, languageCode = 'en_US', components = []) {
    try {
      const response = await axios.post(this.baseUrl, {
        messaging_product: 'whatsapp',
        to: this.formatPhone(to),
        type: 'template',
        template: { name: templateName, language: { code: languageCode }, components }
      }, {
        headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' }
      });
      return { success: true, messageId: response.data.messages?.[0]?.id };
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || error.message);
    }
  }

  // Send interactive message with buttons
  async sendInteractiveMessage(to, body, buttons) {
    try {
      const response = await axios.post(this.baseUrl, {
        messaging_product: 'whatsapp',
        to: this.formatPhone(to),
        type: 'interactive',
        interactive: {
          type: 'button',
          body: { text: body },
          action: {
            buttons: buttons.map((btn, i) => ({
              type: 'reply',
              reply: { id: `btn_${i}`, title: btn }
            }))
          }
        }
      }, {
        headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' }
      });
      return { success: true, messageId: response.data.messages?.[0]?.id };
    } catch (error) {
      throw new Error(error.response?.data?.error?.message || error.message);
    }
  }

  // Process incoming webhook
  processWebhook(body) {
    const messages = [];
    try {
      const entry = body.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      if (value?.messages) {
        for (const msg of value.messages) {
          messages.push({
            from: msg.from,
            id: msg.id,
            timestamp: msg.timestamp,
            type: msg.type,
            text: msg.text?.body,
            name: value.contacts?.[0]?.profile?.name
          });
        }
      }
    } catch (e) { console.error('Webhook parse error:', e); }
    return messages;
  }
}

module.exports = new WhatsAppService();
