const AppError = require('../utils/AppError');
const AuthService = require('../services/AuthService');

/**
 * Protege rutas de administrador. Espera el header:
 *   Authorization: Bearer <token>
 * Si el token es válido deja { id, email } en req.admin y continúa.
 *   sin token          → 401 TOKEN_REQUERIDO
 *   inválido o vencido → 401 TOKEN_INVALIDO
 *
 * Uso: router.use(authMiddleware());
 */
function authMiddleware(authService = new AuthService()) {
  return (req, res, next) => {
    const [tipo, token] = (req.headers.authorization || '').split(' ');

    if (tipo !== 'Bearer' || !token) {
      return next(AppError.unauthorized('Inicia sesión para continuar', 'TOKEN_REQUERIDO'));
    }

    try {
      req.admin = authService.verificarToken(token);
      return next();
    } catch (err) {
      return next(err);
    }
  };
}

module.exports = authMiddleware;
