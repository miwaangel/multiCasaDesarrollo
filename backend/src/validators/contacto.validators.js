const { body } = require('express-validator');

/** Valores de la columna mensajes_contacto.asunto (ENUM) y cómo se muestran. */
const ASUNTOS = Object.freeze({
  informacion: 'Solicitar información',
  vender: 'Quiero vender mi casa',
  construir: 'Construir',
  mudanzas: 'Mudanzas',
  seguros: 'Seguros',
  otro: 'Otro',
});

/** Reglas de POST /api/contacto, con los límites de la tabla mensajes_contacto. */
const reglasContacto = [
  body('nombre')
    .exists({ values: 'falsy' })
    .withMessage('Escribe tu nombre')
    .bail()
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('El nombre debe tener entre 2 y 100 caracteres'),

  body('email')
    .exists({ values: 'falsy' })
    .withMessage('Escribe tu correo')
    .bail()
    .isString()
    .trim()
    .isLength({ max: 150 })
    .withMessage('Máximo 150 caracteres')
    .bail()
    .isEmail()
    .withMessage('El correo no es válido'),

  body('telefono')
    .optional({ values: 'falsy' })
    .isString()
    .trim()
    .matches(/^[0-9+()\s-]{7,20}$/)
    .withMessage('El teléfono solo puede tener números, espacios y + ( ) - (7 a 20 caracteres)'),

  body('asunto')
    .optional({ values: 'falsy' })
    .isIn(Object.keys(ASUNTOS))
    .withMessage(`El asunto debe ser: ${Object.keys(ASUNTOS).join(', ')}`),

  body('mensaje')
    .exists({ values: 'falsy' })
    .withMessage('Escribe tu mensaje')
    .bail()
    .isString()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('El mensaje debe tener entre 10 y 2000 caracteres'),

  body('casaId')
    .optional({ values: 'null' })
    .isInt({ min: 1 })
    .withMessage('casaId debe ser un número entero')
    .toInt(),
];

module.exports = { reglasContacto, ASUNTOS };
