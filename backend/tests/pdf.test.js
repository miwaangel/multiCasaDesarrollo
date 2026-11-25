/**
 * Ficha técnica en PDF (issue #15).
 * - DocumentoPdf (Builder) y FichaPdfService.contenido: sin BD.
 * - GET /api/casas/:id/pdf: contra MySQL (base multicasa_test con los seeders).
 */
const request = require('supertest');
const { prepararBaseDePruebas } = require('./helpers/baseDePruebas');
const Database = require('../src/config/Database');
const { DocumentoPdf } = require('../src/pdf/DocumentoPdf');
const FichaPdfService = require('../src/services/FichaPdfService');
const app = require('../src/app');

afterAll(() => Database.getInstance().close());

/** Número de páginas de un PDF de pdfkit (objetos "/Type /Page", sin contar "/Pages"). */
const paginas = (pdf) => (pdf.toString('latin1').match(/\/Type \/Page\b(?!s)/g) || []).length;

/** Supertest junta la respuesta binaria en un Buffer. */
const binario = (res, cb) => {
  const partes = [];
  res.on('data', (p) => partes.push(p));
  res.on('end', () => cb(null, Buffer.concat(partes)));
};

// ------------------------------------------------------------------ DocumentoPdf

describe('DocumentoPdf (Builder)', () => {
  it('encadena pasos y regresa un PDF válido', async () => {
    const pdf = await new DocumentoPdf({ titulo: 'Prueba' })
      .encabezado('Subtítulo')
      .titular('Casa de prueba', { subtitulo: 'Saltillo', destacado: '$1,000,000' })
      .etiqueta('EN VENTA')
      .imagen('/no/existe.jpg') // se omite sin error
      .seccion('Datos')
      .datos([['Recámaras', 3], ['Baños', 2], ['Plantas', null]])
      .lista(['Jardín', 'Cocina'], { columnas: 2 })
      .lista([], { vacio: 'Nada' })
      .bloques([{ titulo: 'Contado', texto: 'Pago en una exhibición' }])
      .enlace('Mapa', 'https://www.openstreetmap.org')
      .aBuffer();

    expect(Buffer.isBuffer(pdf)).toBe(true);
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');
    expect(paginas(pdf)).toBe(1);
  });

  it('una tabla larga continúa en otras páginas', async () => {
    const filas = Array.from({ length: 80 }, (_, i) => [i + 1, `Casa ${i + 1}`, '$1,000,000']);
    const pdf = await new DocumentoPdf({ titulo: 'Reporte', horizontal: true })
      .encabezado()
      .tabla([{ titulo: '#', ancho: 1 }, { titulo: 'Título', ancho: 4 }, { titulo: 'Precio', ancho: 2, alinear: 'right' }], filas)
      .aBuffer();

    expect(paginas(pdf)).toBeGreaterThan(1);
  });
});

// ------------------------------------------------------------------ FichaPdfService.contenido

describe('FichaPdfService.contenido', () => {
  const casa = {
    id: 1,
    tipo: 'casa',
    precio: 1850000,
    colonia: 'Centro',
    ciudad: 'Saltillo',
    estado: 'Coahuila',
    direccion: 'Calle 1',
    codigoPostal: '25000',
    lat: 25.4,
    lng: -101,
    m2Terreno: 180,
    m2Construccion: null,
    recamaras: 3,
    banos: 2.5,
    estacionamientos: 1,
    plantas: 2,
    orientacion: 'norte',
    imagenes: [{ url: '/uploads/seed/a.jpg', esPortada: false }, { url: '/uploads/seed/b.jpg', esPortada: true }],
    amenidades: [{ nombre: 'Cocina', tipo: 'interior' }, { nombre: 'Jardín', tipo: 'exterior' }],
    formasPago: [{ nombre: 'Infonavit', descripcion: 'Crédito', requisitos: 'Cotizar en el IMSS' }],
  };

  it('arma los datos de la ficha con el formato correcto', () => {
    const ficha = FichaPdfService.contenido(casa);

    expect(ficha.portada).toBe('/uploads/seed/b.jpg');
    expect(ficha.ubicacion).toBe('Centro, Saltillo, Coahuila');
    expect(ficha.caracteristicas).toEqual(expect.arrayContaining([
      ['Terreno', '180 m2'],
      ['Construcción', '—'],
      ['Orientación', 'Norte'],
      ['Precio', '$1,850,000 MXN'],
    ]));
    expect(ficha.interiores).toEqual(['Cocina']);
    expect(ficha.exteriores).toEqual(['Jardín']);
    expect(ficha.formasPago[0]).toEqual({ titulo: 'Infonavit', texto: 'Crédito\nRequisitos: Cotizar en el IMSS' });
    expect(ficha.mapa).toContain('mlat=25.4&mlon=-101');
  });

  it('sin imágenes ni amenidades no truena', () => {
    const ficha = FichaPdfService.contenido({ ...casa, imagenes: [], amenidades: undefined, formasPago: undefined });

    expect(ficha.portada).toBeNull();
    expect(ficha.interiores).toEqual([]);
    expect(ficha.formasPago).toEqual([]);
  });
});

// ------------------------------------------------------------------ GET /api/casas/:id/pdf

describe('GET /api/casas/:id/pdf', () => {
  beforeAll(() => prepararBaseDePruebas(), 120000);

  it('200: PDF de una casa en venta, para ver en el navegador', async () => {
    const res = await request(app).get('/api/casas/1/pdf').buffer(true).parse(binario);

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toBe('application/pdf');
    expect(res.headers['content-disposition']).toBe('inline; filename="ficha-casa-1.pdf"');
    expect(res.body.subarray(0, 5).toString()).toBe('%PDF-');
    expect(paginas(res.body)).toBeGreaterThanOrEqual(1);
  });

  it('?descargar=1 → se descarga como archivo', async () => {
    const res = await request(app).get('/api/casas/1/pdf?descargar=1').buffer(true).parse(binario);

    expect(res.headers['content-disposition']).toBe('attachment; filename="ficha-casa-1.pdf"');
  });

  it('casa vendida → 404 (el sitio público solo muestra casas en venta)', async () => {
    const res = await request(app).get('/api/casas/2/pdf'); // la casa 2 de los seeders está vendida
    expect(res.status).toBe(404);
    expect(res.body.error.codigo).toBe('CASA_NO_ENCONTRADA');
  });

  it('casa inexistente → 404 e id inválido → 400', async () => {
    expect((await request(app).get('/api/casas/9999/pdf')).status).toBe(404);
    expect((await request(app).get('/api/casas/abc/pdf')).status).toBe(400);
  });
});
