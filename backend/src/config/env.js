const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

/**
 * Configuración central de la aplicación.
 * Todo valor que venga de variables de entorno se lee aquí y en ningún otro lugar.
 */
const nodeEnv = process.env.NODE_ENV || 'development';
const dbName = process.env.DB_NAME || 'multicasa';

const env = Object.freeze({
  nodeEnv,
  port: Number(process.env.PORT) || 3000,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Carpeta de archivos subidos (se sirve en /uploads). Las pruebas usan una carpeta temporal.
  uploadsDir: process.env.UPLOADS_DIR || path.resolve(__dirname, '../../uploads'),

  db: Object.freeze({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    // Con npm test (NODE_ENV=test) se usa otra base para no tocar los datos de desarrollo
    name: nodeEnv === 'test' ? `${dbName}_test` : dbName,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    logging: process.env.DB_LOGGING === 'true',
  }),

  // Se mezcla con IP + user-agent antes de sacar el SHA-256 del visitante (nunca se guarda la IP)
  visitasSalt: process.env.VISITAS_SALT || '',

  seed: Object.freeze({
    adminPassword: process.env.SEED_ADMIN_PASSWORD || 'Admin123!',
  }),

  jwt: Object.freeze({
    secret: process.env.JWT_SECRET || '',
    expiresIn: process.env.JWT_EXPIRES_IN || '8h',
  }),

  // Búsqueda por radio: C.P. / ciudad → coordenadas (issue #13).
  // En pruebas se apaga para no depender de internet.
  geocoding: Object.freeze({
    habilitado: process.env.GEOCODING_HABILITADO
      ? process.env.GEOCODING_HABILITADO === 'true'
      : nodeEnv !== 'test',
    url: process.env.GEOCODING_URL || 'https://nominatim.openstreetmap.org',
    userAgent: process.env.GEOCODING_USER_AGENT || 'MultiCasa/1.0 (proyecto escolar)',
    timeoutMs: Number(process.env.GEOCODING_TIMEOUT_MS) || 5000,
  }),

  mail: Object.freeze({
    host: process.env.MAIL_HOST || '',
    port: Number(process.env.MAIL_PORT) || 587,
    user: process.env.MAIL_USER || '',
    password: process.env.MAIL_PASSWORD || '',
    to: process.env.MAIL_TO || '',
    from: process.env.MAIL_FROM || '',
  }),
});

module.exports = env;
