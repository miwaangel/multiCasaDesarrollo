const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const env = require('./config/env');
const { especificacion, opcionesUi } = require('./config/swagger');
const apiRoutes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');
const { UPLOADS_REPO } = require('./utils/archivos');

/**
 * Construye la app de Express sin levantar el servidor.
 * server.js hace listen(); las pruebas (Supertest) importan solo la app.
 */
class App {
  constructor() {
    this.express = express();
    this.#middlewares();
    this.#routes();
    this.#errorHandling();
  }

  #middlewares() {
    this.express.disable('x-powered-by');
    // Si se publica detrás de un proxy (Nginx, Render, Railway...), req.ip toma la IP real
    // del visitante del header X-Forwarded-For que agrega ese proxy (solo confía en 1 salto).
    this.express.set('trust proxy', 1);
    // exposedHeaders: el front lee el nombre del archivo de los reportes (Content-Disposition)
    this.express.use(cors({ origin: env.corsOrigin, exposedHeaders: ['Content-Disposition'] }));
    this.express.use(express.json({ limit: '1mb' }));
    this.express.use(express.urlencoded({ extended: true }));
    // Imágenes: el navegador las guarda en caché 1 día (los nombres de las subidas nunca se repiten)
    this.express.use('/uploads', express.static(env.uploadsDir, { maxAge: '1d' }));
    // Si UPLOADS_DIR apunta a otro lado (un volumen en el servidor), las fotos de los seeders
    // se siguen sirviendo desde la carpeta del repo
    if (path.resolve(env.uploadsDir) !== UPLOADS_REPO) {
      this.express.use('/uploads', express.static(UPLOADS_REPO, { maxAge: '1d' }));
    }
  }

  #routes() {
    // Documentación de la API (issue #18): antes de /api para que no la tape el router
    this.express.get('/api/docs.json', (req, res) => res.json(especificacion));
    this.express.use('/api/docs', swaggerUi.serve, swaggerUi.setup(especificacion, opcionesUi));
    this.express.use('/api', apiRoutes());
    this.#frontend();
  }

  /**
   * Sitio en React ya compilado (issue #31), solo si existe frontend/dist.
   * Cualquier GET que no sea /api ni /uploads regresa index.html para que React Router
   * resuelva la ruta (/casas/3, /admin/panel...) aunque se recargue la página.
   */
  #frontend() {
    const indexHtml = path.join(env.frontendDir, 'index.html');
    if (!fs.existsSync(indexHtml)) {
      return;
    }
    this.express.use(express.static(env.frontendDir, { index: false }));
    this.express.get(/^\/(?!api\/|api$|uploads\/).*/, (req, res) => res.sendFile(indexHtml));
  }

  #errorHandling() {
    this.express.use(notFound);
    this.express.use(errorHandler);
  }
}

module.exports = new App().express;
