const { QueryTypes } = require('sequelize');
const Database = require('../config/Database');

/**
 * Lee las vistas del dashboard (creadas en la migración 20261115000011-crear-vistas-dashboard).
 * No hereda de BaseRepository porque no trabaja con un modelo (tabla) sino con vistas,
 * así que usa SQL directo con sequelize.query. Recibe la conexión única del Singleton.
 */
class DashboardRepository {
  constructor(sequelize = Database.getInstance().sequelize) {
    this.sequelize = sequelize;
  }

  /** Filas de v_casas_por_rango_precio: [{ rango, orden, total }] (solo rangos con casas). */
  findRangosPrecio() {
    return this.sequelize.query('SELECT rango, orden, total FROM v_casas_por_rango_precio ORDER BY orden', {
      type: QueryTypes.SELECT,
    });
  }

  /** Filas de v_casas_por_estatus: [{ estatus, total }] (solo estatus con casas). */
  findPorEstatus() {
    return this.sequelize.query('SELECT estatus, total FROM v_casas_por_estatus', {
      type: QueryTypes.SELECT,
    });
  }
}

module.exports = DashboardRepository;
