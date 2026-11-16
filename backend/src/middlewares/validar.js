const { validationResult } = require('express-validator');
const AppError = require('../utils/AppError');

/**
 * Corre las reglas de express-validator y, si alguna falla, responde 400:
 *   { error: { codigo: "DATOS_INVALIDOS", mensaje, detalles: [{ campo, mensaje }] } }
 *
 * Uso: router.post('/login', validar(reglasLogin), handler);
 */
function validar(reglas) {
  return async (req, res, next) => {
    // Una tras otra para que los detalles salgan en el orden de las reglas
    for (const regla of reglas) {
      await regla.run(req);
    }

    const errores = validationResult(req);
    if (errores.isEmpty()) {
      return next();
    }

    const detalles = errores.array({ onlyFirstError: true }).map((e) => ({ campo: e.path, mensaje: e.msg }));
    return next(new AppError(400, 'DATOS_INVALIDOS', 'Revisa los datos enviados', detalles));
  };
}

module.exports = validar;
