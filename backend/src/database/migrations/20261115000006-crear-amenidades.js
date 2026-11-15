'use strict';

/** Catálogo amenidades (interior / exterior). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'amenidades',
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        nombre: { type: Sequelize.STRING(80), allowNull: false },
        tipo: { type: Sequelize.ENUM('interior', 'exterior'), allowNull: false },
      },
      { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
    );

    await queryInterface.addConstraint('amenidades', {
      fields: ['nombre', 'tipo'],
      type: 'unique',
      name: 'uq_amenidades_nombre_tipo',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('amenidades');
  },
};
