const Sequelize = require('sequelize');

const sequelize = require('../config/database');

const Notification = sequelize.define('notification', {
  id: {
    type: Sequelize.UUID,
    defaultValue: Sequelize.UUIDV1,
    unique: true,
    primaryKey: true
  },
  userId: {
    type: Sequelize.UUID,
    allowNull: false
  },
  fileId: {
    type: Sequelize.UUID,
    allowNull: false
  },
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  description: {
    type: Sequelize.STRING,
    allowNull: false
  },
  type: {
    type: Sequelize.STRING,
    allowNull: false
  },
  link: {
    type: Sequelize.STRING,
    allowNull: false
  },
  seen: {
    type: Sequelize.BOOLEAN,
    defaultValue: false
  }
});

module.exports = Notification;
