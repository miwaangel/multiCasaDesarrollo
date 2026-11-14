const request = require('supertest');
const Database = require('../src/config/Database');
const BaseRepository = require('../src/repositories/BaseRepository');

jest.spyOn(Database.prototype, 'isConnected').mockResolvedValue(true);

const app = require('../src/app');

afterAll(() => Database.getInstance().close());

describe('GET /api/health', () => {
  it('responde 200 con el formato { data }', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ estado: 'ok', baseDeDatos: 'conectada' });
  });
});

describe('Errores', () => {
  it('ruta inexistente → 404 con el formato { error: { codigo, mensaje } }', async () => {
    const res = await request(app).get('/api/no-existe');

    expect(res.status).toBe(404);
    expect(res.body.error.codigo).toBe('RUTA_NO_ENCONTRADA');
    expect(typeof res.body.error.mensaje).toBe('string');
  });

  it('JSON mal formado → 400', async () => {
    const res = await request(app)
      .post('/api/health')
      .set('Content-Type', 'application/json')
      .send('{malo');

    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('JSON_INVALIDO');
  });
});

describe('Database (Singleton)', () => {
  it('getInstance siempre regresa la misma instancia', () => {
    expect(Database.getInstance()).toBe(Database.getInstance());
  });

  it('no se puede crear con new', () => {
    expect(() => new Database()).toThrow(/Singleton/);
  });
});

describe('BaseRepository', () => {
  const fakeModel = { name: 'Casa', findByPk: jest.fn() };
  class CasaRepository extends BaseRepository {
    constructor() {
      super(fakeModel);
    }
  }

  it('es abstracta', () => {
    expect(() => new BaseRepository(fakeModel)).toThrow(/abstracta/);
  });

  it('findByIdOrFail lanza 404 si no existe', async () => {
    fakeModel.findByPk.mockResolvedValue(null);
    await expect(new CasaRepository().findByIdOrFail(99)).rejects.toMatchObject({ status: 404 });
  });
});
