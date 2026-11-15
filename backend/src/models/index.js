const Database = require('../config/Database');
const Administrador = require('./Administrador');
const Casa = require('./Casa');
const ImagenCasa = require('./ImagenCasa');
const FormaPago = require('./FormaPago');
const Amenidad = require('./Amenidad');
const Noticia = require('./Noticia');
const Visita = require('./Visita');
const MensajeContacto = require('./MensajeContacto');

/**
 * Registro de modelos de Sequelize.
 * Todos se inicializan con la única conexión del Singleton Database y aquí se
 * declaran sus relaciones. El resto de la app importa los modelos desde este archivo:
 *
 *   const { Casa, ImagenCasa } = require('../models');
 */
const { sequelize } = Database.getInstance();

const models = {
  Administrador,
  Casa,
  ImagenCasa,
  FormaPago,
  Amenidad,
  Noticia,
  Visita,
  MensajeContacto,
};

Object.values(models).forEach((model) => model.initModel(sequelize));

// Administrador 1 -> N Casa / Noticia (creado_por; ON DELETE SET NULL)
Administrador.hasMany(Casa, { foreignKey: 'creadoPor', as: 'casas' });
Casa.belongsTo(Administrador, { foreignKey: 'creadoPor', as: 'creador' });

Administrador.hasMany(Noticia, { foreignKey: 'creadoPor', as: 'noticias' });
Noticia.belongsTo(Administrador, { foreignKey: 'creadoPor', as: 'creador' });

// Casa 1 -> N ImagenCasa (ON DELETE CASCADE)
Casa.hasMany(ImagenCasa, { foreignKey: 'casaId', as: 'imagenes' });
ImagenCasa.belongsTo(Casa, { foreignKey: 'casaId', as: 'casa' });

// Casa N <-> M FormaPago (tabla puente casa_forma_pago)
Casa.belongsToMany(FormaPago, {
  through: 'casa_forma_pago',
  foreignKey: 'casaId',
  otherKey: 'formaPagoId',
  as: 'formasPago',
  timestamps: false,
});
FormaPago.belongsToMany(Casa, {
  through: 'casa_forma_pago',
  foreignKey: 'formaPagoId',
  otherKey: 'casaId',
  as: 'casas',
  timestamps: false,
});

// Casa N <-> M Amenidad (tabla puente casa_amenidad)
Casa.belongsToMany(Amenidad, {
  through: 'casa_amenidad',
  foreignKey: 'casaId',
  otherKey: 'amenidadId',
  as: 'amenidades',
  timestamps: false,
});
Amenidad.belongsToMany(Casa, {
  through: 'casa_amenidad',
  foreignKey: 'amenidadId',
  otherKey: 'casaId',
  as: 'casas',
  timestamps: false,
});

// Casa 1 -> N MensajeContacto (botón "Me interesa"; ON DELETE SET NULL)
Casa.hasMany(MensajeContacto, { foreignKey: 'casaId', as: 'mensajes' });
MensajeContacto.belongsTo(Casa, { foreignKey: 'casaId', as: 'casa' });

module.exports = { sequelize, ...models };
