const { Router } = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/AuthController');
const validar = require('../middlewares/validar');
const asyncHandler = require('../utils/asyncHandler');

const reglasLogin = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es obligatorio')
    .bail()
    .isEmail()
    .withMessage('El email no es válido')
    .toLowerCase(),
  body('password')
    .isString()
    .withMessage('La contraseña es obligatoria')
    .bail()
    .notEmpty()
    .withMessage('La contraseña es obligatoria'),
];

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Autenticación]
 *     summary: Inicia sesión de un administrador
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email: { type: string, format: email, example: admin@multicasa.com }
 *               password: { type: string, example: Admin123! }
 *     responses:
 *       200:
 *         description: Login correcto
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: object
 *                   properties:
 *                     token: { type: string, description: JWT válido por JWT_EXPIRES_IN (8h) }
 *                     admin:
 *                       type: object
 *                       properties:
 *                         id: { type: integer, example: 1 }
 *                         nombre: { type: string, example: Administrador }
 *                         email: { type: string, example: admin@multicasa.com }
 *       400:
 *         description: DATOS_INVALIDOS (email inválido o password vacío), con "detalles" por campo
 *       401:
 *         description: CREDENCIALES_INVALIDAS (mismo error si el email no existe, el admin está inactivo o la contraseña no coincide)
 */
function authRoutes(controller = new AuthController()) {
  const router = Router();
  router.post('/login', validar(reglasLogin), asyncHandler(controller.login));
  return router;
}

module.exports = authRoutes;
