const { Model, DataTypes } = require('sequelize');

/** Tabla noticias (barra lateral). Usa fecha_publicacion en lugar de timestamps. */
class Noticia extends Model {
  static initModel(sequelize) {
    return this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        titulo: {
          type: DataTypes.STRING(150),
          allowNull: false,
          validate: { notEmpty: { msg: 'El título es obligatorio' } },
        },
        resumen: {
          type: DataTypes.STRING(255),
          allowNull: false, // lo que se ve en la barra lateral
        },
        contenido: {
          type: DataTypes.TEXT,
          allowNull: true, // lo que se ve en "Ver más..."
        },
        imagenUrl: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        activa: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        fechaPublicacion: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        creadoPor: {
          type: DataTypes.INTEGER,
          allowNull: true,
        },
      },
      {
        sequelize,
        modelName: 'Noticia',
        tableName: 'noticias',
        underscored: true,
        timestamps: false,
      },
    );
  }
}

module.exports = Noticia;
