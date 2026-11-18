const express = require('express');
const cors = require('cors');
const env = require('./config/env');
const apiRoutes = require('./routes');
const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

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
    this.express.use(cors({ origin: env.corsOrigin }));
    this.express.use(express.json({ limit: '1mb' }));
    this.express.use(express.urlencoded({ extended: true }));
    this.express.use('/uploads', express.static(env.uploadsDir));
  }

  #routes() {
    this.express.use('/api', apiRoutes());
  }

  #errorHandling() {
    this.express.use(notFound);
    this.express.use(errorHandler);
  }
}

module.exports = new App().express;
