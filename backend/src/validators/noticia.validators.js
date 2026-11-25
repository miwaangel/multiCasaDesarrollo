const { body, param, query } = require('express-validator');

/**
 * Reglas de express-validator para noticias, según el modelo físico:
 * titulo VARCHAR(150) y resumen VARCHAR(255) obligatorios, contenido TEXT opcional.
 * Funcionan igual con JSON o con multipart/form-data (cuando se sube imagen).
 */

const vacioANull = (v) => (v === '' ? null : v);

function texto(campo, max, { requerido }) {
  const regla = body(campo);
  return (requerido ? regla.exists({ values: 'null' }).withMessage('Es obligatorio').bail() : regla.optional())
    .isString()
    .trim()
    .notEmpty()
    .withMessage('No puede estar vacío')
    .bail()
    .isLength({ max })
    .withMessage(`Máximo ${max} caracteres`);
}

function camposNoticia({ requerido }) {
  return [
    texto('titulo', 150, { requerido }),
    texto('resumen', 255, { requerido }),
    body('contenido').customSanitizer(vacioANull).optional({ values: 'null' }).isString().trim(),
    body('activa').optional().isBoolean().withMessage('Debe ser true o false').toBoolean(true),
  ];
}

const idParam = param('id').isInt({ min: 1 }).withMessage('Debe ser un id válido').toInt();

module.exports = {
  reglaId: [idParam],
  reglasCrear: camposNoticia({ requerido: true }),
  reglasActualizar: [idParam, ...camposNoticia({ requerido: false })],
  reglasListaPublica: [
    query('limite').optional().isInt({ min: 1, max: 50 }).withMessage('Debe ser un entero entre 1 y 50').toInt(),
  ],
  reglasListaAdmin: [
    query('pagina').optional().isInt({ min: 1 }).withMessage('Debe ser un entero mayor o igual a 1').toInt(),
    query('limite').optional().isInt({ min: 1, max: 50 }).withMessage('Debe ser un entero entre 1 y 50').toInt(),
  ],
};
