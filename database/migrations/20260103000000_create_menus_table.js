module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('menus', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      label: { type: Sequelize.STRING, allowNull: false },
      path: { type: Sequelize.STRING, allowNull: true },
      icon: { type: Sequelize.STRING, allowNull: true },
      permission: { type: Sequelize.STRING, allowNull: true },
      parent_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'menus', key: 'id' },
        onDelete: 'CASCADE',
      },
      order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('menus');
  },
};
