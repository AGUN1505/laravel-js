const { DataTypes, Model } = require('sequelize');
const sequelize = require('../../bootstrap/database');

class Menu extends Model {}

Menu.init({
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  label: { type: DataTypes.STRING, allowNull: false },
  path: { type: DataTypes.STRING, allowNull: true },
  icon: { type: DataTypes.STRING, allowNull: true },
  permission: { type: DataTypes.STRING, allowNull: true },
  parent_id: { type: DataTypes.INTEGER, allowNull: true },
  order: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
}, {
  sequelize,
  modelName: 'Menu',
  tableName: 'menus',
  timestamps: true,
});

Menu.hasMany(Menu, { foreignKey: 'parent_id', as: 'children' });
Menu.belongsTo(Menu, { foreignKey: 'parent_id', as: 'parent' });

module.exports = Menu;
