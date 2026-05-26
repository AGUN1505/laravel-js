const app = require('./bootstrap/app');
const sequelize = require('./bootstrap/database');
const appConfig = require('./config/app');

(async () => {
  try {
    await sequelize.authenticate();
    console.log(`[${appConfig.name}] Database connected (${sequelize.getDialect()})`);
  } catch (err) {
    console.error('Database connection failed:', err.message);
  }

  app.listen(appConfig.port, () => {
    console.log(`[${appConfig.name}] Server running at ${appConfig.url}`);
    console.log(`[${appConfig.name}] Environment: ${appConfig.env}`);
  });
})();
