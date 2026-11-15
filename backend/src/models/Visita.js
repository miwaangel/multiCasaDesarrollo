const { Model, DataTypes } = require('sequelize');

/**
 * Tabla visitas (contador de Visitas y Conectados). Usa 'fecha' en lugar de timestamps.
 * visitante_hash = SHA-256 de IP + user agent (nunca se guarda la IP en claro).
 */
class Visita extends Model {
  static initModel(sequelize) {
    return this.init(
      {
        id: {
          type: DataTypes.BIGINT,
          autoIncrement: true,
          primaryKey: true,
        },
        visitanteHash: {
          type: DataTypes.CHAR(64),
          allowNull: false,
        },
        pagina: {
          type: DataTypes.STRING(150),
          allowNull: true,
        },
        fecha: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        modelName: 'Visita',
        tableName: 'visitas',
        underscored: true,
        timestamps: false,
      },
    );
  }
}

module.exports = Visita;
