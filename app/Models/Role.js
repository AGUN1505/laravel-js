const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../bootstrap/database');

class Role extends Model {
  static async findByName(name, guardName = 'api') {
    return Role.findOne({ where: { name, guard_name: guardName } });
  }

  async givePermissionTo(...permissions) {
    const Permission = require('./Permission');
    const resolved = await resolvePermissions(Permission, permissions.flat());
    await this.addPermissions(resolved);
    return this;
  }

  async revokePermissionTo(...permissions) {
    const Permission = require('./Permission');
    const resolved = await resolvePermissions(Permission, permissions.flat());
    await this.removePermissions(resolved);
    return this;
  }

  async syncPermissions(...permissions) {
    const Permission = require('./Permission');
    const resolved = await resolvePermissions(Permission, permissions.flat());
    await this.setPermissions(resolved);
    return this;
  }

  async hasPermissionTo(permission) {
    const Permission = require('./Permission');
    const resolved = await resolvePermissions(Permission, [permission]);
    if (!resolved.length) return false;
    const count = await this.countPermissions({ where: { id: resolved[0].id } });
    return count > 0;
  }
}

async function resolvePermissions(Permission, items) {
  const result = [];
  for (const item of items) {
    if (item instanceof Permission) {
      result.push(item);
    } else if (typeof item === 'string') {
      const perm = await Permission.findByName(item);
      if (perm) result.push(perm);
    } else if (typeof item === 'number') {
      const perm = await Permission.findByPk(item);
      if (perm) result.push(perm);
    }
  }
  return result;
}

Role.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  guard_name: { type: DataTypes.STRING, allowNull: false, defaultValue: 'api' },
}, {
  sequelize,
  modelName: 'Role',
  tableName: 'roles',
  timestamps: true,
});

module.exports = Role;
