const { Model, DataTypes } = require('sequelize');

/** Catálogo amenidades (interior / exterior). */
class Amenidad extends Model {
  static initModel(sequelize) {
    return this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        nombre: {
          type: DataTypes.STRING(80),
          allowNull: false,
          unique: 'uq_amenidades_nombre_tipo',
        },
        tipo: {
          type: DataTypes.ENUM('interior', 'exterior'),
          allowNull: false,
          unique: 'uq_amenidades_nombre_tipo',
        },
      },
      {
        sequelize,
        modelName: 'Amenidad',
        tableName: 'amenidades',
        underscored: true,
        timestamps: false,
      },
    );
  }
}

module.exports = Amenidad;
