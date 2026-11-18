const { Router } = require('express');
const CasaController = require('../controllers/CasaController');
const validar = require('../middlewares/validar');
const asyncHandler = require('../utils/asyncHandler');
const { reglaId } = require('../validators/casa.validators');

/**
 * @openapi
 * /api/casas/destacadas:
 *   get:
 *     tags: [Casas (público)]
 *     summary: Casas en venta marcadas como destacadas (slider del Inicio)
 *     responses:
 *       200:
 *         description: '{ "data": [ { "id": 4, "titulo": "...", "precio": 2650000, ..., "portada": "/uploads/seed/casa-04-1.jpg" } ], "total": 5 }'
 *
 * /api/casas/{id}:
 *   get:
 *     tags: [Casas (público)]
 *     summary: Detalle de una casa en venta
 *     parameters:
 *       - { in: path, name: id, required: true, schema: { type: integer }, example: 1 }
 *     responses:
 *       200:
 *         description: >
 *           { "data": { "id": 1, "titulo": "...", "m2Terreno": 180, "codigoPostal": "25000", ...,
 *           "imagenes": [ { "id": 1, "url": "/uploads/seed/casa-01-1.jpg", "orden": 1, "esPortada": true } ],
 *           "amenidades": [ { "id": 1, "nombre": "Cocina integral", "tipo": "interior" } ],
 *           "formasPago": [ { "id": 1, "nombre": "Contado", "descripcion": "...", "requisitos": "..." } ] } }
 *       404:
 *         description: CASA_NO_ENCONTRADA (no existe o ya está vendida)
 */
function casaRoutes(controller = new CasaController()) {
  const router = Router();
  router.get('/destacadas', asyncHandler(controller.destacadas));
  router.get('/:id', validar(reglaId), asyncHandler(controller.detalle));
  return router;
}

module.exports = casaRoutes;
