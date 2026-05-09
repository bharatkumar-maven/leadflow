const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(
  process.env.DB_NAME || 'leadflow',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'password',
  { host: process.env.DB_HOST || 'localhost', port: process.env.DB_PORT || 5432, dialect: 'postgres', logging: false,
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 } }
);
const User = require('./User')(sequelize);
const Lead = require('./Lead')(sequelize);
const Activity = require('./Activity')(sequelize);
const Task = require('./Task')(sequelize);
const Campaign = require('./Campaign')(sequelize);
const Template = require('./Template')(sequelize);
Lead.hasMany(Activity, { foreignKey: 'leadId', as: 'activities' });
Activity.belongsTo(Lead, { foreignKey: 'leadId' });
Lead.hasMany(Task, { foreignKey: 'leadId', as: 'tasks' });
Task.belongsTo(Lead, { foreignKey: 'leadId' });
User.hasMany(Lead, { foreignKey: 'assignedTo', as: 'leads' });
Lead.belongsTo(User, { foreignKey: 'assignedTo', as: 'assignee' });
Campaign.hasMany(Lead, { foreignKey: 'campaignId', as: 'leads' });
Lead.belongsTo(Campaign, { foreignKey: 'campaignId', as: 'campaign' });
module.exports = { sequelize, User, Lead, Activity, Task, Campaign, Template };
