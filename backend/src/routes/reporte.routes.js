const { Router } = require('express');
const { query } = require('express-validator');
const ReporteController = require('../controllers/ReporteController');
const ReporteService = require('../services/ReporteService');
const validar = require('../middlewares/validar');
const asyncHandler = require('../utils/asyncHandler');

const reglasReporte = [
  query('formato')
    .optional()
    .isIn(ReporteService.FORMATOS)
    .withMessage(`El formato debe ser ${ReporteService.FORMATOS.join(' o ')}`),
  query('estatus')
    .optional({ values: 'falsy' })
    .isIn(['venta', 'vendida'])
    .withMessage('El estatus debe ser venta o vendida'),
];

/**
 * Reportes. Se monta en /api/admin/reportes dentro de admin.routes.js,
 * así que exige "Authorization: Bearer <token>".
 *
 * @openapi
 * /api/admin/reportes/casas:
 *   get:
 *     tags: [Reportes]
 *     summary: Reporte de todas las casas con su estatus (venta / vendida) en PDF o Excel
 *     description: >
 *       Incluye un resumen (total, en venta, vendidas y el valor de cada grupo) y el listado
 *       (primero en venta, después vendidas). El Excel trae filtros y el resumen con fórmulas.
 *     security: [{ bearerAuth: [] }]
 *     parameters:
 *       - { in: query, name: formato, schema: { type: string, enum: [pdf, xlsx], default: pdf } }
 *       - { in: query, name: estatus, schema: { type: string, enum: [venta, vendida] }, description: 'Opcional: solo ese estatus' }
 *     responses:
 *       200:
 *         description: Archivo reporte-casas-AAAA-MM-DD.pdf o .xlsx
 *         content:
 *           application/pdf:
 *             schema: { type: string, format: binary }
 *           application/vnd.openxmlformats-officedocument.spreadsheetml.sheet:
 *             schema: { type: string, format: binary }
 *       400:
 *         description: DATOS_INVALIDOS (formato o estatus no válido)
 *       401:
 *         description: TOKEN_REQUERIDO / TOKEN_INVALIDO
 */
function reporteRoutes(controller = new ReporteController()) {
  const router = Router();
  router.get('/casas', validar(reglasReporte), asyncHandler(controller.casas));
  return router;
}

module.exports = reporteRoutes;
