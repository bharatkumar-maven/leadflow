require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { sequelize } = require('./models');
const logger = require('./utils/logger');
const scheduler = require('./jobs/scheduler');

const app = express();
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 500 }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use((req, _res, next) => { logger.info(`${req.method} ${req.path}`); next(); });

app.use('/api/auth',      require('./routes/auth'));
app.use('/api/leads',     require('./routes/leads'));
app.use('/api/activities',require('./routes/activities'));
app.use('/api/campaigns', require('./routes/campaigns'));
app.use('/api/tasks',     require('./routes/tasks'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/webhooks',  require('./routes/webhooks'));
app.use('/api/settings',  require('./routes/settings'));
app.use('/api/ai',        require('./routes/ai'));
app.get('/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));
app.use((err, _req, res, _next) => {
  logger.error(err.message, err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
async function start() {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ alter: true });
    logger.info('Database connected');
    scheduler.init();
    app.listen(PORT, () => logger.info(`LeadFlow backend running on port ${PORT}`));
  } catch (err) {
    logger.error('Startup failed:', err);
    process.exit(1);
  }
}
start();
