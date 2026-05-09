const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Campaign', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  description: DataTypes.TEXT,
  type: { type: DataTypes.ENUM('email','whatsapp','sms','mixed'), defaultValue: 'email' },
  status: { type: DataTypes.ENUM('draft','active','paused','completed'), defaultValue: 'draft' },
  targetAudience: { type: DataTypes.JSONB, defaultValue: {} },
  stats: { type: DataTypes.JSONB, defaultValue: { sent: 0, delivered: 0, opened: 0, replied: 0, converted: 0 } },
  scheduledAt: DataTypes.DATE,
  completedAt: DataTypes.DATE
});
