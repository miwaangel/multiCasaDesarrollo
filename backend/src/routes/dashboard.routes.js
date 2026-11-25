const { Router } = require('express');
const DashboardController = require('../controllers/DashboardController');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Gráficas del dashboard. Se monta en /api/admin/dashboard dentro de admin.routes.js,
 * así que exige "Authorization: Bearer <token>".
 *
 * @openapi
 * /api/admin/dashboard/rangos-precio:
 *   get:
 *     tags: [Dashboard]
 *     summary: Casas por rango de precio (siempre los 5 rangos en orden, con 0 si no hay casas)
 *     description: Cuenta todas las casas (en venta y vendidas). "total" es la suma de los 5 rangos.
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Conteo por rango
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 - { rango: 'Menos de $1 M', orden: 1, total: 4 }
 *                 - { rango: '$1 M - $2 M', orden: 2, total: 5 }
 *                 - { rango: '$2 M - $4 M', orden: 3, total: 5 }
 *                 - { rango: '$4 M - $7 M', orden: 4, total: 3 }
 *                 - { rango: 'Más de $7 M', orden: 5, total: 3 }
 *               total: 20
 *       401:
 *         description: TOKEN_REQUERIDO / TOKEN_INVALIDO
 *
 * /api/admin/dashboard/estatus:
 *   get:
 *     tags: [Dashboard]
 *     summary: Casas vendidas contra casas en venta (siempre las dos, con 0 si no hay)
 *     security: [{ bearerAuth: [] }]
 *     responses:
 *       200:
 *         description: Conteo por estatus
 *         content:
 *           application/json:
 *             example:
 *               data: { venta: 14, vendida: 6, total: 20 }
 *       401:
 *         description: TOKEN_REQUERIDO / TOKEN_INVALIDO
 */
function dashboardRoutes(controller = new DashboardController()) {
  const router = Router();
  router.get('/rangos-precio', asyncHandler(controller.rangosPrecio));
  router.get('/estatus', asyncHandler(controller.estatus));
  return router;
}

module.exports = dashboardRoutes;
