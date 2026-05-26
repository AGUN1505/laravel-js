const Controller = require('./Controller');
const { Permission } = require('../../Models');

class PermissionController extends Controller {
  async index(req, res) {
    const permissions = await Permission.findAll({ order: [['name', 'ASC']] });
    return this.success(res, permissions);
  }

  async show(req, res) {
    const p = await Permission.findByPk(req.params.id);
    if (!p) return this.error(res, 'Permission not found', 404);
    return this.success(res, p);
  }

  async store(req, res) {
    try {
      const { name, guard_name = 'api' } = req.body;
      if (!name) return this.error(res, 'Name is required', 422);
      const p = await Permission.create({ name, guard_name });
      return this.success(res, p, 'Permission created', 201);
    } catch (err) {
      return this.error(res, err.message, 422);
    }
  }

  async update(req, res) {
    const p = await Permission.findByPk(req.params.id);
    if (!p) return this.error(res, 'Permission not found', 404);
    try {
      const { name, guard_name } = req.body;
      if (name) p.name = name;
      if (guard_name) p.guard_name = guard_name;
      await p.save();
      return this.success(res, p, 'Permission updated');
    } catch (err) {
      return this.error(res, err.message, 422);
    }
  }

  async destroy(req, res) {
    const p = await Permission.findByPk(req.params.id);
    if (!p) return this.error(res, 'Permission not found', 404);
    await p.destroy();
    return this.success(res, null, 'Permission deleted');
  }
}

module.exports = new PermissionController();
