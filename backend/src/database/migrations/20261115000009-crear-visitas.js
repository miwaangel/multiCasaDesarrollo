'use strict';

/**
 * Tabla visitas (contador de Visitas y Conectados).
 *   Visitas    = COUNT(*)
 *   Conectados = COUNT(DISTINCT visitante_hash) de los últimos 5 minutos
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'visitas',
      {
        id: {
          type: Sequelize.BIGINT,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        visitante_hash: { type: Sequelize.CHAR(64), allowNull: false }, // SHA-256 de IP + user agent
        pagina: { type: Sequelize.STRING(150), allowNull: true },
        fecha: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
    );

    await queryInterface.addIndex('visitas', ['fecha'], { name: 'ix_visitas_fecha' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('visitas');
  },
};
