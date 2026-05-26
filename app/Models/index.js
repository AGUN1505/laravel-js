const Role = require('./Role');
const Permission = require('./Permission');
const User = require('./User');
const Menu = require('./Menu');

Role.belongsToMany(Permission, {
  through: 'role_permissions',
  foreignKey: 'role_id',
  otherKey: 'permission_id',
  as: 'permissions',
});
Permission.belongsToMany(Role, {
  through: 'role_permissions',
  foreignKey: 'permission_id',
  otherKey: 'role_id',
  as: 'roles',
});

User.belongsToMany(Role, {
  through: 'user_roles',
  foreignKey: 'user_id',
  otherKey: 'role_id',
  as: 'roles',
});
Role.belongsToMany(User, {
  through: 'user_roles',
  foreignKey: 'role_id',
  otherKey: 'user_id',
  as: 'users',
});

User.belongsToMany(Permission, {
  through: 'user_permissions',
  foreignKey: 'user_id',
  otherKey: 'permission_id',
  as: 'permissions',
});
Permission.belongsToMany(User, {
  through: 'user_permissions',
  foreignKey: 'permission_id',
  otherKey: 'user_id',
  as: 'users',
});

module.exports = { User, Role, Permission, Menu };
