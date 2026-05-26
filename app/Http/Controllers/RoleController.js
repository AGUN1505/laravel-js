const Controller = require('./Controller');
const { Role, Permission } = require('../../Models');

class RoleController extends Controller {
  async index(req, res) {
    const roles = await Role.findAll({
      include: [{ model: Permission, as: 'permissions' }],
    });
    return this.success(res, roles);
  }

  async show(req, res) {
    const role = await Role.findByPk(req.params.id, {
      include: [{ model: Permission, as: 'permissions' }],
    });
    if (!role) return this.error(res, 'Role not found', 404);
    return this.success(res, role);
  }

  async store(req, res) {
    try {
      const { name, guard_name = 'api', permissions = [] } = req.body;
      if (!name) return this.error(res, 'Name is required', 422);

      const role = await Role.create({ name, guard_name });
      if (permissions.length) await role.syncPermissions(...permissions);

      const created = await Role.findByPk(role.id, {
        include: [{ model: Permission, as: 'permissions' }],
      });
      return this.success(res, created, 'Role created', 201);
    } catch (err) {
      return this.error(res, err.message, 422);
    }
  }

  async update(req, res) {
    const role = await Role.findByPk(req.params.id);
    if (!role) return this.error(res, 'Role not found', 404);
    if (role.name === 'superadmin') {
      return this.error(res, 'Cannot modify superadmin role', 403);
    }
    try {
      const { name, guard_name, permissions } = req.body;
      if (name) role.name = name;
      if (guard_name) role.guard_name = guard_name;
      await role.save();
      if (Array.isArray(permissions)) await role.syncPermissions(...permissions);

      const updated = await Role.findByPk(role.id, {
        include: [{ model: Permission, as: 'permissions' }],
      });
      return this.success(res, updated, 'Role updated');
    } catch (err) {
      return this.error(res, err.message, 422);
    }
  }

  async destroy(req, res) {
    const role = await Role.findByPk(req.params.id);
    if (!role) return this.error(res, 'Role not found', 404);
    if (role.name === 'superadmin') {
      return this.error(res, 'Cannot delete superadmin role', 403);
    }
    await role.destroy();
    return this.success(res, null, 'Role deleted');
  }

  async listPermissions(req, res) {
    const permissions = await Permission.findAll();
    return this.success(res, permissions);
  }
}

module.exports = new RoleController();
