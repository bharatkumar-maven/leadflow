require('dotenv').config();
const { User, Template, Lead, sequelize } = require('../src/models');

async function seed() {
  await sequelize.authenticate();
  await sequelize.sync({ force: false });

  // Create admin user
  const [admin] = await User.findOrCreate({
    where: { email: 'admin@leadflow.com' },
    defaults: { name: 'Admin User', email: 'admin@leadflow.com', password: 'admin123', role: 'admin' }
  });
  console.log('Admin user: admin@leadflow.com / admin123');

  // Create sample templates
  const templates = [
    { name: 'Initial Outreach - Email', type: 'email', subject: 'Quick question about {company}',
      body: 'Hi {firstName},\n\nI came across {company} and wanted to reach out. We help small software companies automate their sales processes.\n\nWould you be open to a 15-minute call this week?\n\nBest,\nThe Team' },
    { name: 'Follow-up WhatsApp', type: 'whatsapp',
      body: 'Hi {firstName}! 👋 Just following up on my earlier message. Are you available for a quick call today? We have a solution that could save your team 10+ hours/week.' },
    { name: 'Proposal Follow-up', type: 'email', subject: 'Re: Our proposal for {company}',
      body: 'Hi {firstName},\n\nI wanted to follow up on the proposal we sent. Do you have any questions?\n\nWe are happy to customize the solution for your specific needs.\n\nLooking forward to hearing from you.' },
  ];
  for (const t of templates) await Template.findOrCreate({ where: { name: t.name }, defaults: t });

  // Create demo leads
  const demoLeads = [
    { firstName: 'Rahul', lastName: 'Sharma', email: 'rahul@techcorp.in', phone: '+919876543210', company: 'TechCorp', source: 'web_form', status: 'new', score: 75, value: 50000 },
    { firstName: 'Priya', lastName: 'Patel', email: 'priya@startupx.com', phone: '+919988776655', company: 'StartupX', source: 'facebook', status: 'contacted', score: 60, value: 30000 },
    { firstName: 'Amit', lastName: 'Kumar', email: 'amit@enterprise.in', phone: '+918765432109', company: 'Enterprise Ltd', source: 'linkedin', status: 'qualified', score: 88, value: 150000 },
    { firstName: 'Sneha', lastName: 'Reddy', email: 'sneha@digital.co', phone: '+917654321098', company: 'Digital Agency', source: 'referral', status: 'proposal', score: 92, value: 75000 },
    { firstName: 'Vikram', lastName: 'Singh', email: 'vikram@consulting.in', phone: '+916543210987', company: 'Consulting Co', source: 'email', status: 'won', score: 95, value: 200000 },
  ];
  for (const l of demoLeads) await Lead.findOrCreate({ where: { email: l.email }, defaults: { ...l, assignedTo: admin.id } });

  console.log(`Seeded ${templates.length} templates and ${demoLeads.length} demo leads`);
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
