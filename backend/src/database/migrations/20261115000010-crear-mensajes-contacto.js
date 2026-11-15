'use strict';

/** Tabla mensajes_contacto (además se envían por correo). */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'mensajes_contacto',
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        nombre: { type: Sequelize.STRING(100), allowNull: false },
        email: { type: Sequelize.STRING(150), allowNull: false },
        telefono: { type: Sequelize.STRING(20), allowNull: true },
        asunto: {
          type: Sequelize.ENUM('informacion', 'vender', 'construir', 'mudanzas', 'seguros', 'otro'),
          allowNull: false,
          defaultValue: 'informacion',
        },
        mensaje: { type: Sequelize.TEXT, allowNull: false },
        casa_id: { type: Sequelize.INTEGER, allowNull: true }, // si viene del botón "Me interesa"
        leido: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        fecha: {
          type: Sequelize.DATE,
          allowNull: false,
          defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
        },
      },
      { engine: 'InnoDB', charset: 'utf8mb4', collate: 'utf8mb4_unicode_ci' },
    );

    await queryInterface.addConstraint('mensajes_contacto', {
      fields: ['casa_id'],
      type: 'foreign key',
      name: 'fk_mensajes_casa',
      references: { table: 'casas', field: 'id' },
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('mensajes_contacto');
  },
};
