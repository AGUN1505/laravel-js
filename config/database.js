require('dotenv').config();
const path = require('path');

module.exports = {
  default: process.env.DB_CONNECTION || 'sqlite',

  connections: {
    sqlite: {
      dialect: 'sqlite',
      storage: path.resolve(__dirname, '..', process.env.DB_DATABASE || 'database/database.sqlite'),
      logging: false,
    },
    mysql: {
      dialect: 'mysql',
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_DATABASE,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      logging: false,
    },
    postgres: {
      dialect: 'postgres',
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      database: process.env.DB_DATABASE,
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      logging: false,
    },
  },
};
