const { Router } = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');
const casaRoutes = require('./casa.routes');
const catalogoRoutes = require('./catalogo.routes');
const noticiaRoutes = require('./noticia.routes');
const visitaRoutes = require('./visita.routes');

/**
 * Router principal montado en /api.
 * Cada módulo público nuevo agrega aquí su línea, por ejemplo:
 *   router.use('/casas', casaRoutes());
 * Las rutas de administrador van dentro de admin.routes.js (ya protegidas con el token).
 */
function apiRoutes() {
  const router = Router();
  router.use('/health', healthRoutes());
  router.use('/auth', authRoutes());
  router.use('/casas', casaRoutes());
  router.use('/noticias', noticiaRoutes());
  router.use('/visitas', visitaRoutes());
  router.use('/', catalogoRoutes()); // /formas-pago y /amenidades
  router.use('/admin', adminRoutes());
  return router;
}

module.exports = apiRoutes;
