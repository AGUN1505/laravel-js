const Controller = require('./Controller');
const { User, Role } = require('../../Models');

class UserController extends Controller {
  async index(req, res) {
    const users = await User.findAll({
      include: [{ model: Role, as: 'roles' }],
    });
    return this.success(res, users);
  }

  async show(req, res) {
    const user = await User.findByPk(req.params.id, {
      include: [{ model: Role, as: 'roles' }],
    });
    if (!user) return this.error(res, 'User not found', 404);
    return this.success(res, user);
  }

  async store(req, res) {
    try {
      const { name, email, password, roles = [] } = req.body;
      const user = await User.create({ name, email, password });
      if (roles.length) await user.syncRoles(...roles);
      const created = await User.findByPk(user.id, {
        include: [{ model: Role, as: 'roles' }],
      });
      return this.success(res, created, 'User created', 201);
    } catch (err) {
      return this.error(res, err.message, 422);
    }
  }

  async update(req, res) {
    const user = await User.findByPk(req.params.id);
    if (!user) return this.error(res, 'User not found', 404);
    try {
      const { name, email, password, roles } = req.body;
      if (name) user.name = name;
      if (email) user.email = email;
      if (password) user.password = password;
      await user.save();
      if (Array.isArray(roles)) await user.syncRoles(...roles);
      const updated = await User.findByPk(user.id, {
        include: [{ model: Role, as: 'roles' }],
      });
      return this.success(res, updated, 'User updated');
    } catch (err) {
      return this.error(res, err.message, 422);
    }
  }

  async destroy(req, res) {
    const user = await User.findByPk(req.params.id);
    if (!user) return this.error(res, 'User not found', 404);
    if (await user.isSuperAdmin()) {
      return this.error(res, 'Cannot delete superadmin user', 403);
    }
    await user.destroy();
    return this.success(res, null, 'User deleted');
  }

  async assignRoles(req, res) {
    const user = await User.findByPk(req.params.id);
    if (!user) return this.error(res, 'User not found', 404);
    const { roles = [] } = req.body;
    await user.syncRoles(...roles);
    const updated = await User.findByPk(user.id, {
      include: [{ model: Role, as: 'roles' }],
    });
    return this.success(res, updated, 'Roles assigned');
  }
}

module.exports = new UserController();
