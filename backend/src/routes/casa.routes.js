const { Router } = require('express');
const CasaController = require('../controllers/CasaController');
const validar = require('../middlewares/validar');
const asyncHandler = require('../utils/asyncHandler');
const { reglaId } = require('../validators/casa.validators');
const { reglasBusqueda } = require('../validators/busqueda.validators');

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
 * /api/casas/buscar:
 *   get:
 *     tags: [Casas (público)]
 *     summary: Buscador "Encuentra tu futura propiedad" (solo casas en venta)
 *     description: >
 *       Todos los filtros son opcionales; uno vacío no filtra.
 *       Con ubicacion + radioKm se buscan las casas a esa distancia (ordenadas de la más cercana).
 *       Con ubicacion sin radioKm ("Sin rango") solo las de ese C.P. o esa ciudad.
 *     parameters:
 *       - { in: query, name: ubicacion, schema: { type: string }, example: '25000', description: C.P. de 5 dígitos o ciudad }
 *       - { in: query, name: radioKm, schema: { type: integer, enum: [2, 5, 10, 20] }, example: 5 }
 *       - { in: query, name: precioMin, schema: { type: number }, example: 1000000 }
 *       - { in: query, name: precioMax, schema: { type: number }, example: 3000000 }
 *       - { in: query, name: recamaras, schema: { type: integer }, example: 3, description: Mínimo de recámaras }
 *       - { in: query, name: banos, schema: { type: number }, example: 2, description: Mínimo de baños }
 *     responses:
 *       200:
 *         description: >
 *           { "data": [ { "id": 1, "titulo": "...", "precio": 1850000, "lat": 25.4247, "lng": -101.001,
 *           "distanciaKm": 0, "portada": "/uploads/seed/casa-01-1.jpg", ... } ], "total": 4,
 *           "centro": { "lat": 25.4247, "lng": -101.001, "fuente": "catalogo", "radioKm": 5 } }
 *           (distanciaKm y centro solo cuando se busca por radio; si no, centro = null)
 *       400:
 *         description: DATOS_INVALIDOS (radio fuera de 2/5/10/20, precioMax < precioMin, radio sin ubicación...)
 *       404:
 *         description: UBICACION_NO_ENCONTRADA (el C.P. o la ciudad no existe)
 *       503:
 *         description: GEOCODIFICACION_NO_DISPONIBLE (Nominatim no respondió)
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
  router.get('/buscar', validar(reglasBusqueda), asyncHandler(controller.buscar)); // antes de /:id
  router.get('/:id', validar(reglaId), asyncHandler(controller.detalle));
  return router;
}

module.exports = casaRoutes;
