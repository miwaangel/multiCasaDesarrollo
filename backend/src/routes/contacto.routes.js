const { Router } = require('express');
const ContactoController = require('../controllers/ContactoController');
const validar = require('../middlewares/validar');
const asyncHandler = require('../utils/asyncHandler');
const { reglasContacto } = require('../validators/contacto.validators');

/**
 * @openapi
 * /api/contacto:
 *   post:
 *     tags: [Contacto]
 *     summary: Formulario de contacto (guarda el mensaje y lo envía por correo a MAIL_TO)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [nombre, email, mensaje]
 *             properties:
 *               nombre: { type: string, maxLength: 100, example: Ana López }
 *               email: { type: string, format: email, maxLength: 150, example: ana@correo.com }
 *               telefono: { type: string, maxLength: 20, example: '844 123 4567' }
 *               asunto:
 *                 type: string
 *                 enum: [informacion, vender, construir, mudanzas, seguros, otro]
 *                 default: informacion
 *               mensaje: { type: string, minLength: 10, maxLength: 2000, example: Me gustaría agendar una visita. }
 *               casaId: { type: integer, example: 1, description: 'Si viene del botón "Me interesa"' }
 *     responses:
 *       201:
 *         description: >
 *           { "data": { "id": 12, "correoEnviado": true } }
 *           (correoEnviado = false si el mensaje se guardó pero el correo falló)
 *       400:
 *         description: DATOS_INVALIDOS (campos faltantes o inválidos, o la casa no existe)
 */
function contactoRoutes(controller = new ContactoController()) {
  const router = Router();
  router.post('/', validar(reglasContacto), asyncHandler(controller.enviar));
  return router;
}

module.exports = contactoRoutes;
