'use strict';

/** Tabla puente casa_amenidad (N casas <-> M amenidades). PK compuesta, sin id. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'casa_amenidad',
      {
        casa_id: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true },
        amenidad_id: { type: Sequelize.INTEGER, allowNull: false, primaryKey: true },
      },
      { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
    );

    await queryInterface.addConstraint('casa_amenidad', {
      fields: ['casa_id'],
      type: 'foreign key',
      name: 'fk_ca_casa',
      references: { table: 'casas', field: 'id' },
      onDelete: 'CASCADE',
    });

    await queryInterface.addConstraint('casa_amenidad', {
      fields: ['amenidad_id'],
      type: 'foreign key',
      name: 'fk_ca_amenidad',
      references: { table: 'amenidades', field: 'id' },
      onDelete: 'RESTRICT',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('casa_amenidad');
  },
};
