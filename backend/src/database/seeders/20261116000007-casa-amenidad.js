'use strict';

const casas = require('../data/casas');

/** Amenidades de cada casa (entre 4 y 8, definidas en ../data/casas.js). */
module.exports = {
  async up(queryInterface) {
    const filas = casas.flatMap((casa) =>
      casa.amenidades.map((amenidadId) => ({ casa_id: casa.id, amenidad_id: amenidadId })),
    );

    await queryInterface.bulkInsert('casa_amenidad', filas);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('casa_amenidad', { casa_id: casas.map((c) => c.id) });
  },
};
