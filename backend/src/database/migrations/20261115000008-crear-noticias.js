'use strict';

/** Tabla noticias (barra lateral de noticias de última hora). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'noticias',
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        titulo: { type: Sequelize.STRING(150), allowNull: false },
        resumen: { type: Sequelize.STRING(255), allowNull: false }, // lo que se ve en la barra lateral
        contenido: { type: Sequelize.TEXT, allowNull: true }, // lo que se ve en "Ver más..."
        imagen_url: { type: Sequelize.STRING(255), allowNull: true },
        activa: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
        fecha_publicacion: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
        creado_por: { type: Sequelize.INTEGER, allowNull: true },
      },
      { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
    );

    await queryInterface.addConstraint('noticias', {
      fields: ['creado_por'],
      type: 'foreign key',
      name: 'fk_noticias_admin',
      references: { table: 'administradores', field: 'id' },
      onDelete: 'SET NULL',
    });

    await queryInterface.addIndex('noticias', ['activa', 'fecha_publicacion'], {
      name: 'ix_noticias_activa_fecha',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('noticias');
  },
};
