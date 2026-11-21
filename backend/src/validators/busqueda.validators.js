const { query } = require('express-validator');

/**
 * Reglas de GET /api/casas/buscar.
 *
 * Todos los filtros son opcionales. Un filtro vacío ("Todos" / "No importa" / "Sin rango"
 * en el formulario) se ignora. Cada regla convierte el texto de la URL a número para
 * que el service reciba tipos reales.
 */

const RADIOS_KM = [2, 5, 10, 20];
const opcional = { values: 'falsy' }; // '' o ausente = sin filtro

const reglasBusqueda = [
  query('ubicacion')
    .optional(opcional)
    .isString()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Escribe un C.P. de 5 dígitos o el nombre de una ciudad')
    .bail()
    // Solo letras, números, espacios y . , ' - (evita comodines de LIKE como % y _)
    .matches(/^[\p{L}\d .,'-]+$/u)
    .withMessage('Escribe un C.P. de 5 dígitos o el nombre de una ciudad'),

  query('radioKm')
    .optional(opcional)
    .isInt()
    .withMessage(`El radio debe ser ${RADIOS_KM.join(', ')} km`)
    .bail()
    .toInt()
    .isIn(RADIOS_KM)
    .withMessage(`El radio debe ser ${RADIOS_KM.join(', ')} km`)
    .bail()
    .custom((_, { req }) => Boolean(req.query.ubicacion))
    .withMessage('Para buscar por radio escribe un C.P. o una ciudad'),

  query('precioMin')
    .optional(opcional)
    .isFloat({ min: 0 })
    .withMessage('El precio mínimo debe ser un número positivo')
    .toFloat(),

  query('precioMax')
    .optional(opcional)
    .isFloat({ min: 0 })
    .withMessage('El precio máximo debe ser un número positivo')
    .bail()
    .toFloat()
    .custom((max, { req }) => req.query.precioMin === undefined || Number(req.query.precioMin) <= max)
    .withMessage('El precio máximo debe ser mayor o igual al mínimo'),

  query('recamaras')
    .optional(opcional)
    .isInt({ min: 0, max: 50 })
    .withMessage('Recámaras debe ser un número entero')
    .toInt(),

  query('banos')
    .optional(opcional)
    .isFloat({ min: 0, max: 50 })
    .withMessage('Baños debe ser un número')
    .toFloat(),
];

module.exports = { reglasBusqueda, RADIOS_KM };
