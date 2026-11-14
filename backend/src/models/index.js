const Database = require('../config/Database');

/**
 * Registro de modelos de Sequelize (issue #8).
 * Cada modelo vive en su propio archivo y exporta una función (sequelize, DataTypes) => Model.
 * Aquí se cargan y se declaran las relaciones, por ejemplo:
 *
 *   const Casa = require('./Casa')(sequelize, DataTypes);
 *   const ImagenCasa = require('./ImagenCasa')(sequelize, DataTypes);
 *   Casa.hasMany(ImagenCasa, { foreignKey: 'casaId', as: 'imagenes' });
 *   ImagenCasa.belongsTo(Casa, { foreignKey: 'casaId' });
 */
// eslint-disable-next-line no-unused-vars
const { sequelize } = Database.getInstance();

const models = {};

module.exports = models;
