const { Sequelize } = require('sequelize');
const env = require('./env');

/**
 * Patrón Singleton: una sola conexión (pool) de Sequelize para toda la app.
 *
 * Uso:
 *   const db = Database.getInstance();
 *   await db.connect();
 *   const sequelize = db.sequelize; // para definir modelos
 */
class Database {
  static #instance = null;

  #sequelize;

  constructor() {
    if (Database.#instance) {
      throw new Error('Database es un Singleton: usa Database.getInstance()');
    }

    this.#sequelize = new Sequelize(env.db.name, env.db.user, env.db.password, {
      host: env.db.host,
      port: env.db.port,
      dialect: 'mysql',
      logging: env.db.logging ? console.log : false,
      timezone: '-06:00',
      define: {
        underscored: true, // columnas snake_case en la BD, camelCase en el código
        timestamps: true,
        freezeTableName: true,
      },
      pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
      dialectOptions: { connectTimeout: 5000 },
    });
  }

  static getInstance() {
    if (!Database.#instance) {
      Database.#instance = new Database();
    }
    return Database.#instance;
  }

  get sequelize() {
    return this.#sequelize;
  }

  async connect() {
    await this.#sequelize.authenticate();
  }

  async isConnected() {
    try {
      await this.#sequelize.authenticate();
      return true;
    } catch {
      return false;
    }
  }

  async close() {
    await this.#sequelize.close();
  }
}

module.exports = Database;
