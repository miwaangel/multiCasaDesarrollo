'use strict';

/** Tabla puente casa_forma_pago (N casas <-> M formas de pago). PK compuesta, sin id. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'casa_forma_pago',
      {
        casa_id: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true },
        forma_pago_id: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true },
      },
      { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
    );

    await queryInterface.addConstraint('casa_forma_pago', {
      fields: ['casa_id'],
      type: 'foreign key',
      name: 'fk_cfp_casa',
      references: { table: 'casas', field: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('casa_forma_pago', {
      fields: ['forma_pago_id'],
      type: 'foreign key',
      name: 'fk_cfp_forma_pago',
      references: { table: 'formas_pago', field: 'id' },
      onDelete: 'RESTRICT',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('casa_forma_pago');
  },
};
