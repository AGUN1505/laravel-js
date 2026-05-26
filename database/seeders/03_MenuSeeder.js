const { Menu, Permission, Role } = require('../../app/Models');

module.exports = {
  async run() {
    const extraPerms = ['view menus', 'view permissions'];
    for (const name of extraPerms) {
      await Permission.findOrCreate({ where: { name, guard_name: 'api' } });
    }

    const adminRole = await Role.findOne({ where: { name: 'admin' } });
    const superRole = await Role.findOne({ where: { name: 'superadmin' } });
    if (superRole) {
      const all = await Permission.findAll();
      await superRole.syncPermissions(...all);
    }
    if (adminRole) {
      await adminRole.givePermissionTo('view menus', 'view permissions');
    }

    const menus = [
      { label: 'Dashboard', path: '/dashboard', icon: 'home', order: 1 },
      { label: 'Users', path: '/users', icon: 'users', permission: 'view users', order: 2 },
      { label: 'Roles', path: '/roles', icon: 'shield', permission: 'view roles', order: 3 },
      { label: 'Permissions', path: '/permissions', icon: 'key', permission: 'view permissions', order: 4 },
      { label: 'Menus', path: '/menus', icon: 'menu', permission: 'view menus', order: 5 },
    ];

    for (const m of menus) {
      await Menu.findOrCreate({
        where: { label: m.label },
        defaults: { ...m, is_active: true },
      });
    }
  },
};
