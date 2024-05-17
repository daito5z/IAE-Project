const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const User = require('./register');

const Election = sequelize.define('Election', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

Election.belongsTo(User, { as: 'conductor' });

module.exports = Election;
