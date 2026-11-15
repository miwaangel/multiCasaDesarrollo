'use strict';

const casas = require('../data/casas');

/** Formas de pago que acepta cada casa (entre 2 y 4, definidas en ../data/casas.js). */
module.exports = {
  async up(queryInterface) {
    const filas = casas.flatMap((casa) =>
      casa.formasPago.map((formaPagoId) => ({ casa_id: casa.id, forma_pago_id: formaPagoId })),
    );

    await queryInterface.bulkInsert('casa_forma_pago', filas);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('casa_forma_pago', { casa_id: casas.map((c) => c.id) });
  },
};
