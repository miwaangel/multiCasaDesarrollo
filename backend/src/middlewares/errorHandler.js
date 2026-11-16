const env = require('../config/env');
const AppError = require('../utils/AppError');

/**
 * Formato único de error de la API: { error: { codigo, mensaje } }.
 * Debe registrarse al final, después de todas las rutas.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    const error = { codigo: err.codigo, mensaje: err.message };
    if (err.detalles) {
      error.detalles = err.detalles;
    }
    return res.status(err.status).json({ error });
  }

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    const mensaje = err.errors?.map((e) => e.message).join(', ') || 'Datos inválidos';
    return res.status(400).json({ error: { codigo: 'VALIDACION', mensaje } });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { codigo: 'JSON_INVALIDO', mensaje: 'El cuerpo no es JSON válido' } });
  }

  if (env.nodeEnv !== 'test') {
    console.error(err);
  }
  return res.status(500).json({ error: { codigo: 'ERROR_INTERNO', mensaje: 'Error interno del servidor' } });
}

module.exports = errorHandler;
