/**
 * Error de negocio con código HTTP. El middleware errorHandler lo convierte en:
 *   { "error": { "codigo": "NO_ENCONTRADO", "mensaje": "..." } }
 */
class AppError extends Error {
  constructor(status, codigo, mensaje) {
    super(mensaje);
    this.name = 'AppError';
    this.status = status;
    this.codigo = codigo;
  }

  static badRequest(mensaje = 'Solicitud inválida', codigo = 'SOLICITUD_INVALIDA') {
    return new AppError(400, codigo, mensaje);
  }

  static unauthorized(mensaje = 'No autenticado', codigo = 'NO_AUTENTICADO') {
    return new AppError(401, codigo, mensaje);
  }

  static forbidden(mensaje = 'Sin permiso', codigo = 'SIN_PERMISO') {
    return new AppError(403, codigo, mensaje);
  }

  static notFound(mensaje = 'Recurso no encontrado', codigo = 'NO_ENCONTRADO') {
    return new AppError(404, codigo, mensaje);
  }
}

module.exports = AppError;
