const path = require('path');
const { execFileSync } = require('child_process');

const CLI = require.resolve('sequelize-cli/lib/sequelize');
const BACKEND = path.resolve(__dirname, '../..');

function sequelizeCli(...args) {
  execFileSync(process.execPath, [CLI, ...args], {
    cwd: BACKEND,
    env: { ...process.env, NODE_ENV: 'test' },
    stdio: 'pipe',
  });
}

/**
 * Deja la base de pruebas (DB_NAME + "_test", por ejemplo multicasa_test) recién creada,
 * con todas las migraciones y los seeders. Nunca toca la base de desarrollo.
 * Requiere MySQL encendido con los datos de backend/.env.
 */
function prepararBaseDePruebas() {
  try {
    sequelizeCli('db:drop');
  } catch {
    // no existía
  }
  sequelizeCli('db:create', '--charset', 'utf8mb4', '--collate', 'utf8mb4_unicode_ci');
  sequelizeCli('db:migrate');
  sequelizeCli('db:seed:all');
}

module.exports = { prepararBaseDePruebas };
