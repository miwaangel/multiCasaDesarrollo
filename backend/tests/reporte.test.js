/**
 * Reporte de casas con estatus (issue #17).
 * - ReporteService.resumen y las estrategias PDF / Excel: sin BD.
 * - GET /api/admin/reportes/casas: contra MySQL (base multicasa_test con los seeders).
 */
process.env.JWT_SECRET = 'secreto-solo-para-pruebas';

const ExcelJS = require('exceljs');
const jwt = require('jsonwebtoken');
const request = require('supertest');
const { prepararBaseDePruebas } = require('./helpers/baseDePruebas');
const Database = require('../src/config/Database');
const ReporteService = require('../src/services/ReporteService');
const ReportePdf = require('../src/reportes/ReportePdf');
const ReporteExcel = require('../src/reportes/ReporteExcel');
const app = require('../src/app');

afterAll(() => Database.getInstance().close());

const token = jwt.sign({ id: 1, email: 'admin@multicasa.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const auth = { Authorization: `Bearer ${token}` };

const binario = (res, cb) => {
  const partes = [];
  res.on('data', (p) => partes.push(p));
  res.on('end', () => cb(null, Buffer.concat(partes)));
};
const leerExcel = async (buffer) => {
  const libro = new ExcelJS.Workbook();
  await libro.xlsx.load(buffer);
  return libro;
};

const CASAS = [
  { id: 1, titulo: 'Casa A', tipo: 'casa', colonia: 'Centro', ciudad: 'Saltillo', estado: 'Coahuila', codigoPostal: '25000', precio: 1000000, recamaras: 3, banos: 2, m2Terreno: 100, m2Construccion: 90, estatus: 'venta', destacada: true, fechaVenta: null },
  { id: 2, titulo: 'Casa B', tipo: 'departamento', colonia: 'Obispado', ciudad: 'Monterrey', estado: 'Nuevo León', codigoPostal: '64060', precio: 2500000, recamaras: 2, banos: 1.5, m2Terreno: null, m2Construccion: 80, estatus: 'vendida', destacada: false, fechaVenta: '2026-05-22' },
  { id: 3, titulo: 'Casa C', tipo: 'terreno', colonia: 'Valle', ciudad: 'Saltillo', estado: 'Coahuila', codigoPostal: '25100', precio: 500000, recamaras: 0, banos: 0, m2Terreno: 300, m2Construccion: null, estatus: 'venta', destacada: false, fechaVenta: null },
];

// ------------------------------------------------------------------ sin BD

describe('ReporteService.resumen', () => {
  it('cuenta y suma por estatus', () => {
    expect(ReporteService.resumen(CASAS)).toEqual({
      total: 3,
      enVenta: 2,
      vendidas: 1,
      valorEnVenta: 1500000,
      valorVendido: 2500000,
    });
  });

  it('sin casas todo en 0', () => {
    expect(ReporteService.resumen([])).toMatchObject({ total: 0, valorEnVenta: 0, valorVendido: 0 });
  });
});

describe('Estrategias de formato', () => {
  const datos = { casas: CASAS, resumen: ReporteService.resumen(CASAS), generadoPor: 'admin@multicasa.com' };

  it('PDF: documento válido', async () => {
    const pdf = await new ReportePdf().generar(datos);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('Excel: hoja Casas con una fila por casa y hoja Resumen con fórmulas', async () => {
    const libro = await leerExcel(await new ReporteExcel().generar(datos));
    const casas = libro.getWorksheet('Casas');
    const resumen = libro.getWorksheet('Resumen');

    expect(casas.rowCount).toBe(4); // encabezado + 3
    expect(casas.getCell('B1').value).toBe('Título');
    expect(casas.getCell('H2').value).toBe(1000000);
    expect(casas.getCell('M3').value).toBe('Vendida');
    expect(casas.getCell('O3').value).toBeInstanceOf(Date);
    expect(casas.autoFilter).toBeTruthy();

    const vendidas = resumen.getCell('B6').value;
    expect(vendidas.formula).toBe('COUNTIF(Casas!M2:M4,"Vendida")');
    expect(vendidas.result).toBe(1);
  });
});

// ------------------------------------------------------------------ GET /api/admin/reportes/casas

describe('GET /api/admin/reportes/casas', () => {
  beforeAll(() => prepararBaseDePruebas(), 120000);

  const reporte = (query = {}) => request(app).get('/api/admin/reportes/casas').query(query).set(auth).buffer(true).parse(binario);

  it('sin token → 401', async () => {
    const res = await request(app).get('/api/admin/reportes/casas');
    expect(res.status).toBe(401);
  });

  it('por defecto: PDF descargable', async () => {
    const res = await reporte();

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toMatch(/^attachment; filename="reporte-casas-\d{4}-\d{2}-\d{2}\.pdf"$/);
    expect(res.body.subarray(0, 5).toString()).toBe('%PDF-');
  });

  it('formato=xlsx: todas las casas de la BD, primero en venta y luego vendidas', async () => {
    const res = await reporte({ formato: 'xlsx' });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe(ReporteExcel.contentType);
    expect(res.headers['content-disposition']).toMatch(/\.xlsx"$/);

    const { Casa } = require('../src/models');
    const hoja = (await leerExcel(res.body)).getWorksheet('Casas');
    const estatus = hoja.getColumn('M').values.slice(2);

    expect(estatus).toHaveLength(await Casa.count());
    expect(estatus.indexOf('Vendida')).toBeGreaterThan(estatus.lastIndexOf('En venta'));
  });

  it('estatus=vendida: solo vendidas', async () => {
    const res = await reporte({ formato: 'xlsx', estatus: 'vendida' });

    const hoja = (await leerExcel(res.body)).getWorksheet('Casas');
    const estatus = hoja.getColumn('M').values.slice(2);
    expect(estatus.length).toBeGreaterThan(0);
    expect(new Set(estatus)).toEqual(new Set(['Vendida']));
    expect(res.headers['content-disposition']).toContain('reporte-casas-vendida-');
  });

  it.each([[{ formato: 'csv' }, 'formato'], [{ estatus: 'rentada' }, 'estatus']])('%o → 400', async (query, campo) => {
    const res = await request(app).get('/api/admin/reportes/casas').query(query).set(auth);

    expect(res.status).toBe(400);
    expect(res.body.error.detalles.map((d) => d.campo)).toContain(campo);
  });
});
