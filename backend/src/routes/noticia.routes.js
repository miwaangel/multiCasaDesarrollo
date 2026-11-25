const { Router } = require('express');
const NoticiaController = require('../controllers/NoticiaController');
const validar = require('../middlewares/validar');
const asyncHandler = require('../utils/asyncHandler');
const { reglaId, reglasListaPublica } = require('../validators/noticia.validators');

/**
 * @openapi
 * /api/noticias:
 *   get:
 *     tags: [Noticias (público)]
 *     summary: Noticias activas para la barra lateral, de la más reciente a la más vieja (sin el contenido largo)
 *     parameters:
 *       - { in: query, name: limite, schema: { type: integer, default: 5, maximum: 50 } }
 *     responses:
 *       200:
 *         description: Lista de noticias activas. "total" = cuántas activas hay en total.
 *         content:
 *           application/json:
 *             example:
 *               data:
 *                 - id: 3
 *                   titulo: Cómo pagar tu mensualidad si te encuentras en el extranjero
 *                   resumen: Si vives o trabajas fuera de México, te explicamos las opciones...
 *                   imagenUrl: null
 *                   fechaPublicacion: '2026-11-12T14:15:00.000Z'
 *               total: 3
 *       400: { description: DATOS_INVALIDOS (limite fuera de 1-50) }
 *
 * /api/noticias/{id}:
 *   get:
 *     tags: [Noticias (público)]
 *     summary: Noticia completa (con contenido) para "Ver más..."
 *     parameters: [{ in: path, name: id, required: true, schema: { type: integer } }]
 *     responses:
 *       200:
 *         description: Noticia activa
 *         content:
 *           application/json:
 *             example:
 *               data: { id: 1, titulo: Nuevo convenio a casas ecológicas, resumen: '...', contenido: 'Párrafo 1...\n\nPárrafo 2...', imagenUrl: null, activa: true, fechaPublicacion: '2026-11-03T15:00:00.000Z' }
 *       404: { description: NOTICIA_NO_ENCONTRADA (no existe o está inactiva) }
 */
function noticiaRoutes(controller = new NoticiaController()) {
  const router = Router();
  router.get('/', validar(reglasListaPublica), asyncHandler(controller.listar));
  router.get('/:id', validar(reglaId), asyncHandler(controller.detalle));
  return router;
}

module.exports = noticiaRoutes;
