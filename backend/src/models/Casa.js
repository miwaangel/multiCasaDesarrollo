const { Model, DataTypes } = require('sequelize');

/**
 * Tabla casas (ficha técnica).
 * Las validaciones repiten los CHECK de la BD para responder con un mensaje claro
 * antes de llegar a MySQL.
 */
class Casa extends Model {
  static initModel(sequelize) {
    return this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        // Generales
        titulo: {
          type: DataTypes.STRING(150),
          allowNull: false,
          validate: { notEmpty: { msg: 'El título es obligatorio' } },
        },
        descripcion: {
          type: DataTypes.TEXT,
          allowNull: true,
        },
        tipo: {
          type: DataTypes.ENUM('casa', 'departamento', 'terreno'),
          allowNull: false,
          defaultValue: 'casa',
        },
        precio: {
          type: DataTypes.DECIMAL(12, 2),
          allowNull: false,
          validate: {
            esPositivo(valor) {
              if (!(Number(valor) > 0)) {
                throw new Error('El precio debe ser mayor a 0');
              }
            },
          },
        },
        estatus: {
          type: DataTypes.ENUM('venta', 'vendida'),
          allowNull: false,
          defaultValue: 'venta',
        },
        destacada: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        // Ubicación
        direccion: {
          type: DataTypes.STRING(200),
          allowNull: false,
        },
        colonia: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        ciudad: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        estado: {
          type: DataTypes.STRING(100),
          allowNull: false,
        },
        codigoPostal: {
          type: DataTypes.CHAR(5),
          allowNull: false,
          validate: {
            is: { args: /^[0-9]{5}$/, msg: 'El código postal debe tener 5 dígitos' },
          },
        },
        lat: {
          type: DataTypes.DECIMAL(9, 6),
          allowNull: false,
          validate: {
            min: { args: [-90], msg: 'La latitud debe estar entre -90 y 90' },
            max: { args: [90], msg: 'La latitud debe estar entre -90 y 90' },
          },
        },
        lng: {
          type: DataTypes.DECIMAL(9, 6),
          allowNull: false,
          validate: {
            min: { args: [-180], msg: 'La longitud debe estar entre -180 y 180' },
            max: { args: [180], msg: 'La longitud debe estar entre -180 y 180' },
          },
        },
        // Características
        m2Terreno: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true,
        },
        m2Construccion: {
          type: DataTypes.DECIMAL(10, 2),
          allowNull: true, // NULL si es terreno
        },
        recamaras: {
          type: DataTypes.TINYINT.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
        },
        banos: {
          type: DataTypes.DECIMAL(3, 1),
          allowNull: false,
          defaultValue: 0, // 2.5 = dos baños y medio
        },
        estacionamientos: {
          type: DataTypes.TINYINT.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
        },
        plantas: {
          type: DataTypes.TINYINT.UNSIGNED,
          allowNull: false,
          defaultValue: 1,
        },
        orientacion: {
          type: DataTypes.ENUM('norte', 'sur', 'oriente', 'poniente'),
          allowNull: true,
        },
        // Control
        fechaVenta: {
          type: DataTypes.DATEONLY,
          allowNull: true, // se llena al marcarla como vendida
        },
        creadoPor: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'Casa',
        tableName: 'casas',
        underscored: true,
        timestamps: true,
        createdAt: 'creadoEn',
        updatedAt: 'actualizadoEn',
      },
    );
  }
}

module.exports = Casa;
