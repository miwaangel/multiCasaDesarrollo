const { Router } = require('express');
const healthRoutes = require('./health.routes');
const authRoutes = require('./auth.routes');
const adminRoutes = require('./admin.routes');

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
  router.use('/admin', adminRoutes());
  return router;
}

module.exports = apiRoutes;
