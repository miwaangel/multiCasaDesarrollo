/**
 * Envuelve un handler async para que los errores lleguen al errorHandler
 * sin escribir try/catch en cada controlador (Express 4 no lo hace solo).
 */
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

module.exports = asyncHandler;
