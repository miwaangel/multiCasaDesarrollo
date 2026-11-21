const CasaRepository = require('../repositories/CasaRepository');
const ReportePdf = require('../reportes/ReportePdf');
const ReporteExcel = require('../reportes/ReporteExcel');

/**
 * Reporte de todas las casas con su estatus (issue #17).
 *
 * Patrón Strategy: cada formato es una clase con generar(datos) y su extensión / content-type.
 * Para agregar otro formato (por ejemplo CSV) basta con crear la clase y registrarla aquí;
 * el service, el controller y la ruta no cambian.
 */
const FORMATOS = Object.freeze({ pdf: ReportePdf, xlsx: ReporteExcel });

class ReporteService {
  static FORMATOS = Object.keys(FORMATOS);

  constructor({ casaRepository = new CasaRepository() } = {}) {
    this.casas = casaRepository;
  }

  /** Regresa { pdf/xlsx Buffer, nombreArchivo, contentType }. */
  async reporteCasas({ formato = 'pdf', estatus, generadoPor = 'administrador' } = {}) {
    const Estrategia = FORMATOS[formato];
    const casas = await this.casas.findParaReporte({ estatus });
    const resumen = ReporteService.resumen(casas);

    const archivo = await new Estrategia().generar({ casas, resumen, generadoPor, filtro: estatus });
    const hoy = new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Monterrey' });

    return {
      archivo,
      contentType: Estrategia.contentType,
      nombreArchivo: `reporte-casas${estatus ? `-${estatus}` : ''}-${hoy}.${Estrategia.extension}`,
    };
  }

  /** Conteos y valores por estatus. */
  static resumen(casas) {
    const suma = (lista) => lista.reduce((total, c) => total + Number(c.precio), 0);
    const enVenta = casas.filter((c) => c.estatus === 'venta');
    const vendidas = casas.filter((c) => c.estatus === 'vendida');
    return {
      total: casas.length,
      enVenta: enVenta.length,
      vendidas: vendidas.length,
      valorEnVenta: suma(enVenta),
      valorVendido: suma(vendidas),
    };
  }
}

module.exports = ReporteService;
