/**
 * Pruebas de integración del CRUD de casas: usan MySQL real (base multicasa_test, que se
 * crea y se siembra sola) y una carpeta temporal para las imágenes subidas.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.JWT_SECRET = 'secreto-solo-para-pruebas';
process.env.UPLOADS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'multicasa-uploads-'));

const request = require('supertest');
const jwt = require('jsonwebtoken');
const { prepararBaseDePruebas } = require('./helpers/baseDePruebas');
const Database = require('../src/config/Database');
const app = require('../src/app');

const FIXTURES = path.join(__dirname, 'fixtures');
const IMG_JPG = path.join(FIXTURES, 'casa-prueba-1.jpg');
const IMG_PNG = path.join(FIXTURES, 'casa-prueba-2.png');
const DIR_CASAS = path.join(process.env.UPLOADS_DIR, 'casas');

const token = jwt.sign({ id: 1, email: 'admin@multicasa.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const auth = { Authorization: `Bearer ${token}` };

const archivoDeUrl = (url) => path.join(process.env.UPLOADS_DIR, url.replace('/uploads/', ''));
const archivosSubidos = () => (fs.existsSync(DIR_CASAS) ? fs.readdirSync(DIR_CASAS) : []);
const hoy = () => new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Monterrey' });

const camposValidos = {
  titulo: 'Casa de prueba en Los Pinos',
  descripcion: 'Casa creada por las pruebas automáticas',
  tipo: 'casa',
  precio: '1850000',
  direccion: 'Calle Nogal 123',
  colonia: 'Los Pinos',
  ciudad: 'Saltillo',
  estado: 'Coahuila',
  codigoPostal: '25198',
  lat: '25.4321',
  lng: '-100.9876',
  m2Terreno: '160',
  m2Construccion: '140',
  recamaras: '3',
  banos: '2.5',
  estacionamientos: '2',
  plantas: '2',
  orientacion: 'norte',
  destacada: 'true',
};

/** POST /api/admin/casas como multipart, igual que lo manda el formulario del frontend. */
function crearCasa(campos = camposValidos, imagenes = [IMG_JPG, IMG_PNG], extra = (r) => r) {
  let req = request(app).post('/api/admin/casas').set(auth);
  for (const [campo, valor] of Object.entries(campos)) {
    req = req.field(campo, valor);
  }
  for (const imagen of imagenes) {
    req = req.attach('imagenes', imagen);
  }
  return extra(req);
}

beforeAll(() => prepararBaseDePruebas(), 120000);

afterAll(async () => {
  await Database.getInstance().close();
  fs.rmSync(process.env.UPLOADS_DIR, { recursive: true, force: true });
});

// ---------------------------------------------------------------- sitio público

describe('Sitio público', () => {
  it('GET /api/casas/:id de una casa en venta → detalle con imágenes, amenidades y formas de pago', async () => {
    const res = await request(app).get('/api/casas/1');

    expect(res.status).toBe(200);
    const casa = res.body.data;
    expect(casa).toMatchObject({ id: 1, estatus: 'venta', codigoPostal: '25000', m2Terreno: 180, precio: 1850000 });
    expect(casa).not.toHaveProperty('creadoPor');
    expect(casa.imagenes.map((i) => i.orden)).toEqual([1, 2]);
    expect(casa.imagenes[0]).toMatchObject({ url: '/uploads/seed/casa-01-1.jpg', esPortada: true });
    expect(casa.amenidades.length).toBeGreaterThanOrEqual(4);
    expect(casa.amenidades[0]).toEqual(expect.objectContaining({ nombre: expect.any(String), tipo: expect.stringMatching(/interior|exterior/) }));
    expect(casa.formasPago[0]).toEqual(expect.objectContaining({ nombre: 'Contado', requisitos: expect.any(String) }));
  });

  it('GET /api/casas/:id de una casa vendida → 404 CASA_NO_ENCONTRADA', async () => {
    const res = await request(app).get('/api/casas/2'); // la casa 2 está vendida en los seeders
    expect(res.status).toBe(404);
    expect(res.body.error.codigo).toBe('CASA_NO_ENCONTRADA');
  });

  it('GET /api/casas/:id inexistente → 404 CASA_NO_ENCONTRADA', async () => {
    const res = await request(app).get('/api/casas/9999');
    expect(res.status).toBe(404);
    expect(res.body.error.codigo).toBe('CASA_NO_ENCONTRADA');
  });

  it('GET /api/casas/destacadas → solo en venta y destacadas, con su portada', async () => {
    const res = await request(app).get('/api/casas/destacadas');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(5);
    expect(res.body.data.map((c) => c.id).sort((a, b) => a - b)).toEqual([4, 9, 15, 16, 18]);
    for (const casa of res.body.data) {
      expect(casa).toMatchObject({ estatus: 'venta', destacada: true });
      expect(casa.portada).toMatch(/^\/uploads\/seed\/casa-\d{2}-1\.jpg$/);
      expect(casa).not.toHaveProperty('imagenes');
    }
  });

  it('GET /api/formas-pago y /api/amenidades → catálogos', async () => {
    const formas = await request(app).get('/api/formas-pago');
    expect(formas.body.total).toBe(5);
    expect(formas.body.data[0]).toHaveProperty('requisitos');

    const agrupadas = await request(app).get('/api/amenidades?agrupar=tipo');
    expect(agrupadas.body.total).toBe(17);
    expect(agrupadas.body.data.interior).toHaveLength(8);
    expect(agrupadas.body.data.exterior).toHaveLength(9);
  });
});

