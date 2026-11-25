const { body, param, query } = require('express-validator');

/**
 * Reglas de express-validator para casas, según el modelo físico
 * (docs/base-de-datos/multicasa_database.sql).
 *
 * En multipart/form-data todo llega como texto: además de validar, cada regla convierte
 * el valor (toFloat, toInt, toBoolean, arreglo de ids) para que el service reciba tipos reales.
 * Un campo opcional enviado vacío ("m2Construccion=") se guarda como null.
 */

const TIPOS = ['casa', 'departamento', 'terreno'];
const ESTATUS = ['venta', 'vendida'];
const ORIENTACIONES = ['norte', 'sur', 'oriente', 'poniente'];

const vacioANull = (v) => (v === '' ? null : v);

/**
 * Acepta ids como arreglo (amenidadIds[]=1&amenidadIds[]=2 o el mismo campo repetido),
 * como JSON ("[1,2]") o separados por comas ("1,2"). Vacío = [] (quita todas).
 */
function aArregloDeIds(valor) {
  if (valor === undefined) {
    return undefined;
  }
  let lista = valor;
  if (typeof valor === 'string') {
    const texto = valor.trim();
    if (texto.startsWith('[')) {
      try {
        lista = JSON.parse(texto);
      } catch {
        return valor; // no es JSON válido: la validación lo rechaza
      }
    } else {
      lista = texto === '' ? [] : texto.split(',');
    }
  }
  const ids = [].concat(lista).map((id) => Number(String(id).trim()));
  return [...new Set(ids)];
}

const sonIdsValidos = (ids) => Array.isArray(ids) && ids.every((id) => Number.isInteger(id) && id > 0);

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

function decimal(campo, opciones, mensaje, { requerido = false, nulo = false } = {}) {
  let regla = body(campo);
  if (requerido) {
    regla = regla.exists({ values: 'null' }).withMessage('Es obligatorio').bail();
  } else if (nulo) {
    regla = regla.customSanitizer(vacioANull).optional({ values: 'null' });
  } else {
    regla = regla.optional();
  }
  return regla.isFloat(opciones).withMessage(mensaje).bail().toFloat();
}

function enteroNoNegativo(campo, max = 255) {
  return body(campo)
    .optional()
    .isInt({ min: 0, max })
    .withMessage(`Debe ser un número entero entre 0 y ${max}`)
    .toInt();
}

function camposCasa({ requerido }) {
  const req = { requerido };
  return [
    texto('titulo', 150, req),
    body('descripcion').customSanitizer(vacioANull).optional({ values: 'null' }).isString().trim(),
    body('tipo').optional().isIn(TIPOS).withMessage(`Debe ser: ${TIPOS.join(', ')}`),
    decimal('precio', { gt: 0, max: 9999999999.99 }, 'Debe ser un número mayor a 0', req),
    body('estatus').optional().isIn(ESTATUS).withMessage(`Debe ser: ${ESTATUS.join(', ')}`),
    body('destacada').optional().isBoolean().withMessage('Debe ser true o false').toBoolean(true),
    texto('direccion', 200, req),
    texto('colonia', 100, req),
    texto('ciudad', 100, req),
    texto('estado', 100, req),
    (requerido ? body('codigoPostal').exists({ values: 'null' }).withMessage('Es obligatorio').bail() : body('codigoPostal').optional())
      .trim()
      .matches(/^[0-9]{5}$/)
      .withMessage('Debe tener 5 dígitos'),
    decimal('lat', { min: -90, max: 90 }, 'Debe ser una latitud entre -90 y 90', req),
    decimal('lng', { min: -180, max: 180 }, 'Debe ser una longitud entre -180 y 180', req),
    decimal('m2Terreno', { min: 0, max: 99999999.99 }, 'Debe ser un número no negativo', { nulo: true }),
    decimal('m2Construccion', { min: 0, max: 99999999.99 }, 'Debe ser un número no negativo', { nulo: true }),
    enteroNoNegativo('recamaras'),
    decimal('banos', { min: 0, max: 99.5 }, 'Debe ser un número no negativo (ej. 2.5)'),
    enteroNoNegativo('estacionamientos'),
    enteroNoNegativo('plantas'),
    body('orientacion')
      .customSanitizer(vacioANull)
      .optional({ values: 'null' })
      .isIn(ORIENTACIONES)
      .withMessage(`Debe ser: ${ORIENTACIONES.join(', ')}`),
    body('amenidadIds')
      .customSanitizer(aArregloDeIds)
      .optional()
      .custom(sonIdsValidos)
      .withMessage('Debe ser una lista de ids de amenidades'),
    body('formaPagoIds')
      .customSanitizer(aArregloDeIds)
      .optional()
      .custom(sonIdsValidos)
      .withMessage('Debe ser una lista de ids de formas de pago'),
  ];
}

const idParam = (nombre = 'id') => param(nombre).isInt({ min: 1 }).withMessage('Debe ser un id válido').toInt();

module.exports = {
  reglaId: [idParam()],
  reglasImagen: [idParam(), idParam('imagenId')],
  reglasCrear: camposCasa({ requerido: true }),
  reglasActualizar: [idParam(), ...camposCasa({ requerido: false })],
  reglasEstatus: [
    idParam(),
    body('estatus').exists().withMessage('Es obligatorio').bail().isIn(ESTATUS).withMessage(`Debe ser: ${ESTATUS.join(', ')}`),
  ],
  reglasListado: [
    query('estatus').optional().isIn(ESTATUS).withMessage(`Debe ser: ${ESTATUS.join(', ')}`),
    query('busqueda').optional().isString().trim().isLength({ max: 100 }).withMessage('Máximo 100 caracteres'),
    query('pagina').optional().isInt({ min: 1 }).withMessage('Debe ser un entero mayor o igual a 1').toInt(),
    query('limite').optional().isInt({ min: 1, max: 50 }).withMessage('Debe ser un entero entre 1 y 50').toInt(),
  ],
};
