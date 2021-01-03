const Sequelize = require('sequelize');

const sequelize = require('../config/database');

const User = sequelize.define('user', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV4,
    unique: true,
    primaryKey: true
  },
  avatar: {
    type: Sequelize.STRING,
    defaultValue: null
  },
  username: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false
  },
  email: {
    type: Sequelize.STRING,
    unique: true,
    allowNull: false,
    validate: {
      isEmail: true
    }
  },
  password: {
    type: Sequelize.STRING,
    allowNull: false
  },
  fullname: {
    type: Sequelize.STRING,
    allowNull: false
  },
  phonenumber: {
    type: Sequelize.STRING,
    allowNull: false
  }
});

module.exports = User;
