'use strict';

/** Catálogo de formas de pago (copiado de docs/base-de-datos/multicasa_database.sql). */
const formasPago = [
  {
    id: 1,
    nombre: 'Contado',
    descripcion: 'Pago total en una sola exhibición o en parcialidades directas.',
    requisitos:
      'Identificación oficial vigente (INE o pasaporte)\nComprobante de domicilio reciente\nRFC / Constancia de situación fiscal\nAcreditación del origen de los recursos',
  },
  {
    id: 2,
    nombre: 'Crédito bancario',
    descripcion: 'Crédito hipotecario con instituciones bancarias.',
    requisitos:
      'Identificación oficial vigente\nComprobantes de ingresos de los últimos 3 meses\nEnganche de 10% a 20% del valor de la vivienda\nHistorial crediticio favorable\nAntigüedad laboral mínima de 1 año',
  },
  {
    id: 3,
    nombre: 'Infonavit',
    descripcion: 'Crédito para trabajadores afiliados al IMSS.',
    requisitos:
      'Relación laboral vigente con cotización al IMSS\nPuntos mínimos requeridos por Infonavit\nPrecalificación en Mi Cuenta Infonavit\nCurso "Saber para decidir"',
  },
  {
    id: 4,
    nombre: 'Fovissste',
    descripcion: 'Crédito para trabajadores del Estado afiliados al ISSSTE.',
    requisitos:
      'Ser trabajador en activo afiliado al ISSSTE\nCotización mínima de 18 meses\nRegistro en el sistema de puntaje del Fovissste\nIdentificación oficial vigente',
  },
  {
    id: 5,
    nombre: 'Cofinavit',
    descripcion: 'Combinación de crédito Infonavit con crédito bancario.',
    requisitos:
      'Requisitos de Infonavit y del banco participante\nComprobantes de ingresos\nPrecalificación en ambas instituciones',
  },
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('formas_pago', formasPago);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('formas_pago', { id: formasPago.map((f) => f.id) });
  },
};
