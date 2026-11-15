'use strict';

const casas = require('../data/casas');

/**
 * 2 imágenes por casa: /uploads/seed/casa-XX-1.jpg (portada) y casa-XX-2.jpg.
 * Los archivos están en backend/uploads/seed/.
 */
const imagenes = casas.flatMap((casa) => {
  const xx = String(casa.id).padStart(2, '0');
  return [1, 2].map((n) => ({
    id: (casa.id - 1) * 2 + n,
    casa_id: casa.id,
    url: `/uploads/seed/casa-${xx}-${n}.jpg`,
    orden: n,
    es_portada: n === 1,
    creado_en: casa.creado_en,
  }));
});

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('imagenes_casa', imagenes);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('imagenes_casa', { id: imagenes.map((i) => i.id) });
  },
};
