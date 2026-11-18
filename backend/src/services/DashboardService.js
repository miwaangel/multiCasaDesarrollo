const DashboardRepository = require('../repositories/DashboardRepository');

/**
 * Los 5 rangos de la vista v_casas_por_rango_precio, con el mismo texto y orden.
 * Si se cambian los rangos en la vista (nueva migración) hay que cambiarlos aquí también.
 */
const RANGOS_PRECIO = Object.freeze([
  { orden: 1, rango: 'Menos de $1 M' },
  { orden: 2, rango: '$1 M - $2 M' },
  { orden: 3, rango: '$2 M - $4 M' },
  { orden: 4, rango: '$4 M - $7 M' },
  { orden: 5, rango: 'Más de $7 M' },
]);

const ESTATUS = Object.freeze(['venta', 'vendida']);

/**
 * Datos para las gráficas del dashboard. Las vistas solo regresan los grupos que tienen casas
 * (GROUP BY no inventa filas), así que aquí se completan los grupos vacíos con 0 para que la
 * gráfica siempre tenga las mismas barras / rebanadas en el mismo orden.
 */
class DashboardService {
  constructor(repository = new DashboardRepository()) {
    this.repository = repository;
  }

  /** Siempre los 5 rangos en orden: [{ rango, orden, total }]. */
  async rangosPrecio() {
    const filas = await this.repository.findRangosPrecio();
    const totalPorOrden = new Map(filas.map((f) => [Number(f.orden), Number(f.total)]));
    return RANGOS_PRECIO.map(({ orden, rango }) => ({ rango, orden, total: totalPorOrden.get(orden) ?? 0 }));
  }

  /** Siempre venta y vendida: { venta, vendida, total }. */
  async estatus() {
    const filas = await this.repository.findPorEstatus();
    const conteo = Object.fromEntries(ESTATUS.map((e) => [e, 0]));
    for (const { estatus, total } of filas) {
      if (estatus in conteo) {
        conteo[estatus] = Number(total);
      }
    }
    return { ...conteo, total: conteo.venta + conteo.vendida };
  }
}

module.exports = { DashboardService, RANGOS_PRECIO };
