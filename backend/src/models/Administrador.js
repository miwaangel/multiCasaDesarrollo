const { Model, DataTypes } = require('sequelize');

/**
 * Tabla administradores.
 * Por defecto (defaultScope) nunca se lee password_hash; para el login usar:
 *   Administrador.scope('conPassword').findOne({ where: { email } })
 */
class Administrador extends Model {
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
          unique: 'uq_administradores_email',
          validate: { isEmail: { msg: 'El email no es válido' } },
        },
        passwordHash: {
          type: DataTypes.STRING(255),
          allowNull: false,
        },
        activo: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
      },
      {
        sequelize,
        modelName: 'Administrador',
        tableName: 'administradores',
        underscored: true,
        timestamps: true,
        createdAt: 'creadoEn',
        updatedAt: 'actualizadoEn',
        defaultScope: {
          attributes: { exclude: ['passwordHash'] },
        },
        scopes: {
          conPassword: {},
        },
      },
    );
  }

  // Aunque el registro venga de create() o de scope('conPassword'), el hash nunca sale en JSON
  toJSON() {
    const { passwordHash, ...datos } = super.toJSON();
    return datos;
  }
}

module.exports = Administrador;
