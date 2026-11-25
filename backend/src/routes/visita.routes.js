const { Router } = require('express');
const { body } = require('express-validator');
const VisitaController = require('../controllers/VisitaController');
const validar = require('../middlewares/validar');
const asyncHandler = require('../utils/asyncHandler');

const reglasVisita = [
  body('pagina')
    .customSanitizer((v) => (v === '' ? null : v))
    .optional({ values: 'null' })
    .isString()
    .withMessage('Debe ser texto')
    .bail()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Máximo 150 caracteres'),
];

/**
 * @openapi
 * /api/visitas:
 *   post:
 *     tags: [Visitas]
 *     summary: Registra una visita (el frontend la manda al cargar cada página)
 *     description: >
 *       Se guarda SHA-256(IP + user-agent + VISITAS_SALT), nunca la IP. Si el mismo visitante
 *       registró la misma página hace menos de 10 segundos, se ignora (React en modo estricto
 *       carga dos veces) y responde 200 con registrada = false.
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties: { pagina: { type: string, maxLength: 150, example: /buscar } }
 *     responses:
 *       201:
 *         description: Visita contada
 *         content: { application/json: { example: { data: { registrada: true } } } }
 *       200:
 *         description: Visita repetida (no se contó)
 *         content: { application/json: { example: { data: { registrada: false } } } }
 *       400: { description: DATOS_INVALIDOS (pagina de más de 150 caracteres) }
 *
 * /api/visitas/resumen:
 *   get:
 *     tags: [Visitas]
 *     summary: Contador de la barra lateral
 *     description: visitas = total de registros; conectados = visitantes distintos en los últimos 5 minutos.
 *     responses:
 *       200:
 *         description: Contador
 *         content: { application/json: { example: { data: { visitas: 1532, conectados: 4 } } } }
 */
function visitaRoutes(controller = new VisitaController()) {
  const router = Router();
  router.post('/', validar(reglasVisita), asyncHandler(controller.registrar));
  router.get('/resumen', asyncHandler(controller.resumen));
  return router;
}

module.exports = visitaRoutes;
