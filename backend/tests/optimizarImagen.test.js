/**
 * Optimización de imágenes al subirlas (rúbrica: "Photoshop / optimización de imágenes").
 * - optimizarImagen: sin BD, con imágenes generadas en una carpeta temporal.
 * - Subida real por la API: contra MySQL (base multicasa_test).
 */
const fs = require('fs');
const os = require('os');
const path = require('path');

// Igual que casas / noticias: las subidas van a una carpeta temporal, no a backend/uploads
process.env.UPLOADS_DIR = fs.mkdtempSync(path.join(os.tmpdir(), 'multicasa-uploads-'));

const sharp = require('sharp');
const { optimizarImagen } = require('../src/utils/optimizarImagen');

let dir;
beforeAll(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'multicasa-opt-'));
});
afterAll(() => {
  fs.rmSync(dir, { recursive: true, force: true });
  fs.rmSync(process.env.UPLOADS_DIR, { recursive: true, force: true });
});

/** Crea una imagen de prueba con ruido (para que no se comprima a casi nada). */
async function crearImagen(nombre, { ancho, alto, formato, alfa = false }) {
  const canales = alfa ? 4 : 3;
  const pixeles = Buffer.alloc(ancho * alto * canales);
  for (let i = 0; i < pixeles.length; i += 1) pixeles[i] = (i * 2654435761) % 256;
  const ruta = path.join(dir, nombre);
  await sharp(pixeles, { raw: { width: ancho, height: alto, channels: canales } }).toFormat(formato, { quality: 100 }).toFile(ruta);
  return { path: ruta, originalname: nombre, size: fs.statSync(ruta).size };
}

describe('optimizarImagen', () => {
  it('reduce una foto grande a máximo 1600 px y la guarda como JPEG más ligera', async () => {
    const archivo = await crearImagen('grande.jpg', { ancho: 3200, alto: 2000, formato: 'jpeg' });
    const resultado = await optimizarImagen(archivo);
    const meta = await sharp(resultado.path).metadata();

    expect(meta).toMatchObject({ format: 'jpeg', width: 1600, height: 1000 });
    expect(resultado.size).toBeLessThan(archivo.size);
    expect(resultado).toMatchObject({ filename: 'grande.jpg', mimetype: 'image/jpeg' });
  });

  it('no agranda imágenes pequeñas', async () => {
    const resultado = await optimizarImagen(await crearImagen('chica.jpg', { ancho: 400, alto: 300, formato: 'jpeg' }));
    expect(await sharp(resultado.path).metadata()).toMatchObject({ width: 400, height: 300 });
  });

  it('PNG o WebP → JPEG con otro nombre, y borra el original', async () => {
    for (const formato of ['png', 'webp']) {
      const archivo = await crearImagen(`foto.${formato}`, { ancho: 800, alto: 600, formato, alfa: true });
      const resultado = await optimizarImagen(archivo);

      expect(resultado.filename).toBe('foto.jpg');
      expect((await sharp(resultado.path).metadata()).format).toBe('jpeg');
      expect(fs.existsSync(archivo.path)).toBe(false);
    }
  });

  it('un archivo que no es imagen (aunque diga .jpg) lanza error y no deja basura', async () => {
    const ruta = path.join(dir, 'falsa.jpg');
    fs.writeFileSync(ruta, 'esto no es una imagen');

    await expect(optimizarImagen({ path: ruta, originalname: 'falsa.jpg' })).rejects.toThrow();
    expect(fs.readdirSync(dir).filter((f) => f.endsWith('.tmp'))).toEqual([]);
  });
});

describe('Subida por la API', () => {
  process.env.JWT_SECRET = process.env.JWT_SECRET || 'secreto-solo-para-pruebas';
  const jwt = require('jsonwebtoken');
  const request = require('supertest');
  const { prepararBaseDePruebas } = require('./helpers/baseDePruebas');
  const Database = require('../src/config/Database');
  const env = require('../src/config/env');
  const app = require('../src/app');

  const auth = { Authorization: `Bearer ${jwt.sign({ id: 1, email: 'admin@multicasa.com' }, env.jwt.secret, { expiresIn: '1h' })}` };

  beforeAll(() => prepararBaseDePruebas(), 120000);
  afterAll(() => Database.getInstance().close());

  it('una foto grande subida a una noticia queda optimizada en el disco', async () => {
    const { path: grande } = await crearImagen('api-grande.png', { ancho: 2400, alto: 1800, formato: 'png' });
    const res = await request(app).post('/api/admin/noticias').set(auth)
      .field('titulo', 'Noticia con foto grande').field('resumen', 'Prueba de optimización')
      .attach('imagen', grande);

    expect(res.status).toBe(201);
    expect(res.body.data.imagenUrl).toMatch(/\.jpg$/);
    const enDisco = path.join(env.uploadsDir, res.body.data.imagenUrl.replace('/uploads/', ''));
    expect(await sharp(enDisco).metadata()).toMatchObject({ format: 'jpeg', width: 1600, height: 1200 });
  });

  it('archivo de texto disfrazado de .jpg → 400 ARCHIVO_INVALIDO y no se guarda nada', async () => {
    const carpeta = path.join(env.uploadsDir, 'noticias');
    const antes = fs.existsSync(carpeta) ? fs.readdirSync(carpeta).length : 0;

    const res = await request(app).post('/api/admin/noticias').set(auth)
      .field('titulo', 'Noticia falsa').field('resumen', 'No debe guardarse')
      .attach('imagen', Buffer.from('esto no es una imagen'), { filename: 'foto.jpg', contentType: 'image/jpeg' });

    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('ARCHIVO_INVALIDO');
    await new Promise((r) => setTimeout(r, 100)); // el borrado corre al terminar la respuesta
    expect(fs.existsSync(carpeta) ? fs.readdirSync(carpeta).length : 0).toBe(antes);
  });
});
