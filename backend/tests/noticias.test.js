/**
 * Noticias de última hora: endpoints públicos y CRUD de admin contra MySQL
 * (base multicasa_test con las 3 noticias de los seeders, todas activas).
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

const IMG_JPG = path.join(__dirname, 'fixtures', 'casa-prueba-1.jpg');
const IMG_PNG = path.join(__dirname, 'fixtures', 'casa-prueba-2.png');
const token = jwt.sign({ id: 1, email: 'admin@multicasa.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const auth = { Authorization: `Bearer ${token}` };
const archivoDeUrl = (url) => path.join(process.env.UPLOADS_DIR, url.replace('/uploads/', ''));

beforeAll(() => prepararBaseDePruebas(), 120000);

afterAll(async () => {
  await Database.getInstance().close();
  fs.rmSync(process.env.UPLOADS_DIR, { recursive: true, force: true });
});

describe('Sitio público', () => {
  it('GET /api/noticias → activas, de la más reciente a la más vieja y sin contenido', async () => {
    const res = await request(app).get('/api/noticias');

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    expect(res.body.data.map((n) => n.id)).toEqual([3, 2, 1]); // seeders: 12/11, 07/11 y 03/11
    expect(Object.keys(res.body.data[0]).sort()).toEqual(['fechaPublicacion', 'id', 'imagenUrl', 'resumen', 'titulo']);
  });

  it('?limite= recorta la lista; fuera de rango → 400', async () => {
    const res = await request(app).get('/api/noticias?limite=2');
    expect(res.body.data.map((n) => n.id)).toEqual([3, 2]);
    expect(res.body.total).toBe(3);

    expect((await request(app).get('/api/noticias?limite=0')).status).toBe(400);
  });

  it('GET /api/noticias/:id → noticia completa con contenido', async () => {
    const res = await request(app).get('/api/noticias/1');
    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ id: 1, titulo: 'Nuevo convenio a casas ecológicas', activa: true });
    expect(res.body.data.contenido).toContain('\n\n'); // dos párrafos
    expect(res.body.data).not.toHaveProperty('creadoPor');
  });

  it('GET /api/noticias/:id inexistente → 404 NOTICIA_NO_ENCONTRADA', async () => {
    const res = await request(app).get('/api/noticias/999');
    expect(res.status).toBe(404);
    expect(res.body.error.codigo).toBe('NOTICIA_NO_ENCONTRADA');
  });
});

describe('Admin', () => {
  let noticiaId;
  let imagenUrl;

  it('desactivar una noticia → desaparece de la lista pública y su detalle da 404', async () => {
    const res = await request(app).put('/api/admin/noticias/2').set(auth).send({ activa: false });
    expect(res.status).toBe(200);
    expect(res.body.data.activa).toBe(false);

    const lista = await request(app).get('/api/noticias');
    expect(lista.body.data.map((n) => n.id)).toEqual([3, 1]);
    expect(lista.body.total).toBe(2);

    const detalle = await request(app).get('/api/noticias/2');
    expect(detalle.status).toBe(404);
    expect(detalle.body.error.codigo).toBe('NOTICIA_NO_ENCONTRADA');
  });

  it('GET /api/admin/noticias → todas (activas e inactivas), paginadas', async () => {
    const res = await request(app).get('/api/admin/noticias?pagina=1&limite=2').set(auth);
    expect(res.body).toMatchObject({ total: 3, pagina: 1, limite: 2 });
    expect(res.body.data).toHaveLength(2);

    const inactiva = await request(app).get('/api/admin/noticias/2').set(auth);
    expect(inactiva.status).toBe(200);
    expect(inactiva.body.data.activa).toBe(false);
  });

  it('POST con imagen (multipart) → 201, creadoPor del token y archivo en uploads/noticias', async () => {
    const res = await request(app)
      .post('/api/admin/noticias')
      .set(auth)
      .field('titulo', 'Nuevo fraccionamiento en Ramos Arizpe')
      .field('resumen', 'Abrimos la preventa con descuentos especiales.')
      .field('contenido', 'Párrafo uno.\n\nPárrafo dos.')
      .attach('imagen', IMG_JPG);

    expect(res.status).toBe(201);
    noticiaId = res.body.data.id;
    imagenUrl = res.body.data.imagenUrl;
    expect(res.body.data).toMatchObject({ titulo: 'Nuevo fraccionamiento en Ramos Arizpe', activa: true, creadoPor: 1 });
    expect(imagenUrl).toMatch(/^\/uploads\/noticias\/noticia-\d+-[0-9a-f]{12}\.jpg$/);
    expect(fs.existsSync(archivoDeUrl(imagenUrl))).toBe(true);

    // Es la más reciente: aparece primero en la barra lateral
    const lista = await request(app).get('/api/noticias');
    expect(lista.body.data[0].id).toBe(noticiaId);
  });

  it('POST como JSON sin imagen → 201 con imagenUrl null', async () => {
    const res = await request(app)
      .post('/api/admin/noticias')
      .set(auth)
      .send({ titulo: 'Aviso sin imagen', resumen: 'Resumen corto' });
    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ imagenUrl: null, contenido: null });
  });

  it('POST con datos inválidos → 400 DATOS_INVALIDOS y no deja la imagen en disco', async () => {
    const dir = path.join(process.env.UPLOADS_DIR, 'noticias');
    const antes = fs.readdirSync(dir).length;

    const res = await request(app)
      .post('/api/admin/noticias')
      .set(auth)
      .field('titulo', 'x'.repeat(151))
      .attach('imagen', IMG_PNG);

    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect(res.body.error.detalles).toEqual([
      { campo: 'titulo', mensaje: 'Máximo 150 caracteres' },
      { campo: 'resumen', mensaje: 'Es obligatorio' },
    ]);
    await new Promise((r) => setTimeout(r, 100)); // la limpieza corre al terminar la respuesta
    expect(fs.readdirSync(dir)).toHaveLength(antes);
  });

  it('POST con dos imágenes → 400 ARCHIVO_INVALIDO (solo se acepta una)', async () => {
    const res = await request(app)
      .post('/api/admin/noticias')
      .set(auth)
      .field('titulo', 'Dos imágenes')
      .field('resumen', 'No se permite')
      .attach('imagen', IMG_JPG)
      .attach('imagen', IMG_PNG);
    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('ARCHIVO_INVALIDO');
  });

  it('PUT con imagen nueva → reemplaza la anterior y borra su archivo', async () => {
    const res = await request(app)
      .put(`/api/admin/noticias/${noticiaId}`)
      .set(auth)
      .field('resumen', 'Resumen actualizado')
      .attach('imagen', IMG_PNG);

    expect(res.status).toBe(200);
    expect(res.body.data.resumen).toBe('Resumen actualizado');
    expect(res.body.data.titulo).toBe('Nuevo fraccionamiento en Ramos Arizpe'); // no se envió: no cambia
    expect(res.body.data.imagenUrl).toMatch(/\.png$/);
    expect(fs.existsSync(archivoDeUrl(res.body.data.imagenUrl))).toBe(true);
    expect(fs.existsSync(archivoDeUrl(imagenUrl))).toBe(false);
    imagenUrl = res.body.data.imagenUrl;
  });

  it('DELETE → 204, borra la noticia y el archivo de su imagen', async () => {
    const res = await request(app).delete(`/api/admin/noticias/${noticiaId}`).set(auth);
    expect(res.status).toBe(204);
    expect(fs.existsSync(archivoDeUrl(imagenUrl))).toBe(false);
    expect((await request(app).get(`/api/admin/noticias/${noticiaId}`).set(auth)).status).toBe(404);
  });

  it('PUT / DELETE de una noticia inexistente → 404 NOTICIA_NO_ENCONTRADA', async () => {
    expect((await request(app).put('/api/admin/noticias/999').set(auth).send({ activa: true })).body.error.codigo).toBe(
      'NOTICIA_NO_ENCONTRADA',
    );
    expect((await request(app).delete('/api/admin/noticias/999').set(auth)).status).toBe(404);
  });
});

describe('Admin sin token → 401', () => {
  it.each([
    ['get', '/api/admin/noticias'],
    ['get', '/api/admin/noticias/1'],
    ['post', '/api/admin/noticias'],
    ['put', '/api/admin/noticias/1'],
    ['delete', '/api/admin/noticias/1'],
  ])('%s %s', async (metodo, ruta) => {
    const res = await request(app)[metodo](ruta);
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('TOKEN_REQUERIDO');
  });
});
