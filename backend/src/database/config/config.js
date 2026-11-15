const env = require('../../config/env');

/**
 * Configuración de sequelize-cli (db:create, db:migrate, db:seed...).
 * Lee los mismos valores DB_* de backend/.env que usa la app (src/config/env.js).
 */
const config = {
  username: env.db.user,
  password: env.db.password,
  database: env.db.name,
  host: env.db.host,
  port: env.db.port,
  dialect: 'mysql',
  logging: env.db.logging ? console.log : false,
  timezone: '-06:00',
  dialectOptions: { decimalNumbers: true },
  // Tabla donde sequelize-cli registra las migraciones ya ejecutadas
  migrationStorageTableName: 'sequelize_meta',
  seederStorage: 'sequelize',
  seederStorageTableName: 'sequelize_data',
};

module.exports = {
  development: config,
  test: config,
  production: config,
};
