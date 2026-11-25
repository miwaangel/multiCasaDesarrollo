const { DocumentoPdf } = require('../pdf/DocumentoPdf');
const { dinero, ESTATUS, TIPOS, fecha } = require('./formato');

/** Estrategia PDF del reporte de casas: hoja horizontal con resumen y tabla. */
class ReportePdf {
  static extension = 'pdf';
  static contentType = 'application/pdf';

  async generar({ casas, resumen, generadoPor, filtro }) {
    const documento = new DocumentoPdf({ titulo: 'Reporte de casas', horizontal: true })
      .encabezado(`Generado por ${generadoPor}${filtro ? ` · Solo ${ESTATUS[filtro].toLowerCase()}` : ''}`)
      .seccion('Resumen')
      .datos(
        [
          ['Total de casas', resumen.total],
          ['En venta', resumen.enVenta],
          ['Vendidas', resumen.vendidas],
          ['Valor en venta', dinero(resumen.valorEnVenta)],
          ['Valor vendido', dinero(resumen.valorVendido)],
        ],
        { columnas: 5 },
      )
      .seccion(`Listado (${casas.length})`)
      .tabla(
        [
          { titulo: 'ID', ancho: 0.6, alinear: 'center' },
          { titulo: 'Título', ancho: 3.8 },
          { titulo: 'Tipo', ancho: 1.9 },
          { titulo: 'Colonia', ancho: 2.2 },
          { titulo: 'Ciudad', ancho: 2.2 },
          { titulo: 'Rec.', ancho: 0.7, alinear: 'center' },
          { titulo: 'Baños', ancho: 0.9, alinear: 'center' },
          { titulo: 'Precio', ancho: 1.8, alinear: 'right' },
          { titulo: 'Estatus', ancho: 1.2, alinear: 'center' },
          { titulo: 'Vendida el', ancho: 1.5, alinear: 'center' },
        ],
        casas.map((c) => [
          c.id,
          c.titulo,
          TIPOS[c.tipo] ?? c.tipo,
          c.colonia,
          c.ciudad,
          c.recamaras,
          c.banos,
          dinero(c.precio),
          ESTATUS[c.estatus],
          fecha(c.fechaVenta) || '—',
        ]),
        // Vendidas en ámbar claro para distinguirlas de un vistazo
        { colorFila: (i) => (casas[i].estatus === 'vendida' ? '#f6ead9' : null) },
      );

    return documento.aBuffer();
  }
}

module.exports = ReportePdf;
