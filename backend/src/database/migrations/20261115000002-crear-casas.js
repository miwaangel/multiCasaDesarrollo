'use strict';

/** Tabla casas (ficha técnica), con sus CHECK e índices de búsqueda. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable(
      'casas',
      {
        id: {
          type: Sequelize.INTEGER,
          autoIncrement: true,
          primaryKey: true,
          allowNull: false,
        },
        // Generales
        titulo: { type: Sequelize.STRING(150), allowNull: false },
        descripcion: { type: Sequelize.TEXT, allowNull: true },
        tipo: {
          type: Sequelize.ENUM('casa', 'departamento', 'terreno'),
          allowNull: false,
          defaultValue: 'casa',
        },
        precio: { type: Sequelize.DECIMAL(12, 2), allowNull: false }, // pesos MXN
        estatus: {
          type: Sequelize.ENUM('venta', 'vendida'),
          allowNull: false,
          defaultValue: 'venta',
        },
        destacada: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
        // Ubicación
        direccion: { type: Sequelize.STRING(200), allowNull: false },
        colonia: { type: Sequelize.STRING(100), allowNull: false },
        ciudad: { type: Sequelize.STRING(100), allowNull: false },
        estado: { type: Sequelize.STRING(100), allowNull: false },
        codigo_postal: { type: Sequelize.CHAR(5), allowNull: false },
        lat: { type: Sequelize.DECIMAL(9, 6), allowNull: false },
        lng: { type: Sequelize.DECIMAL(9, 6), allowNull: false },
        // Características
        m2_terreno: { type: Sequelize.DECIMAL(10, 2), allowNull: true },
        m2_construccion: { type: Sequelize.DECIMAL(10, 2), allowNull: true }, // NULL si es terreno
        recamaras: { type: Sequelize.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
        banos: { type: Sequelize.DECIMAL(3, 1), allowNull: false, defaultValue: 0 }, // 2.5 = medio baño
        estacionamientos: { type: Sequelize.TINYINT.UNSIGNED, allowNull: false, defaultValue: 0 },
        plantas: { type: Sequelize.TINYINT.UNSIGNED, allowNull: false, defaultValue: 1 },
        orientacion: {
          type: Sequelize.ENUM('norte', 'sur', 'oriente', 'poniente'),
          allowNull: true,
        },
        // Control
        fecha_venta: { type: Sequelize.DATEONLY, allowNull: true }, // se llena al marcarla como vendida
        creado_por: { type: Sequelize.INTEGER, allowNull: true },
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

    await queryInterface.addConstraint('casas', {
      fields: ['creado_por'],
      type: 'foreign key',
      name: 'fk_casas_admin',
      references: { table: 'administradores', field: 'id' },
      onDelete: 'SET NULL',
    });

    // CHECK con el mismo texto que el modelo físico
    const checks = [
      'CONSTRAINT chk_casas_precio CHECK (precio > 0)',
      "CONSTRAINT chk_casas_cp CHECK (codigo_postal REGEXP '^[0-9]{5}$')",
      'CONSTRAINT chk_casas_lat CHECK (lat BETWEEN -90 AND 90)',
      'CONSTRAINT chk_casas_lng CHECK (lng BETWEEN -180 AND 180)',
    ];
    for (const check of checks) {
      await queryInterface.sequelize.query(`ALTER TABLE casas ADD ${check}`);
    }

    // Índices para la búsqueda pública, el reporte y el dashboard
    await queryInterface.addIndex('casas', ['estatus', 'precio'], { name: 'ix_casas_estatus_precio' });
    await queryInterface.addIndex('casas', ['codigo_postal'], { name: 'ix_casas_codigo_postal' });
    await queryInterface.addIndex('casas', ['ciudad', 'estado'], { name: 'ix_casas_ciudad_estado' });
    await queryInterface.addIndex('casas', ['lat', 'lng'], { name: 'ix_casas_ubicacion' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('casas');
  },
};
