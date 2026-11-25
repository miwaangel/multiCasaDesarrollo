// Secreto propio de las pruebas: no dependen del .env de cada quien
process.env.JWT_SECRET = 'secreto-solo-para-pruebas';
process.env.JWT_EXPIRES_IN = '8h';

const request = require('supertest');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Database = require('../src/config/Database');
const AdministradorRepository = require('../src/repositories/AdministradorRepository');
const app = require('../src/app');

// Las pruebas no usan MySQL: el repositorio se reemplaza por datos en memoria
const adminBD = {
  id: 1,
  nombre: 'Administrador',
  email: 'admin@multicasa.com',
  activo: true,
  passwordHash: bcrypt.hashSync('Admin123!', 4),
};

const findByEmail = jest.spyOn(AdministradorRepository.prototype, 'findByEmailConPassword');
const findById = jest.spyOn(AdministradorRepository.prototype, 'findById');

beforeEach(() => {
  findByEmail.mockReset();
  findById.mockReset();
  findByEmail.mockImplementation(async (email) => (email === adminBD.email ? { ...adminBD } : null));
  findById.mockImplementation(async (id) => (id === adminBD.id ? { ...adminBD } : null));
});

afterAll(() => Database.getInstance().close());

const login = (body) => request(app).post('/api/auth/login').send(body);

describe('POST /api/auth/login', () => {
  it('login correcto → 200 con token y datos del admin (sin password)', async () => {
    const res = await login({ email: 'admin@multicasa.com', password: 'Admin123!' });

    expect(res.status).toBe(200);
    expect(res.body.data.admin).toEqual({ id: 1, nombre: 'Administrador', email: 'admin@multicasa.com' });
    expect(JSON.stringify(res.body)).not.toMatch(/password/i);

    const payload = jwt.verify(res.body.data.token, process.env.JWT_SECRET);
    expect(payload).toMatchObject({ id: 1, email: 'admin@multicasa.com' });
    expect(payload.exp - payload.iat).toBe(8 * 60 * 60);
  });

  it('el email se acepta con mayúsculas y espacios', async () => {
    const res = await login({ email: '  Admin@MultiCasa.com ', password: 'Admin123!' });
    expect(res.status).toBe(200);
    expect(findByEmail).toHaveBeenCalledWith('admin@multicasa.com');
  });

  it('contraseña incorrecta → 401 CREDENCIALES_INVALIDAS', async () => {
    const res = await login({ email: 'admin@multicasa.com', password: 'otra' });

    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('CREDENCIALES_INVALIDAS');
    expect(res.body.data).toBeUndefined();
  });

  it('email inexistente → mismo 401 y mismo mensaje que contraseña incorrecta', async () => {
    const malPassword = await login({ email: 'admin@multicasa.com', password: 'otra' });
    const noExiste = await login({ email: 'nadie@multicasa.com', password: 'Admin123!' });

    expect(noExiste.status).toBe(401);
    expect(noExiste.body).toEqual(malPassword.body);
  });

  it('admin inactivo → mismo 401 aunque la contraseña sea correcta', async () => {
    findByEmail.mockResolvedValue({ ...adminBD, activo: false });
    const res = await login({ email: 'admin@multicasa.com', password: 'Admin123!' });

    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('CREDENCIALES_INVALIDAS');
  });

  it('datos inválidos → 400 DATOS_INVALIDOS con el detalle de cada campo', async () => {
    const res = await login({ email: 'no-es-email' });

    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect(res.body.error.detalles).toEqual([
      { campo: 'email', mensaje: 'El email no es válido' },
      { campo: 'password', mensaje: 'La contraseña es obligatoria' },
    ]);
    expect(findByEmail).not.toHaveBeenCalled();
  });

  it('cuerpo vacío → 400 con email y password obligatorios', async () => {
    const res = await login({});

    expect(res.status).toBe(400);
    expect(res.body.error.detalles.map((d) => d.campo)).toEqual(['email', 'password']);
  });
});

describe('GET /api/admin/perfil (middleware auth)', () => {
  const perfil = (header) => {
    const req = request(app).get('/api/admin/perfil');
    return header ? req.set('Authorization', header) : req;
  };
  const firmar = (payload, opciones = {}, secreto = process.env.JWT_SECRET) =>
    jwt.sign(payload, secreto, { expiresIn: '1h', ...opciones });

  it('sin token → 401 TOKEN_REQUERIDO', async () => {
    const res = await perfil();
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('TOKEN_REQUERIDO');
  });

  it('header sin "Bearer" → 401 TOKEN_REQUERIDO', async () => {
    const res = await perfil('Basic abc123');
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('TOKEN_REQUERIDO');
  });

  it('token inválido → 401 TOKEN_INVALIDO', async () => {
    const res = await perfil('Bearer esto.no.es-un-token');
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('TOKEN_INVALIDO');
  });

  it('token firmado con otro secreto → 401 TOKEN_INVALIDO', async () => {
    const res = await perfil(`Bearer ${firmar({ id: 1, email: adminBD.email }, {}, 'otro-secreto')}`);
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('TOKEN_INVALIDO');
  });

  it('token vencido → 401 TOKEN_INVALIDO', async () => {
    const haceUnMinuto = Math.floor(Date.now() / 1000) - 60;
    const vencido = jwt.sign({ id: 1, email: adminBD.email, exp: haceUnMinuto }, process.env.JWT_SECRET);
    const res = await perfil(`Bearer ${vencido}`);
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('TOKEN_INVALIDO');
  });

  it('token válido de un admin desactivado → 401 TOKEN_INVALIDO', async () => {
    findById.mockResolvedValue({ ...adminBD, activo: false });
    const res = await perfil(`Bearer ${firmar({ id: 1, email: adminBD.email })}`);
    expect(res.status).toBe(401);
    expect(res.body.error.codigo).toBe('TOKEN_INVALIDO');
  });

  it('token válido → 200 con los datos del admin', async () => {
    const { body } = await login({ email: 'admin@multicasa.com', password: 'Admin123!' });
    const res = await perfil(`Bearer ${body.data.token}`);

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ data: { id: 1, nombre: 'Administrador', email: 'admin@multicasa.com' } });
  });
});