// ---------------------------------------------------------------- admin: lectura

describe('Admin: listado y detalle', () => {
  it('GET /api/admin/casas → todas, con filtros y paginación', async () => {
    const todas = await request(app).get('/api/admin/casas?limite=50').set(auth);
    expect(todas.body.total).toBe(20);
    expect(todas.body.data[0]).toHaveProperty('portada');

    const vendidas = await request(app).get('/api/admin/casas?estatus=vendida').set(auth);
    expect(vendidas.body.total).toBe(6);

    const busqueda = await request(app).get('/api/admin/casas?busqueda=Cumbres').set(auth);
    expect(busqueda.body.data.map((c) => c.id)).toEqual([16]);

    const pagina2 = await request(app).get('/api/admin/casas?pagina=2&limite=8').set(auth);
    expect(pagina2.body).toMatchObject({ total: 20, pagina: 2, limite: 8 });
    expect(pagina2.body.data).toHaveLength(8);
  });

  it('GET /api/admin/casas con filtros inválidos → 400 DATOS_INVALIDOS', async () => {
    const res = await request(app).get('/api/admin/casas?estatus=rentada&limite=500').set(auth);
    expect(res.status).toBe(400);
    expect(res.body.error.detalles.map((d) => d.campo)).toEqual(['estatus', 'limite']);
  });

  it('GET /api/admin/casas/:id incluye vendidas', async () => {
    const res = await request(app).get('/api/admin/casas/2').set(auth);
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: 2, estatus: 'vendida' });
  });
});

// ---------------------------------------------------------------- admin: escritura

