const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const User = require('./register');

const RegisterPhoneNumber = sequelize.define('RegisterPhoneNumber', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  phone_number: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

RegisterPhoneNumber.belongsTo(User);

module.exports = RegisterPhoneNumber;
