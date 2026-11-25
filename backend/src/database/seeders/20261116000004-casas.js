'use strict';

const casas = require('../data/casas');

/** 20 casas de prueba en Saltillo, Ramos Arizpe, Monterrey y San Pedro (datos en ../data/casas.js). */
module.exports = {
  async up(queryInterface) {
    const filas = casas.map(({ formasPago, amenidades, ...casa }) => ({
      ...casa,
      creado_por: 1,
      // Las vendidas se actualizaron por última vez al marcarse como vendidas
      actualizado_en: casa.fecha_venta ? `${casa.fecha_venta} 12:00:00` : casa.creado_en,
    }));

    await queryInterface.bulkInsert('casas', filas);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('casas', { id: casas.map((c) => c.id) });
  },
};
