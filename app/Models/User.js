const { DataTypes, Model } = require('sequelize');
const bcrypt = require('bcryptjs');
const sequelize = require('../../bootstrap/database');
const authConfig = require('../../config/auth');

class User extends Model {
  async checkPassword(plain) {
    return bcrypt.compare(plain, this.password);
  }

  toJSON() {
    const values = { ...this.get() };
    delete values.password;
    return values;
  }

  // ---- Role methods (Spatie-style) ----
  async isSuperAdmin() {
    return this.hasRole('superadmin');
  }

  async assignRole(...roles) {
    const Role = require('./Role');
    const resolved = await resolveRoles(Role, roles.flat());
    await this.addRoles(resolved);
    return this;
  }

  async removeRole(...roles) {
    const Role = require('./Role');
    const resolved = await resolveRoles(Role, roles.flat());
    await this.removeRoles(resolved);
    return this;
  }

  async syncRoles(...roles) {
    const Role = require('./Role');
    const resolved = await resolveRoles(Role, roles.flat());
    await this.setRoles(resolved);
    return this;
  }

  async hasRole(role) {
    const roles = Array.isArray(role) ? role : [role];
    const userRoles = await this.getRoles();
    const names = userRoles.map((r) => r.name);
    return roles.some((r) => names.includes(typeof r === 'string' ? r : r.name));
  }

  async hasAnyRole(...roles) {
    return this.hasRole(roles.flat());
  }

  async hasAllRoles(...roles) {
    const list = roles.flat();
    const userRoles = await this.getRoles();
    const names = userRoles.map((r) => r.name);
    return list.every((r) => names.includes(typeof r === 'string' ? r : r.name));
  }

  async getRoleNames() {
    const roles = await this.getRoles();
    return roles.map((r) => r.name);
  }

  // ---- Permission methods ----
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

  async hasDirectPermission(permission) {
    const name = typeof permission === 'string' ? permission : permission.name;
    const perms = await this.getPermissions();
    return perms.some((p) => p.name === name);
  }

  async hasPermissionViaRole(permission) {
    const name = typeof permission === 'string' ? permission : permission.name;
    const Permission = require('./Permission');
    const roles = await this.getRoles({
      include: [{ model: Permission, as: 'permissions' }],
    });
    return roles.some((role) => (role.permissions || []).some((p) => p.name === name));
  }

  async hasPermissionTo(permission) {
    if (await this.isSuperAdmin()) return true;
    if (await this.hasDirectPermission(permission)) return true;
    return this.hasPermissionViaRole(permission);
  }

  async hasAnyPermission(...permissions) {
    const list = permissions.flat();
    for (const p of list) {
      if (await this.hasPermissionTo(p)) return true;
    }
    return false;
  }

  async getAllPermissions() {
    const Permission = require('./Permission');
    const direct = await this.getPermissions();
    const roles = await this.getRoles({
      include: [{ model: Permission, as: 'permissions' }],
    });
    const viaRole = roles.flatMap((r) => r.permissions || []);
    const map = new Map();
    [...direct, ...viaRole].forEach((p) => map.set(p.id, p));
    return [...map.values()];
  }

  async getPermissionNames() {
    const perms = await this.getAllPermissions();
    return perms.map((p) => p.name);
  }
}

async function resolveRoles(Role, items) {
  const result = [];
  for (const item of items) {
    if (item instanceof Role) result.push(item);
    else if (typeof item === 'string') {
      const r = await Role.findByName(item);
      if (r) result.push(r);
    } else if (typeof item === 'number') {
      const r = await Role.findByPk(item);
      if (r) result.push(r);
    }
  }
  return result;
}

async function resolvePermissions(Permission, items) {
  const result = [];
  for (const item of items) {
    if (item instanceof Permission) result.push(item);
    else if (typeof item === 'string') {
      const p = await Permission.findByName(item);
      if (p) result.push(p);
    } else if (typeof item === 'number') {
      const p = await Permission.findByPk(item);
      if (p) result.push(p);
    }
  }
  return result;
}

User.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password: { type: DataTypes.STRING, allowNull: false },
}, {
  sequelize,
  modelName: 'User',
  tableName: 'users',
  timestamps: true,
  hooks: {
    beforeCreate: async (user) => {
      user.password = await bcrypt.hash(user.password, authConfig.bcrypt.rounds);
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        user.password = await bcrypt.hash(user.password, authConfig.bcrypt.rounds);
      }
    },
  },
});

module.exports = User;
