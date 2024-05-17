const { DataTypes } = require('sequelize');
const { sequelize } = require('../database/connection');
const Election = require('./election');

const Candidate = sequelize.define('Candidate', {
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

Candidate.belongsTo(Election);

module.exports = Candidate;
