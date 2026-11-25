/**
 * Documentación de la API con Swagger (issue #18). No usa la BD.
 */
const request = require('supertest');
const SwaggerParser = require('@apidevtools/swagger-parser');
const Database = require('../src/config/Database');
const { especificacion } = require('../src/config/swagger');
const app = require('../src/app');

afterAll(() => Database.getInstance().close());

/** Todos los endpoints que expone la API. Si agregas uno, documéntalo con @openapi y agrégalo aquí. */
const ENDPOINTS = [
  'GET /api/health',
  'GET /api/casas/destacadas',
  'GET /api/casas/buscar',
  'GET /api/casas/{id}',
  'GET /api/casas/{id}/pdf',
  'GET /api/amenidades',
  'GET /api/formas-pago',
  'GET /api/noticias',
  'GET /api/noticias/{id}',
  'POST /api/visitas',
  'GET /api/visitas/resumen',
  'POST /api/contacto',
  'POST /api/auth/login',
  'GET /api/admin/perfil',
  'GET /api/admin/casas',
  'POST /api/admin/casas',
  'GET /api/admin/casas/{id}',
  'PUT /api/admin/casas/{id}',
  'DELETE /api/admin/casas/{id}',
  'PATCH /api/admin/casas/{id}/estatus',
  'DELETE /api/admin/casas/{id}/imagenes/{imagenId}',
  'GET /api/admin/noticias',
  'POST /api/admin/noticias',
  'GET /api/admin/noticias/{id}',
  'PUT /api/admin/noticias/{id}',
  'DELETE /api/admin/noticias/{id}',
  'GET /api/admin/dashboard/rangos-precio',
  'GET /api/admin/dashboard/estatus',
  'GET /api/admin/reportes/casas',
];

const documentados = () =>
  Object.entries(especificacion.paths).flatMap(([ruta, metodos]) =>
    Object.keys(metodos).map((metodo) => `${metodo.toUpperCase()} ${ruta}`),
  );

describe('Especificación OpenAPI', () => {
  it('es OpenAPI 3 válido', async () => {
    await expect(SwaggerParser.validate(structuredClone(especificacion))).resolves.toBeTruthy();
  });

  it('documenta todos los endpoints de la API (ni más ni menos)', () => {
    expect(documentados().sort()).toEqual([...ENDPOINTS].sort());
  });

  it('cada endpoint tiene sección (tag) declarada y resumen', () => {
    const tags = especificacion.tags.map((t) => t.name);
    for (const [ruta, metodos] of Object.entries(especificacion.paths)) {
      for (const [metodo, op] of Object.entries(metodos)) {
        expect({ endpoint: `${metodo} ${ruta}`, summary: Boolean(op.summary) }).toEqual({ endpoint: `${metodo} ${ruta}`, summary: true });
        op.tags.forEach((tag) => expect(tags).toContain(tag));
      }
    }
  });

  it('las rutas /api/admin piden token (bearerAuth), salvo el login', () => {
    const sinToken = Object.entries(especificacion.paths)
      .filter(([ruta]) => ruta.startsWith('/api/admin'))
      .flatMap(([ruta, metodos]) => Object.entries(metodos).map(([m, op]) => [`${m} ${ruta}`, op.security]))
      .filter(([, security]) => !security?.some((s) => 'bearerAuth' in s))
      .map(([endpoint]) => endpoint);

    expect(sinToken).toEqual([]);
    expect(especificacion.components.securitySchemes.bearerAuth).toMatchObject({ type: 'http', scheme: 'bearer' });
  });
});

describe('Rutas de la documentación', () => {
  it('GET /api/docs.json → la especificación', async () => {
    const res = await request(app).get('/api/docs.json');

    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.info.title).toBe('API MultiCasa');
  });

  it('GET /api/docs/ → Swagger UI', async () => {
    const res = await request(app).get('/api/docs/');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/html/);
    expect(res.text).toContain('swagger-ui');
  });
});
