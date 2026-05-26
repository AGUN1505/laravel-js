const User = require('../../app/Models/User');

module.exports = {
  async run() {
    await User.bulkCreate([
      { name: 'Admin', email: 'admin@example.com', password: 'password' },
      { name: 'John Doe', email: 'john@example.com', password: 'password' },
    ], { individualHooks: true });
  },
};
