const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');

const connection = dbConfig.connections[dbConfig.default];
const sequelize = new Sequelize(connection);

module.exports = sequelize;
