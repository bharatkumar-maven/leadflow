# 🚀 LeadFlow CRM — Multi-Channel Lead Management Platform

A complete, production-ready CRM system with AI-powered lead management, WhatsApp, Email, SMS, and AI Voice Call automation.

## ✨ Features

- **Multi-source lead capture**: Web forms, Facebook Ads, WhatsApp inbound, Email, manual entry + CSV import
- **Multi-channel outreach**: Email, WhatsApp, SMS, AI voice calls, manual call logging
- **AI-powered**: Lead scoring, personalized message drafting, sales insights (Claude AI)
- **Automation**: Scheduled follow-ups, task reminders, status tracking
- **Full CRM**: Pipeline view, activity timeline, deal values, tags
- **Dashboard**: Real-time analytics, pipeline charts, activity feed

## 💰 Cheapest 3rd-Party Stack (Budget-Friendly)

| Service | Purpose | Cost |
|---------|---------|------|
| **Brevo** (formerly Sendinblue) | Email sending | FREE 300 emails/day forever |
| **Twilio** | WhatsApp + SMS + calls | ~$0.005/msg WhatsApp, $15 trial credit |
| **Vapi.ai** | AI Voice Calls | ~$0.05/min, $10 free trial |
| **Anthropic Claude** | Lead scoring + drafting | Free trial credits available |
| **PostgreSQL** | Database | Free / self-hosted |

**Monthly estimate for a startup**: ~$20-50/month for 1000+ leads and active outreach.

## 🏗️ Architecture

```
Frontend (React) ←→ Backend (Node.js/Express) ←→ PostgreSQL
                           ↕
              Twilio | Brevo | Vapi.ai | Claude AI
```

## 🚀 Quick Start

### Option 1: Docker (Recommended)

```bash
# 1. Clone and configure
cp backend/.env.example backend/.env
# Edit backend/.env with your API keys

# 2. Start everything
docker-compose up -d

# 3. Seed demo data
docker-compose exec backend node database/seed.js

# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Login: admin@leadflow.com / admin123
```

### Option 2: Manual Setup

**Backend:**
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your credentials
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm start
```

**Database:**
```bash
# PostgreSQL 14+
createdb leadflow
cd backend && node database/seed.js
```

## 🔧 Configuration (.env)

### Email (Brevo - FREE)
1. Sign up at https://brevo.com
2. Go to SMTP & API → SMTP
3. Set SMTP_HOST, SMTP_USER, SMTP_PASS

### WhatsApp + SMS (Twilio)
1. Sign up at https://twilio.com (free $15 trial)
2. Get Account SID and Auth Token
3. For WhatsApp: join sandbox at https://www.twilio.com/console/sms/whatsapp/sandbox
4. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, TWILIO_WHATSAPP_NUMBER

### AI Voice Calls (Vapi.ai)
1. Sign up at https://vapi.ai ($10 free credit)
2. Create an AI assistant (configure greeting, personality)
3. Get API key and Assistant ID
4. Set VAPI_API_KEY, VAPI_ASSISTANT_ID, VAPI_PHONE_NUMBER_ID

### Claude AI (Lead scoring & drafting)
1. Get API key from https://console.anthropic.com
2. Set ANTHROPIC_API_KEY

### Facebook Lead Ads (optional)
1. Create a Facebook App at developers.facebook.com
2. Set up Lead Ads webhook pointing to: https://yourdomain.com/api/webhooks/facebook
3. Set FB_VERIFY_TOKEN and FB_PAGE_ACCESS_TOKEN

### Web Form Integration
Embed this on your website to capture leads:
```html
<form action="https://your-api.com/api/webhooks/form" method="POST">
  <input name="firstName" placeholder="Your name" required/>
  <input name="email" type="email" placeholder="Email" required/>
  <input name="phone" placeholder="Phone"/>
  <input name="company" placeholder="Company"/>
  <textarea name="message" placeholder="How can we help?"></textarea>
  <input type="hidden" name="source" value="web_form"/>
  <button type="submit">Send</button>
</form>
```

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/login | Login |
| GET | /api/leads | List leads (with filters) |
| POST | /api/leads | Create lead |
| PUT | /api/leads/:id | Update lead |
| POST | /api/leads/:id/contact | Send message to lead |
| POST | /api/leads/import/csv | Import leads from CSV |
| GET | /api/analytics/overview | Dashboard stats |
| POST | /api/ai/draft-message | AI message draft |
| POST | /api/webhooks/form | Web form capture |
| POST | /api/webhooks/twilio/whatsapp | WhatsApp inbound |
| POST | /api/webhooks/facebook | Facebook Lead Ads |

## 🚢 Production Deployment

**Recommended: Railway.app or Render.com (both have free tiers)**

```bash
# Railway deployment
npm install -g @railway/cli
railway login
railway init
railway up
```

**Or Heroku:**
```bash
heroku create your-leadflow-app
heroku addons:create heroku-postgresql:mini
git push heroku main
```

## 📁 Project Structure

```
leadflow/
├── backend/
│   ├── src/
│   │   ├── models/          # Sequelize models
│   │   ├── routes/          # Express routes
│   │   ├── controllers/     # Business logic
│   │   ├── services/        # Outreach + AI services
│   │   ├── jobs/            # Cron scheduler
│   │   └── middleware/      # Auth middleware
│   └── database/            # Migrations + seeds
├── frontend/
│   └── src/
│       ├── pages/           # React pages
│       ├── components/      # Reusable components
│       ├── contexts/        # Auth context
│       └── utils/           # API client
└── docker-compose.yml
```
