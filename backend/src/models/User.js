const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
module.exports = (sequelize) => {
  const User = sequelize.define('User', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    name: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, unique: true, allowNull: false },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin','sales','manager'), defaultValue: 'sales' },
    phone: DataTypes.STRING,
    avatar: DataTypes.STRING,
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
  }, {
    hooks: {
      beforeCreate: async (u) => { u.password = await bcrypt.hash(u.password, 12); },
      beforeUpdate: async (u) => { if (u.changed('password')) u.password = await bcrypt.hash(u.password, 12); }
    }
  });
  User.prototype.validatePassword = function(p) { return bcrypt.compare(p, this.password); };
  return User;
};
