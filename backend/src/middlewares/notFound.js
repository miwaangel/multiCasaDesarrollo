const AppError = require('../utils/AppError');

function notFound(req, res, next) {
  next(AppError.notFound(`Ruta ${req.method} ${req.originalUrl} no existe`, 'RUTA_NO_ENCONTRADA'));
}

module.exports = notFound;
