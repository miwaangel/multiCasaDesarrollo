const { Model, DataTypes } = require('sequelize');

/** Tabla mensajes_contacto. Usa 'fecha' en lugar de timestamps. */
class MensajeContacto extends Model {
  static initModel(sequelize) {
    return this.init(
      {
        id: {
          type: DataTypes.INTEGER,
          autoIncrement: true,
          primaryKey: true,
        },
        nombre: {
          type: DataTypes.STRING(100),
          allowNull: false,
          validate: { notEmpty: { msg: 'El nombre es obligatorio' } },
        },
        email: {
          type: DataTypes.STRING(150),
          allowNull: false,
          validate: { isEmail: { msg: 'El email no es válido' } },
        },
        telefono: {
          type: DataTypes.STRING(20),
          allowNull: true,
        },
        asunto: {
          type: DataTypes.ENUM('informacion', 'vender', 'construir', 'mudanzas', 'seguros', 'otro'),
          allowNull: false,
          defaultValue: 'informacion',
        },
        mensaje: {
          type: DataTypes.TEXT,
          allowNull: false,
          validate: { notEmpty: { msg: 'El mensaje es obligatorio' } },
        },
        casaId: {
          type: DataTypes.INTEGER,
          allowNull: true, // si viene del botón "Me interesa"
        },
        leido: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: false,
        },
        fecha: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
      },
      {
        sequelize,
        modelName: 'MensajeContacto',
        tableName: 'mensajes_contacto',
        underscored: true,
        timestamps: false,
      },
    );
  }
}

module.exports = MensajeContacto;
