const Sequelize = require('sequelize');

const sequelize = require('../config/database');

const File = sequelize.define('file', {
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
  title: {
    type: Sequelize.STRING,
    allowNull: false
  },
  description: {
    type: Sequelize.STRING
  },
  type: {
    type: Sequelize.STRING
  },
  originalname: {
    type: Sequelize.STRING,
    allowNull: false
  },
  ext: {
    type: Sequelize.STRING
  },
  path: {
    type: Sequelize.STRING,
    allowNull: false
  },
  size: {
    type: Sequelize.INTEGER,
    allowNull: false
  },
  sharedWith: {
    type: Sequelize.TEXT({ length: 'long' }),
    get() {
      return JSON.parse(this.getDataValue('sharedWith'));
    },
    set(val) {
      return this.setDataValue('sharedWith', JSON.stringify(val));
    },
    allowNull: false
  },
  downloads: {
    type: Sequelize.TEXT({ length: 'long' }),
    get() {
      return this.getDataValue('downloads') ? JSON.parse(this.getDataValue('downloads')) : [];
    },
    set(val) {
      const downloads = this.getDataValue('downloads')
        ? JSON.parse(this.getDataValue('downloads'))
        : [];
      if (val) {
        downloads.push(val);
      }
      return this.setDataValue('downloads', JSON.stringify(downloads));
    },
    allowNull: false
  },
  category: {
    type: Sequelize.STRING,
    get() {
      const string = this.getDataValue('category');
      return string.charAt(0).toUpperCase() + string.slice(1);
    },
    set(val) {
      return this.setDataValue('category', val.toLowerCase());
    },
    defaultValue: null
  },
  deleted: {
    type: Sequelize.STRING,
    defaultValue: null
  }
});

module.exports = File;
