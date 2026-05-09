const { DataTypes } = require('sequelize');
module.exports = (sequelize) => sequelize.define('Template', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
  name: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('email','whatsapp','sms'), allowNull: false },
  subject: DataTypes.STRING,
  body: { type: DataTypes.TEXT, allowNull: false },
  variables: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
  isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});
