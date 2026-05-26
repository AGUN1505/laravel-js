const Controller = require('./Controller');
const User = require('../../Models/User');

class UserController extends Controller {
  async index(req, res) {
    const users = await User.findAll();
    return this.success(res, users);
  }

  async show(req, res) {
    const user = await User.findByPk(req.params.id);
    if (!user) return this.error(res, 'User not found', 404);
    return this.success(res, user);
  }

  async store(req, res) {
    try {
      const user = await User.create(req.body);
      return this.success(res, user, 'User created', 201);
    } catch (err) {
      return this.error(res, err.message, 422);
    }
  }

  async update(req, res) {
    const user = await User.findByPk(req.params.id);
    if (!user) return this.error(res, 'User not found', 404);
    await user.update(req.body);
    return this.success(res, user, 'User updated');
  }

  async destroy(req, res) {
    const user = await User.findByPk(req.params.id);
    if (!user) return this.error(res, 'User not found', 404);
    await user.destroy();
    return this.success(res, null, 'User deleted');
  }
}

module.exports = new UserController();
