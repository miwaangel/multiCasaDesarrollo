const { Router } = require('express');
const CatalogoController = require('../controllers/CatalogoController');
const asyncHandler = require('../utils/asyncHandler');

/**
 * @openapi
 * /api/formas-pago:
 *   get:
 *     tags: [Catálogos]
 *     summary: Formas de pago con su descripción y requisitos (página Requisitos)
 *     responses:
 *       200:
 *         description: '{ "data": [ { "id": 1, "nombre": "Contado", "descripcion": "...", "requisitos": "línea 1\nlínea 2" } ], "total": 5 }'
 *
 * /api/amenidades:
 *   get:
 *     tags: [Catálogos]
 *     summary: Catálogo de amenidades (ordenado por tipo y nombre)
 *     parameters:
 *       - in: query
 *         name: agrupar
 *         schema: { type: string, enum: [tipo] }
 *         description: Con agrupar=tipo regresa { interior, exterior }
 *     responses:
 *       200:
 *         description: '{ "data": [ { "id": 1, "nombre": "Cocina integral", "tipo": "interior" } ], "total": 17 } · con ?agrupar=tipo: { "data": { "interior": [...], "exterior": [...] }, "total": 17 }'
 */
function catalogoRoutes(controller = new CatalogoController()) {
  const router = Router();
  router.get('/formas-pago', asyncHandler(controller.formasPago));
  router.get('/amenidades', asyncHandler(controller.amenidades));
  return router;
}

module.exports = catalogoRoutes;
