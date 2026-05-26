const { Role, Permission, User } = require('../../app/Models');

module.exports = {
  async run() {
    const permissions = [
      'view users', 'create users', 'edit users', 'delete users',
      'view posts', 'create posts', 'edit posts', 'delete posts',
      'view roles', 'create roles', 'edit roles', 'delete roles',
    ];

    for (const name of permissions) {
      await Permission.findOrCreate({ where: { name, guard_name: 'api' } });
    }

    const [superRole] = await Role.findOrCreate({ where: { name: 'superadmin', guard_name: 'api' } });
    const [adminRole] = await Role.findOrCreate({ where: { name: 'admin', guard_name: 'api' } });
    const [editorRole] = await Role.findOrCreate({ where: { name: 'editor', guard_name: 'api' } });
    const [userRole] = await Role.findOrCreate({ where: { name: 'user', guard_name: 'api' } });

    const allPerms = await Permission.findAll();
    await superRole.syncPermissions(...allPerms);

    await adminRole.syncPermissions(
      'view users', 'create users', 'edit users', 'delete users',
      'view posts', 'create posts', 'edit posts', 'delete posts'
    );

    await editorRole.syncPermissions(
      'view users', 'view posts', 'create posts', 'edit posts'
    );

    await userRole.syncPermissions('view posts');

    const sa = await User.findOne({ where: { email: 'super@example.com' } });
    if (sa) await sa.syncRoles('superadmin');

    const admin = await User.findOne({ where: { email: 'admin@example.com' } });
    if (admin) await admin.syncRoles('admin');

    const john = await User.findOne({ where: { email: 'john@example.com' } });
    if (john) await john.syncRoles('user');
  },
};
