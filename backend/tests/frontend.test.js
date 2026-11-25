/**
 * El backend sirve el build del front cuando existe (issue #31). No usa la BD.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const request = require('supertest');

const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'multicasa-dist-'));
fs.writeFileSync(path.join(dist, 'index.html'), '<!doctype html><title>MultiCasa</title>');
fs.mkdirSync(path.join(dist, 'assets'));
fs.writeFileSync(path.join(dist, 'assets', 'app.js'), 'console.log("ok")');
process.env.FRONTEND_DIR = dist;

const Database = require('../src/config/Database');
const app = require('../src/app');

afterAll(() => {
  fs.rmSync(dist, { recursive: true, force: true });
  return Database.getInstance().close();
});

describe('Sitio compilado (frontend/dist)', () => {
  it('GET / regresa index.html', async () => {
    const res = await request(app).get('/');

    expect(res.status).toBe(200);
    expect(res.text).toContain('<title>MultiCasa</title>');
  });

  it('una ruta de React (/casas/3) también regresa index.html para que no truene al recargar', async () => {
    const res = await request(app).get('/casas/3');

    expect(res.status).toBe(200);
    expect(res.type).toBe('text/html');
  });

  it('sirve los archivos estáticos del build', async () => {
    const res = await request(app).get('/assets/app.js');

    expect(res.status).toBe(200);
    expect(res.text).toContain('console.log');
  });

  it('una ruta de la API que no existe sigue siendo 404 en JSON, no index.html', async () => {
    const res = await request(app).get('/api/no-existe');

    expect(res.status).toBe(404);
    expect(res.body.error.codigo).toBe('RUTA_NO_ENCONTRADA');
  });

  it('una imagen que no existe en /uploads es 404, no index.html', async () => {
    const res = await request(app).get('/uploads/casas/no-existe.jpg');

    expect(res.status).toBe(404);
  });

  it('las fotos de los seeders se sirven desde /uploads/seed', async () => {
    const foto = fs.readdirSync(path.resolve(__dirname, '../uploads/seed'))[0];
    const res = await request(app).get(`/uploads/seed/${foto}`);

    expect(res.status).toBe(200);
  });
});
