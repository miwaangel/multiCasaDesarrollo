/**
 * Contador de visitas y conectados contra MySQL (base multicasa_test, tabla visitas vacía).
 * Cada "visitante" se simula con su IP (header X-Forwarded-For, que la app lee con
 * trust proxy) y su navegador (User-Agent).
 */
process.env.VISITAS_SALT = 'sal-solo-para-pruebas';

const crypto = require('crypto');
const request = require('supertest');
const { prepararBaseDePruebas } = require('./helpers/baseDePruebas');
const Database = require('../src/config/Database');
const { Visita } = require('../src/models');
const app = require('../src/app');

const visitante = (ip, navegador) => ({ 'X-Forwarded-For': ip, 'User-Agent': navegador });
const ANA = visitante('201.141.10.20', 'Mozilla/5.0 (Windows NT 10.0) Chrome/130');
const BETO = visitante('187.190.33.4', 'Mozilla/5.0 (iPhone) Safari/18');
const CARLA = visitante('189.203.5.77', 'Mozilla/5.0 (Android 15) Chrome/130');
const hashDe = ({ 'X-Forwarded-For': ip, 'User-Agent': ua }) =>
  crypto.createHash('sha256').update(`${ip}|${ua}|${process.env.VISITAS_SALT}`).digest('hex');

const visitar = (quien, pagina) => request(app).post('/api/visitas').set(quien).send(pagina === undefined ? {} : { pagina });
const resumen = async () => (await request(app).get('/api/visitas/resumen')).body.data;

/** Simula que pasó el tiempo: mueve hacia atrás la fecha de las visitas de ese visitante. */
const retroceder = (quien, segundos) =>
  Visita.update({ fecha: new Date(Date.now() - segundos * 1000) }, { where: { visitanteHash: hashDe(quien) } });

beforeAll(() => prepararBaseDePruebas(), 120000);
afterAll(() => Database.getInstance().close());

describe('POST /api/visitas', () => {
  it('registra la visita → 201 sin datos sensibles; en la BD solo queda el hash, nunca la IP', async () => {
    const res = await visitar(ANA, '/buscar');

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ data: { registrada: true } });

    const filas = await Visita.findAll({ raw: true });
    expect(filas).toHaveLength(1);
    expect(filas[0]).toMatchObject({ pagina: '/buscar', visitanteHash: hashDe(ANA) });
    expect(filas[0].visitanteHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(filas[0])).not.toContain('201.141.10.20');
  });

  it('misma página del mismo visitante en menos de 10 s → no se cuenta (200, registrada: false)', async () => {
    const res = await visitar(ANA, '/buscar');
    expect(res.status).toBe(200);
    expect(res.body.data.registrada).toBe(false);
    expect(await Visita.count()).toBe(1);
  });

  it('dos peticiones simultáneas (React en modo estricto) → solo una se cuenta', async () => {
    const [a, b] = await Promise.all([visitar(ANA, '/inicio'), visitar(ANA, '/inicio')]);
    expect([a.body.data.registrada, b.body.data.registrada].sort()).toEqual([false, true]);
    expect(await Visita.count({ where: { pagina: '/inicio' } })).toBe(1);
  });

  it('el mismo visitante en otra página, u otro visitante en la misma página → sí se cuentan', async () => {
    expect((await visitar(ANA, '/contacto')).status).toBe(201);
    expect((await visitar(BETO, '/buscar')).status).toBe(201);
  });

  it('la misma página del mismo visitante después de 10 s → se vuelve a contar', async () => {
    await retroceder(ANA, 11);
    expect((await visitar(ANA, '/buscar')).status).toBe(201);
  });

  it('sin "pagina" también se registra; una página de más de 150 caracteres → 400', async () => {
    expect((await visitar(CARLA)).status).toBe(201);
    const larga = await visitar(CARLA, `/${'x'.repeat(150)}`);
    expect(larga.status).toBe(400);
    expect(larga.body.error.detalles[0].campo).toBe('pagina');
  });
});

describe('GET /api/visitas/resumen', () => {
  it('visitas = total de registros; conectados = visitantes distintos de los últimos 5 minutos', async () => {
    // Hasta aquí: Ana 5 visitas (2 de /buscar, /inicio, /contacto... y la repetida de /buscar después de 10 s),
    // Beto 1 y Carla 1 → los 3 son visitantes recientes
    const totalRegistros = await Visita.count();
    expect(await resumen()).toEqual({ visitas: totalRegistros, conectados: 3 });

    // Carla se fue hace 10 minutos: sus visitas siguen contando, pero ya no está conectada
    await retroceder(CARLA, 10 * 60);
    expect(await resumen()).toEqual({ visitas: totalRegistros, conectados: 2 });

    // Varias visitas de Beto siguen siendo UN solo conectado
    await visitar(BETO, '/detalle/4');
    await visitar(BETO, '/requisitos');
    expect(await resumen()).toEqual({ visitas: totalRegistros + 2, conectados: 2 });
  });
});
