'use strict';

/** Vistas del dashboard: casas por rango de precio y casas por estatus. */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW v_casas_por_rango_precio AS
      SELECT rango, orden, COUNT(*) AS total
      FROM (
          SELECT CASE
                   WHEN precio <  1000000 THEN 'Menos de $1 M'
                   WHEN precio <  2000000 THEN '$1 M - $2 M'
                   WHEN precio <  4000000 THEN '$2 M - $4 M'
                   WHEN precio <  7000000 THEN '$4 M - $7 M'
                   ELSE 'Más de $7 M'
                 END AS rango,
                 CASE
                   WHEN precio <  1000000 THEN 1
                   WHEN precio <  2000000 THEN 2
                   WHEN precio <  4000000 THEN 3
                   WHEN precio <  7000000 THEN 4
                   ELSE 5
                 END AS orden
          FROM casas
      ) t
      GROUP BY rango, orden
      ORDER BY orden
    `);

    await queryInterface.sequelize.query(`
      CREATE OR REPLACE VIEW v_casas_por_estatus AS
      SELECT estatus, COUNT(*) AS total
      FROM casas
      GROUP BY estatus
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP VIEW IF EXISTS v_casas_por_estatus');
    await queryInterface.sequelize.query('DROP VIEW IF EXISTS v_casas_por_rango_precio');
  },
};
