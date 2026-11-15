const { Model, DataTypes } = require('sequelize');

/** Catálogo formas_pago, con los requisitos para la página Requisitos. */
class FormaPago extends Model {
  static initModel(sequelize) {
    return this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        nombre: {
          type: DataTypes.STRING(60),
          allowNull: false,
          unique: 'uq_formas_pago_nombre',
        },
        descripcion: {
          type: DataTypes.STRING(255),
          allowNull: true,
        },
        requisitos: {
          type: DataTypes.TEXT,
          allowNull: true, // lista separada por saltos de línea
        },
      },
      {
        sequelize,
        modelName: 'FormaPago',
        tableName: 'formas_pago',
        underscored: true,
        timestamps: false,
      },
    );
  }
}

module.exports = FormaPago;
