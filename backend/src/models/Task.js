const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Task', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  leadId: DataTypes.UUID,
  assignedTo: DataTypes.UUID,
  title: { type: DataTypes.STRING, allowNull: false },
  description: DataTypes.TEXT,
  type: { type: DataTypes.ENUM('call','email','whatsapp','meeting','follow_up','other'), defaultValue: 'follow_up' },
  priority: { type: DataTypes.ENUM('low','medium','high','urgent'), defaultValue: 'medium' },
  status: { type: DataTypes.ENUM('pending','in_progress','completed','cancelled'), defaultValue: 'pending' },
  dueAt: DataTypes.DATE,
  completedAt: DataTypes.DATE
});