describe('Admin: alta, edición, estatus y borrado', () => {
  let casaId;

  it('POST con 2 imágenes, amenidades y formas de pago → 201 y archivos en disco', async () => {
    const res = await crearCasa({ ...camposValidos, amenidadIds: '1,9,10', formaPagoIds: '[1,2]' });

    expect(res.status).toBe(201);
    const casa = res.body.data;
    casaId = casa.id;
    expect(casa).toMatchObject({ titulo: camposValidos.titulo, precio: 1850000, banos: 2.5, recamaras: 3, destacada: true, creadoPor: 1 });
    expect(casa.amenidades.map((a) => a.id).sort((a, b) => a - b)).toEqual([1, 9, 10]);
    expect(casa.formasPago.map((f) => f.id)).toEqual([1, 2]);

    expect(casa.imagenes).toHaveLength(2);
    expect(casa.imagenes.map((i) => [i.orden, i.esPortada])).toEqual([[1, true], [2, false]]);
    for (const imagen of casa.imagenes) {
      expect(imagen.url).toMatch(/^\/uploads\/casas\/casa-\d+-[0-9a-f]{12}\.(jpg|png)$/);
      expect(fs.existsSync(archivoDeUrl(imagen.url))).toBe(true);
    }

    // La imagen se puede ver en /uploads como archivo estático
    const archivo = await request(app).get(casa.imagenes[0].url);
    expect(archivo.status).toBe(200);
    expect(archivo.headers['content-type']).toMatch(/image\/jpeg/);
  });

  it('POST con datos inválidos → 400 con cada campo y sin dejar archivos en disco', async () => {
    const antes = archivosSubidos().length;
    const res = await crearCasa({ ...camposValidos, precio: '0', codigoPostal: '2500', lat: '120', tipo: 'castillo', titulo: '' });

    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect(res.body.error.detalles.map((d) => d.campo)).toEqual(['titulo', 'tipo', 'precio', 'codigoPostal', 'lat']);
    await new Promise((r) => setTimeout(r, 100)); // la limpieza corre al terminar la respuesta
    expect(archivosSubidos()).toHaveLength(antes);
  });

  it('si algo falla DENTRO de la transacción → ROLLBACK: la casa no se guarda y se borran las imágenes', async () => {
    const ImagenCasaRepository = require('../src/repositories/ImagenCasaRepository');
    const falla = jest
      .spyOn(ImagenCasaRepository.prototype, 'agregar')
      .mockRejectedValueOnce(new Error('Falla simulada al guardar las imágenes'));
    const antesArchivos = archivosSubidos().length;
    const antesCasas = (await request(app).get('/api/admin/casas').set(auth)).body.total;

    // La casa SÍ se inserta (INSERT dentro de la transacción) y luego falla el paso de imágenes
    const res = await crearCasa({ ...camposValidos, titulo: 'Casa que no debe quedar' });

    expect(falla).toHaveBeenCalledTimes(1);
    expect(res.status).toBe(500);
    expect(res.body.error.codigo).toBe('ERROR_INTERNO');
    const despues = await request(app).get('/api/admin/casas?busqueda=no debe quedar').set(auth);
    expect(despues.body.total).toBe(0);
    expect((await request(app).get('/api/admin/casas').set(auth)).body.total).toBe(antesCasas);
    expect(archivosSubidos()).toHaveLength(antesArchivos);
    falla.mockRestore();
  });

  it('POST con una amenidad que no existe → 400, no crea la casa y borra las imágenes', async () => {
    const antes = archivosSubidos().length;
    const res = await crearCasa({ ...camposValidos, amenidadIds: '1,999' });

    expect(res.status).toBe(400);
    expect(res.body.error.detalles).toEqual([{ campo: 'amenidadIds', mensaje: 'Alguna amenidad no existe' }]);
    expect(archivosSubidos()).toHaveLength(antes);
    const total = await request(app).get('/api/admin/casas').set(auth);
    expect(total.body.total).toBe(21); // 20 de los seeders + la del alta correcta
  });

  it('POST con un archivo que no es imagen → 400 ARCHIVO_INVALIDO', async () => {
    const res = await crearCasa(camposValidos, [path.join(FIXTURES, 'no-es-imagen.txt')]);
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('ARCHIVO_INVALIDO');
  });

  it('POST con una imagen de más de 5 MB → 400 ARCHIVO_MUY_GRANDE', async () => {
    const antes = archivosSubidos().length;
    const grande = Buffer.alloc(5 * 1024 * 1024 + 1, 0xff);
    const res = await crearCasa(camposValidos, [], (r) =>
      r.attach('imagenes', grande, { filename: 'enorme.jpg', contentType: 'image/jpeg' }),
    );
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('ARCHIVO_MUY_GRANDE');
    expect(archivosSubidos()).toHaveLength(antes);
  });

  it('PUT reemplaza amenidades, agrega imágenes y solo cambia los campos enviados', async () => {
    const res = await request(app)
      .put(`/api/admin/casas/${casaId}`)
      .set(auth)
      .field('precio', '1990000')
      .field('m2Construccion', '') // vacío = borrar el valor
      .field('amenidadIds[]', '2')
      .field('amenidadIds[]', '3')
      .attach('imagenes', IMG_JPG);

    expect(res.status).toBe(200);
    const casa = res.body.data;
    expect(casa.precio).toBe(1990000);
    expect(casa.m2Construccion).toBeNull();
    expect(casa.titulo).toBe(camposValidos.titulo); // no se envió: no cambia
    expect(casa.amenidades.map((a) => a.id).sort()).toEqual([2, 3]); // reemplazadas
    expect(casa.formasPago.map((f) => f.id)).toEqual([1, 2]); // no se enviaron: se conservan
    expect(casa.imagenes.map((i) => i.orden)).toEqual([1, 2, 3]); // la nueva se agregó al final
    expect(casa.imagenes.filter((i) => i.esPortada)).toHaveLength(1);
  });

  it('PATCH estatus vendida → fecha_venta = hoy, deja de ser destacada y desaparece del sitio público', async () => {
    const res = await request(app).patch(`/api/admin/casas/${casaId}/estatus`).set(auth).send({ estatus: 'vendida' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ estatus: 'vendida', fechaVenta: hoy(), destacada: false });
    expect((await request(app).get(`/api/casas/${casaId}`)).status).toBe(404);

    const deVuelta = await request(app).patch(`/api/admin/casas/${casaId}/estatus`).set(auth).send({ estatus: 'venta' });
    expect(deVuelta.body.data).toMatchObject({ estatus: 'venta', fechaVenta: null });
    expect((await request(app).get(`/api/casas/${casaId}`)).status).toBe(200);
  });

  it('PATCH estatus con valor inválido → 400 DATOS_INVALIDOS', async () => {
    const res = await request(app).patch(`/api/admin/casas/${casaId}/estatus`).set(auth).send({ estatus: 'rentada' });
    expect(res.status).toBe(400);
    expect(res.body.error.detalles[0].campo).toBe('estatus');
  });

  it('DELETE de la imagen portada → borra el archivo y la siguiente por orden pasa a ser portada', async () => {
    const { body } = await request(app).get(`/api/admin/casas/${casaId}`).set(auth);
    const [portada, segunda] = body.data.imagenes;

    const res = await request(app).delete(`/api/admin/casas/${casaId}/imagenes/${portada.id}`).set(auth);

    expect(res.status).toBe(200);
    expect(fs.existsSync(archivoDeUrl(portada.url))).toBe(false);
    expect(res.body.data.imagenes.map((i) => i.id)).not.toContain(portada.id);
    expect(res.body.data.imagenes.find((i) => i.esPortada).id).toBe(segunda.id);
  });

  it('DELETE de una imagen que no es de esa casa → 404 IMAGEN_NO_ENCONTRADA', async () => {
    const res = await request(app).delete(`/api/admin/casas/${casaId}/imagenes/1`).set(auth); // imagen 1 = casa 1
    expect(res.status).toBe(404);
    expect(res.body.error.codigo).toBe('IMAGEN_NO_ENCONTRADA');
  });

  it('DELETE de la casa → 204, se borra de la BD y sus archivos del disco', async () => {
    const { body } = await request(app).get(`/api/admin/casas/${casaId}`).set(auth);
    const rutas = body.data.imagenes.map((i) => archivoDeUrl(i.url));
    expect(rutas.every((r) => fs.existsSync(r))).toBe(true);

    const res = await request(app).delete(`/api/admin/casas/${casaId}`).set(auth);

    expect(res.status).toBe(204);
    expect(rutas.some((r) => fs.existsSync(r))).toBe(false);
    expect((await request(app).get(`/api/admin/casas/${casaId}`).set(auth)).status).toBe(404);
  });

  it('DELETE de una casa de los seeders no borra sus fotos de uploads/seed (se versionan en git)', async () => {
    const fotoSeed = archivoDeUrl('/uploads/seed/casa-20-1.jpg');
    fs.mkdirSync(path.dirname(fotoSeed), { recursive: true });
    fs.copyFileSync(IMG_JPG, fotoSeed);

    const res = await request(app).delete('/api/admin/casas/20').set(auth);

    expect(res.status).toBe(204);
    expect(fs.existsSync(fotoSeed)).toBe(true);
  });
});

// ---------------------------------------------------------------- sin token

describe('Rutas de admin sin token → 401', () => {
  it.each([
    ['get', '/api/admin/casas'],
    ['get', '/api/admin/casas/1'],
    ['post', '/api/admin/casas'],
    ['put', '/api/admin/casas/1'],
    ['patch', '/api/admin/casas/1/estatus'],
    ['delete', '/api/admin/casas/1'],
    ['delete', '/api/admin/casas/1/imagenes/1'],
  ])('%s %s', async (metodo, ruta) => {
    const res = await request(app)[metodo](ruta);
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('TOKEN_REQUERIDO');
  });

  it('un POST sin token no guarda ningún archivo', async () => {
    const antes = archivosSubidos().length;
    const res = await request(app).post('/api/admin/casas').attach('imagenes', IMG_JPG);
    expect(res.status).toBe(401);
    expect(archivosSubidos()).toHaveLength(antes);
  });
});
