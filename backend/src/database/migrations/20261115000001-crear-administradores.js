'use strict';

/** Tabla administradores (un solo tipo de administrador). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'administradores',
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        nombre: { type: Sequelize.STRING(100), allowNull: false },
        email: { type: Sequelize.STRING(150), allowNull: false },
        password_hash: { type: Sequelize.STRING(255), allowNull: false }, // bcrypt
        activo: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        creado_en: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        actualizado_en: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP'),
        },
      },
      { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
    );

    await queryInterface.addConstraint('administradores', {
      fields: ['email'],
      type: 'unique',
      name: 'uq_administradores_email',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('administradores');
  },
};
