const axios = require('axios');
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.apiKey = process.env.BREVO_API_KEY;
    this.fromEmail = process.env.EMAIL_FROM;
    this.fromName = process.env.EMAIL_FROM_NAME || 'LeadFlow CRM';
  }

  // Send via Brevo API (recommended - free 300/day)
  async sendViaBrevo({ to, toName, subject, htmlContent, textContent }) {
    try {
      const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
        sender: { name: this.fromName, email: this.fromEmail },
        to: [{ email: to, name: toName }],
        subject,
        htmlContent: htmlContent || `<p>${textContent}</p>`,
        textContent
      }, {
        headers: { 'api-key': this.apiKey, 'Content-Type': 'application/json' }
      });
      return { success: true, messageId: response.data.messageId };
    } catch (error) {
      console.error('Brevo error:', error.response?.data || error.message);
      throw new Error(error.response?.data?.message || error.message);
    }
  }

  // Send via SMTP (Gmail fallback - 500/day free)
  async sendViaGmail({ to, subject, html, text }) {
    const transporter = nodemailer.createTransporter({
      service: 'gmail',
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD }
    });
    return transporter.sendMail({ from: `"${this.fromName}" <${process.env.GMAIL_USER}>`, to, subject, html, text });
  }

  // Main send method - tries Brevo first, falls back to SMTP
  async send({ lead, subject, message, htmlMessage }) {
    const htmlContent = htmlMessage || this.wrapInTemplate(message, lead.name);
    try {
      const result = await this.sendViaBrevo({
        to: lead.email,
        toName: lead.name,
        subject,
        htmlContent,
        textContent: message
      });
      return result;
    } catch (err) {
      console.log('Brevo failed, trying Gmail fallback:', err.message);
      return this.sendViaGmail({ to: lead.email, subject, html: htmlContent, text: message });
    }
  }

  wrapInTemplate(content, name) {
    return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><style>
      body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { background: #1a1a2e; color: white; padding: 20px; border-radius: 8px 8px 0 0; }
      .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; }
      .footer { text-align: center; font-size: 12px; color: #888; margin-top: 20px; }
    </style></head>
    <body>
      <div class="header"><h2>LeadFlow</h2></div>
      <div class="content">
        <p>Dear ${name},</p>
        ${content.split('\n').map(p => `<p>${p}</p>`).join('')}
      </div>
      <div class="footer">
        <p>This email was sent by LeadFlow CRM. <a href="{{unsubscribe}}">Unsubscribe</a></p>
      </div>
    </body>
    </html>`;
  }
}

module.exports = new EmailService();
