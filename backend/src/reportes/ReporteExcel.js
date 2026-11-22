const ExcelJS = require('exceljs');
const { COLORES } = require('../pdf/DocumentoPdf');
const { ESTATUS, TIPOS } = require('./formato');

const argb = (hex) => `FF${hex.replace('#', '').toUpperCase()}`;
const MONEDA = '"$"#,##0';

/**
 * Estrategia Excel del reporte de casas:
 * - Hoja "Casas": una fila por casa, con filtros, encabezado fijo, precio con formato de moneda
 *   y las vendidas resaltadas.
 * - Hoja "Resumen": totales con fórmulas (COUNTIF / SUMIF) sobre la hoja "Casas", así que
 *   se recalculan si alguien edita o filtra los datos.
 */
class ReporteExcel {
  static extension = 'xlsx';
  static contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

  async generar({ casas, resumen, generadoPor }) {
    const libro = new ExcelJS.Workbook();
    libro.creator = 'MultiCasa';
    libro.created = new Date();

    this.#hojaCasas(libro, casas);
    this.#hojaResumen(libro, casas.length, resumen, generadoPor);

    return Buffer.from(await libro.xlsx.writeBuffer());
  }

  #hojaCasas(libro, casas) {
    const hoja = libro.addWorksheet('Casas', { views: [{ state: 'frozen', ySplit: 1 }] });
    hoja.columns = [
      { header: 'ID', key: 'id', width: 6 },
      { header: 'Título', key: 'titulo', width: 42 },
      { header: 'Tipo', key: 'tipo', width: 14 },
      { header: 'Colonia', key: 'colonia', width: 24 },
      { header: 'Ciudad', key: 'ciudad', width: 22 },
      { header: 'Estado', key: 'estado', width: 16 },
      { header: 'C.P.', key: 'codigoPostal', width: 8 },
      { header: 'Precio', key: 'precio', width: 15, style: { numFmt: MONEDA } },
      { header: 'Recámaras', key: 'recamaras', width: 11 },
      { header: 'Baños', key: 'banos', width: 8 },
      { header: 'm² terreno', key: 'm2Terreno', width: 12 },
      { header: 'm² construcción', key: 'm2Construccion', width: 16 },
      { header: 'Estatus', key: 'estatus', width: 11 },
      { header: 'Destacada', key: 'destacada', width: 11 },
      { header: 'Fecha de venta', key: 'fechaVenta', width: 15, style: { numFmt: 'dd/mm/yyyy' } },
    ];

    casas.forEach((c) => {
      const fila = hoja.addRow({
        ...c,
        tipo: TIPOS[c.tipo] ?? c.tipo,
        precio: Number(c.precio),
        estatus: ESTATUS[c.estatus],
        destacada: c.destacada ? 'Sí' : 'No',
        // DATEONLY a mediodía UTC para que Excel no la cambie de día por la zona horaria
        fechaVenta: c.fechaVenta ? new Date(`${c.fechaVenta}T12:00:00Z`) : null,
      });
      if (c.estatus === 'vendida') {
        fila.eachCell({ includeEmpty: true }, (celda) => {
          celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF6EAD9' } };
        });
      }
    });

    const encabezado = hoja.getRow(1);
    encabezado.height = 20;
    encabezado.eachCell((celda) => {
      celda.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: argb(COLORES.secundario) } };
      celda.alignment = { vertical: 'middle' };
    });
    hoja.autoFilter = { from: 'A1', to: { row: 1, column: hoja.columns.length } };
  }

  #hojaResumen(libro, filas, resumen, generadoPor) {
    const hoja = libro.addWorksheet('Resumen');
    hoja.columns = [{ width: 24 }, { width: 20 }];

    hoja.addRow(['Reporte de casas — MultiCasa']).font = { bold: true, size: 14, color: { argb: argb(COLORES.primario) } };
    hoja.addRow([`Generado por ${generadoPor} el ${new Date().toLocaleString('es-MX', { timeZone: 'America/Monterrey' })}`])
      .font = { italic: true, color: { argb: argb(COLORES.suave) } };
    hoja.addRow([]);

    // Fórmulas sobre la hoja Casas (M = Estatus, H = Precio); "result" es el valor ya calculado
    const ultima = filas + 1;
    const rango = (col) => `Casas!${col}2:${col}${Math.max(ultima, 2)}`;
    const datos = [
      ['Total de casas', { formula: `COUNTA(${rango('A')})`, result: resumen.total }],
      ['En venta', { formula: `COUNTIF(${rango('M')},"En venta")`, result: resumen.enVenta }],
      ['Vendidas', { formula: `COUNTIF(${rango('M')},"Vendida")`, result: resumen.vendidas }],
      ['Valor en venta', { formula: `SUMIF(${rango('M')},"En venta",${rango('H')})`, result: resumen.valorEnVenta }],
      ['Valor vendido', { formula: `SUMIF(${rango('M')},"Vendida",${rango('H')})`, result: resumen.valorVendido }],
    ];
    datos.forEach(([etiqueta, valor], i) => {
      const fila = hoja.addRow([etiqueta, valor]);
      fila.getCell(1).font = { bold: true };
      if (i >= 3) fila.getCell(2).numFmt = MONEDA;
    });
  }
}

module.exports = ReporteExcel;
