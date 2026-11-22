const { Router } = require('express');
const HealthController = require('../controllers/HealthController');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @openapi
 * /api/health:
 *   get:
 *     tags: [Sistema]
 *     summary: Estado del servidor y de la conexión a la BD
 *     responses:
 *       200:
 *         description: '{ "data": { "estado": "ok", "baseDeDatos": "conectada", "fecha": "2026-11-21T18:00:00.000Z" } }'
 */
function healthRoutes(controller = new HealthController()) {
  const router = Router();
  router.get('/', asyncHandler(controller.getEstado));
  return router;
}

module.exports = healthRoutes;
