const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../bootstrap/database');

class Permission extends Model {
  static async findByName(name, guardName = 'api') {
    return Permission.findOne({ where: { name, guard_name: guardName } });
  }
}

Permission.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false },
  guard_name: { type: DataTypes.STRING, allowNull: false, defaultValue: 'api' },
}, {
  sequelize,
  modelName: 'Permission',
  tableName: 'permissions',
  timestamps: true,
});

module.exports = Permission;
