require('dotenv').config();

module.exports = {
  name: process.env.APP_NAME || 'LaravelExpress',
  env: process.env.APP_ENV || 'production',
  debug: process.env.APP_DEBUG === 'true',
  url: process.env.APP_URL || 'http://localhost:3000',
  port: parseInt(process.env.APP_PORT, 10) || 3000,
  key: process.env.APP_KEY,
  timezone: 'UTC',
  locale: 'en',
};
