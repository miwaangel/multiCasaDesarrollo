'use strict';

/** Tabla imagenes_casa (1 casa -> N imágenes). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'imagenes_casa',
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        casa_id: { type: Sequelize.INTEGER, allowNull: false },
        url: { type: Sequelize.STRING(255), allowNull: false }, // ruta del archivo subido con multer
        orden: { type: Sequelize.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
        es_portada: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        creado_en: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
    );

    // El índice va antes de la FK para que MySQL lo reutilice y no cree uno duplicado
    await queryInterface.addIndex('imagenes_casa', ['casa_id', 'orden'], {
      name: 'ix_imagenes_casa_orden',
    });

    await queryInterface.addConstraint('imagenes_casa', {
      fields: ['casa_id'],
      type: 'foreign key',
      name: 'fk_imagenes_casa',
      references: { table: 'casas', field: 'id' },
      onDelete: 'CASCADE',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('imagenes_casa');
  },
};
