const { User } = require('../../app/Models');

module.exports = {
  async run() {
    const users = [
      { name: 'Super Admin', email: 'super@example.com', password: 'password' },
      { name: 'Admin', email: 'admin@example.com', password: 'password' },
      { name: 'John Doe', email: 'john@example.com', password: 'password' },
    ];
    for (const data of users) {
      const existing = await User.findOne({ where: { email: data.email } });
      if (!existing) await User.create(data);
    }
  },
};
