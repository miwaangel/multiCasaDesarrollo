const app = require('./app');
const env = require('./config/env');
const Database = require('./config/Database');

async function start() {
  const db = Database.getInstance();

  try {
    await db.connect();
    console.log(`BD conectada: ${env.db.name}@${env.db.host}:${env.db.port}`);
  } catch (err) {
    console.error(`No se pudo conectar a la BD: ${err.message}`);
    console.error('Revisa las variables DB_* en backend/.env');
    process.exit(1);
  }

  const server = app.listen(env.port, () => {
    console.log(`API MultiCasa en http://localhost:${env.port}/api`);
  });

  const shutdown = async () => {
    server.close();
    await db.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

start();
