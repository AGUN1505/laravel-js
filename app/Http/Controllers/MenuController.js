const Controller = require('./Controller');
const { Menu } = require('../../Models');

class MenuController extends Controller {
  async index(req, res) {
    const menus = await Menu.findAll({
      order: [['order', 'ASC'], ['id', 'ASC']],
    });
    return this.success(res, menus);
  }

  async tree(req, res) {
    const all = await Menu.findAll({
      order: [['order', 'ASC'], ['id', 'ASC']],
    });
    return this.success(res, buildTree(all));
  }

  async myMenu(req, res) {
    const all = await Menu.findAll({
      where: { is_active: true },
      order: [['order', 'ASC'], ['id', 'ASC']],
    });

    const isSuper = await req.user.isSuperAdmin();
    const allowed = [];
    for (const m of all) {
      if (isSuper || !m.permission || await req.user.hasPermissionTo(m.permission)) {
        allowed.push(m);
      }
    }
    return this.success(res, buildTree(allowed));
  }

  async show(req, res) {
    const menu = await Menu.findByPk(req.params.id);
    if (!menu) return this.error(res, 'Menu not found', 404);
    return this.success(res, menu);
  }

  async store(req, res) {
    try {
      const { label, path, icon, permission, parent_id, order, is_active } = req.body;
      if (!label) return this.error(res, 'Label is required', 422);
      const menu = await Menu.create({
        label, path, icon, permission,
        parent_id: parent_id || null,
        order: order || 0,
        is_active: is_active !== false,
      });
      return this.success(res, menu, 'Menu created', 201);
    } catch (err) {
      return this.error(res, err.message, 422);
    }
  }

  async update(req, res) {
    const menu = await Menu.findByPk(req.params.id);
    if (!menu) return this.error(res, 'Menu not found', 404);
    try {
      const fields = ['label', 'path', 'icon', 'permission', 'parent_id', 'order', 'is_active'];
      fields.forEach((f) => {
        if (req.body[f] !== undefined) menu[f] = req.body[f];
      });
      await menu.save();
      return this.success(res, menu, 'Menu updated');
    } catch (err) {
      return this.error(res, err.message, 422);
    }
  }

  async destroy(req, res) {
    const menu = await Menu.findByPk(req.params.id);
    if (!menu) return this.error(res, 'Menu not found', 404);
    await menu.destroy();
    return this.success(res, null, 'Menu deleted');
  }

  async reorder(req, res) {
    const { items } = req.body;
    if (!Array.isArray(items)) {
      return this.error(res, 'items array is required', 422);
    }
    try {
      for (const item of items) {
        const menu = await Menu.findByPk(item.id);
        if (!menu) continue;
        if (typeof item.order === 'number') menu.order = item.order;
        if (item.parent_id !== undefined) {
          menu.parent_id = item.parent_id || null;
        }
        await menu.save();
      }
      return this.success(res, null, 'Menus reordered');
    } catch (err) {
      return this.error(res, err.message, 422);
    }
  }
}

function buildTree(items) {
  const map = new Map();
  const roots = [];
  items.forEach((item) => {
    const obj = item.toJSON();
    obj.children = [];
    map.set(obj.id, obj);
  });
  map.forEach((item) => {
    if (item.parent_id && map.has(item.parent_id)) {
      map.get(item.parent_id).children.push(item);
    } else {
      roots.push(item);
    }
  });
  return roots;
}

module.exports = new MenuController();
