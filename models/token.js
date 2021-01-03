const Sequelize = require('sequelize');

const sequelize = require('../config/database');

const Token = sequelize.define('token', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    unique: true,
    primaryKey: true
  },
  token: {
    type: Sequelize.STRING,
    allowNull: false
  },
  userId: {
    type: Sequelize.UUID,
    allowNull: false
  }
});

module.exports = Token;
