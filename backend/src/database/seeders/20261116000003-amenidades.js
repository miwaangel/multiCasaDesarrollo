'use strict';

/** Catálogo de amenidades (copiado de docs/base-de-datos/multicasa_database.sql). */
const amenidades = [
  { id: 1, nombre: 'Cocina integral', tipo: 'interior' },
  { id: 2, nombre: 'Cuarto de servicio', tipo: 'interior' },
  { id: 3, nombre: 'Clósets / vestidor', tipo: 'interior' },
  { id: 4, nombre: 'Aire acondicionado', tipo: 'interior' },
  { id: 5, nombre: 'Calefacción', tipo: 'interior' },
  { id: 6, nombre: 'Estudio', tipo: 'interior' },
  { id: 7, nombre: 'Cuarto de lavado', tipo: 'interior' },
  { id: 8, nombre: 'Chimenea', tipo: 'interior' },
  { id: 9, nombre: 'Jardín', tipo: 'exterior' },
  { id: 10, nombre: 'Alberca', tipo: 'exterior' },
  { id: 11, nombre: 'Terraza', tipo: 'exterior' },
  { id: 12, nombre: 'Asador', tipo: 'exterior' },
  { id: 13, nombre: 'Cochera techada', tipo: 'exterior' },
  { id: 14, nombre: 'Patio de servicio', tipo: 'exterior' },
  { id: 15, nombre: 'Seguridad 24/7', tipo: 'exterior' },
  { id: 16, nombre: 'Área de juegos', tipo: 'exterior' },
  { id: 17, nombre: 'Casa club / gimnasio', tipo: 'exterior' },
];

module.exports = {
  async up(queryInterface) {
    await queryInterface.bulkInsert('amenidades', amenidades);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('amenidades', { id: amenidades.map((a) => a.id) });
  },
};
