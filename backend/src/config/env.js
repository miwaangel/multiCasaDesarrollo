const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

/**
 * Configuración central de la aplicación.
 * Todo valor que venga de variables de entorno se lee aquí y en ningún otro lugar.
 */
const env = Object.freeze({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: Number(process.env.PORT) || 3000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  db: Object.freeze({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    name: process.env.DB_NAME || 'multicasa',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    logging: process.env.DB_LOGGING === 'true',
  }),

  seed: Object.freeze({
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin123!',
  }),

  jwt: Object.freeze({
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  }),

  mail: Object.freeze({
    host: process.env.MAIL_HOST || '',
    port: Number(process.env.MAIL_PORT) || 587,
    user: process.env.MAIL_USER || '',
    password: process.env.MAIL_PASSWORD || '',
    to: process.env.MAIL_TO || '',
  }),
});

module.exports = env;
