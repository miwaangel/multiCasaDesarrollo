const { Router } = require('express');
const healthRoutes = require('./health.routes');

/**
 * Router principal montado en /api.
 * Cada módulo nuevo agrega aquí su línea, por ejemplo:
 *   router.use('/casas', casaRoutes());
 *   router.use('/admin/casas', authMiddleware, adminCasaRoutes());
 */
function apiRoutes() {
  const router = Router();
  router.use('/health', healthRoutes());
  return router;
}

module.exports = apiRoutes;
