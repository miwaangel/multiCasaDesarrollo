const { Model, DataTypes } = require('sequelize');

/** Tabla imagenes_casa (1 casa -> N imágenes). Solo tiene creado_en. */
class ImagenCasa extends Model {
  static initModel(sequelize) {
    return this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        casaId: {
          type: DataTypes.INTEGER,
          allowNull: false,
        },
        url: {
          type: DataTypes.STRING(255),
          allowNull: false, // ruta del archivo subido con multer
        },
        orden: {
          type: DataTypes.TINYINT.UNSIGNED,
          allowNull: false,
          defaultValue: 0,
        },
        esPortada: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
      },
      {
        sequelize,
        modelName: 'ImagenCasa',
        tableName: 'imagenes_casa',
        underscored: true,
        timestamps: true,
        createdAt: 'creadoEn',
        updatedAt: false,
      },
    );
  }
}

module.exports = ImagenCasa;
