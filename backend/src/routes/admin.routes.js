const { Router } = require('express');
const AuthController = require('../controllers/AuthController');
const authMiddleware = require('../middlewares/auth');
const asyncHandler = require('../utils/asyncHandler');
const adminCasaRoutes = require('./adminCasa.routes');
const dashboardRoutes = require('./dashboard.routes');

/**
 * Router del sitio privado, montado en /api/admin.
 * El middleware auth se aplica a TODO el router: cualquier ruta que se agregue aquí
 * ya exige "Authorization: Bearer <token>". Los siguientes módulos solo agregan su línea:
 *   router.use('/casas', adminCasaRoutes());
 *   router.use('/noticias', adminNoticiaRoutes());
 */
function adminRoutes({ authController = new AuthController(), auth = authMiddleware() } = {}) {
  const router = Router();
  router.use(auth);

  /**
   * @openapi
   * /api/admin/perfil:
   *   get:
   *     tags: [Autenticación]
   *     summary: Datos del administrador dueño del token
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: '{ "data": { "id": 1, "nombre": "Administrador", "email": "admin@multicasa.com" } }'
   *       401:
   *         description: TOKEN_REQUERIDO (no se envió el header) o TOKEN_INVALIDO (firma incorrecta, vencido o admin desactivado)
   *
   * components:
   *   securitySchemes:
   *     bearerAuth:
   *       type: http
   *       scheme: bearer
   *       bearerFormat: JWT
   */
  router.get('/perfil', asyncHandler(authController.perfil));
  router.use('/casas', adminCasaRoutes());
  router.use('/dashboard', dashboardRoutes());

  return router;
}

module.exports = adminRoutes;
