const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Activity', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  leadId: { type: DataTypes.UUID, allowNull: false },
  userId: DataTypes.UUID,
  type: { type: DataTypes.ENUM('email','whatsapp','sms','call','ai_call','note','status_change','created'), allowNull: false },
  direction: { type: DataTypes.ENUM('inbound','outbound','internal'), defaultValue: 'outbound' },
  subject: DataTypes.STRING,
  body: DataTypes.TEXT,
  status: { type: DataTypes.ENUM('pending','sent','delivered','read','failed','completed'), defaultValue: 'sent' },
  metadata: { type: DataTypes.JSONB, defaultValue: {} },
  scheduledAt: DataTypes.DATE,
  completedAt: DataTypes.DATE,
  duration: DataTypes.INTEGER
});
