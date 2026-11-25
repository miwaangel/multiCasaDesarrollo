/**
 * Dashboard: pruebas del servicio (sin BD) y de los endpoints contra MySQL
 * (base multicasa_test, con los datos de los seeders).
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
const DashboardRepository = require('../src/repositories/DashboardRepository');
const { DashboardService, RANGOS_PRECIO } = require('../src/services/DashboardService');
const app = require('../src/app');

const token = jwt.sign({ id: 1, email: 'admin@multicasa.com' }, process.env.JWT_SECRET, { expiresIn: '1h' });
const auth = { Authorization: `Bearer ${token}` };
const NOMBRES = RANGOS_PRECIO.map((r) => r.rango);

const rangos = () => request(app).get('/api/admin/dashboard/rangos-precio').set(auth);
const estatus = () => request(app).get('/api/admin/dashboard/estatus').set(auth);

afterAll(async () => {
  await Database.getInstance().close();
  fs.rmSync(process.env.UPLOADS_DIR, { recursive: true, force: true });
});

// ---------------------------------------------------------------- servicio (sin BD)

describe('DashboardService (repositorio simulado)', () => {
  const servicio = (rangosVista, estatusVista) =>
    new DashboardService({
      findRangosPrecio: async () => rangosVista,
      findPorEstatus: async () => estatusVista,
    });

  it('completa con 0 los rangos que la vista no regresa y los deja en orden', async () => {
    // La vista solo trae los rangos 4 y 2 (y en desorden)
    const resultado = await servicio([
      { rango: '$4 M - $7 M', orden: 4, total: 2 },
      { rango: '$1 M - $2 M', orden: 2, total: 7 },
    ]).rangosPrecio();

    expect(resultado).toEqual([
      { rango: 'Menos de $1 M', orden: 1, total: 0 },
      { rango: '$1 M - $2 M', orden: 2, total: 7 },
      { rango: '$2 M - $4 M', orden: 3, total: 0 },
      { rango: '$4 M - $7 M', orden: 4, total: 2 },
      { rango: 'Más de $7 M', orden: 5, total: 0 },
    ]);
  });

  it('sin casas → los 5 rangos en 0, y venta / vendida en 0', async () => {
    const s = servicio([], []);
    expect((await s.rangosPrecio()).map((r) => r.total)).toEqual([0, 0, 0, 0, 0]);
    expect(await s.estatus()).toEqual({ venta: 0, vendida: 0, total: 0 });
  });

  it('si solo hay casas en venta → vendida = 0', async () => {
    expect(await servicio([], [{ estatus: 'venta', total: 9 }]).estatus()).toEqual({ venta: 9, vendida: 0, total: 9 });
  });

  it('convierte a número los conteos que MySQL regresa como texto', async () => {
    const [primero] = await servicio([{ rango: 'Menos de $1 M', orden: '1', total: '3' }], []).rangosPrecio();
    expect(primero.total).toBe(3);
  });
});

// ---------------------------------------------------------------- endpoints (MySQL)

describe('Endpoints del dashboard con los datos del seeder', () => {
  beforeAll(() => prepararBaseDePruebas(), 120000);

  it('los nombres de los rangos del servicio son exactamente los de la vista', async () => {
    const filasVista = await new DashboardRepository().findRangosPrecio();
    expect(filasVista.map((f) => f.rango)).toEqual(NOMBRES); // con el seeder los 5 rangos tienen casas
  });

  it('GET /rangos-precio → los 5 rangos con su conteo y la suma igual al total de casas', async () => {
    const res = await rangos();

    expect(res.status).toBe(200);
    expect(res.body.data).toEqual([
      { rango: 'Menos de $1 M', orden: 1, total: 4 },
      { rango: '$1 M - $2 M', orden: 2, total: 5 },
      { rango: '$2 M - $4 M', orden: 3, total: 5 },
      { rango: '$4 M - $7 M', orden: 4, total: 3 },
      { rango: 'Más de $7 M', orden: 5, total: 3 },
    ]);

    const totalCasas = (await request(app).get('/api/admin/casas').set(auth)).body.total;
    expect(res.body.total).toBe(totalCasas);
    expect(res.body.data.reduce((s, r) => s + r.total, 0)).toBe(totalCasas);
  });

  it('GET /estatus → venta y vendida del seeder', async () => {
    const res = await estatus();
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { venta: 14, vendida: 6, total: 20 } });
  });

  it('marcar una casa como vendida (PATCH del #10) cambia el conteo por estatus', async () => {
    const patch = await request(app).patch('/api/admin/casas/4/estatus').set(auth).send({ estatus: 'vendida' });
    expect(patch.status).toBe(200);

    expect((await estatus()).body.data).toEqual({ venta: 13, vendida: 7, total: 20 });
    // Los rangos cuentan todas las casas (venta y vendidas): no cambian
    expect((await rangos()).body.total).toBe(20);

    await request(app).patch('/api/admin/casas/4/estatus').set(auth).send({ estatus: 'venta' });
    expect((await estatus()).body.data).toEqual({ venta: 14, vendida: 6, total: 20 });
  });

  it('si un rango se queda sin casas sigue apareciendo con total 0', async () => {
    // Las 3 casas de más de $7 M en los seeders son la 18, la 19 y la 20
    for (const id of [18, 19, 20]) {
      expect((await request(app).delete(`/api/admin/casas/${id}`).set(auth)).status).toBe(204);
    }
    const filasVista = await new DashboardRepository().findRangosPrecio();
    expect(filasVista.map((f) => f.rango)).not.toContain('Más de $7 M'); // la vista ya no lo trae…

    const res = await rangos();
    expect(res.body.data.map((r) => r.rango)).toEqual(NOMBRES); // …pero el endpoint sí
    expect(res.body.data[4]).toEqual({ rango: 'Más de $7 M', orden: 5, total: 0 });
    expect(res.body.total).toBe(17);
  });
});

describe('Dashboard sin token → 401', () => {
  it.each(['/api/admin/dashboard/rangos-precio', '/api/admin/dashboard/estatus'])('GET %s', async (ruta) => {
    const res = await request(app).get(ruta);
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('TOKEN_REQUERIDO');
  });
});
