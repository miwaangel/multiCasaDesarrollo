'use strict';

/** Catálogo formas_pago, con los requisitos para la página Requisitos. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'formas_pago',
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        nombre: { type: Sequelize.STRING(60), allowNull: false },
        descripcion: { type: Sequelize.STRING(255), allowNull: true },
        requisitos: { type: Sequelize.TEXT, allowNull: true }, // lista separada por saltos de línea
      },
      { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
    );

    await queryInterface.addConstraint('formas_pago', {
      fields: ['nombre'],
      type: 'unique',
      name: 'uq_formas_pago_nombre',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('formas_pago');
  },
};
