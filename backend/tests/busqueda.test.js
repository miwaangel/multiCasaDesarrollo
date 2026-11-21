/**
 * Búsqueda de casas (issue #13).
 * - GeocodingService: pruebas sin BD ni internet (repositorio y fetch falsos).
 * - GET /api/casas/buscar: contra MySQL (base multicasa_test con los seeders).
 *   En NODE_ENV=test Nominatim está apagado: solo se geocodifica con el catálogo.
 */
const request = require('supertest');
const { prepararBaseDePruebas } = require('./helpers/baseDePruebas');
const Database = require('../src/config/Database');
const GeocodingService = require('../src/services/GeocodingService');
const app = require('../src/app');

const buscar = (query = {}) => request(app).get('/api/casas/buscar').query(query);

afterAll(() => Database.getInstance().close());

// ------------------------------------------------------------------ GeocodingService

describe('GeocodingService', () => {
  const CONFIG = { habilitado: true, url: 'https://nominatim.test', userAgent: 'MultiCasa-pruebas', timeoutMs: 1000 };

  function crear({ catalogo = null, respuesta = [], falla = null } = {}) {
    const casaRepository = {
      findCentroPorCodigoPostal: jest.fn().mockResolvedValue(catalogo),
      findCentroPorCiudad: jest.fn().mockResolvedValue(catalogo),
    };
    const fetchFn = jest.fn(async () => {
      if (falla) throw new Error(falla);
      return { ok: true, status: 200, json: async () => respuesta };
    });
    const service = new GeocodingService({ casaRepository, fetchFn, config: CONFIG });
    return { service, casaRepository, fetchFn };
  }

  beforeAll(() => {
    GeocodingService.INTERVALO_MS = 0; // sin esperas entre consultas en las pruebas
  });

  it('usa primero el catálogo (C.P.) y no consulta Nominatim', async () => {
    const { service, casaRepository, fetchFn } = crear({ catalogo: { lat: 25.42, lng: -101 } });

    await expect(service.geocodificar('25000')).resolves.toEqual({ lat: 25.42, lng: -101, fuente: 'catalogo' });
    expect(casaRepository.findCentroPorCodigoPostal).toHaveBeenCalledWith('25000');
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('una ciudad se busca por nombre en el catálogo', async () => {
    const { service, casaRepository } = crear({ catalogo: { lat: 25.67, lng: -100.3 } });

    await service.geocodificar('Monterrey');
    expect(casaRepository.findCentroPorCiudad).toHaveBeenCalledWith('Monterrey');
    expect(casaRepository.findCentroPorCodigoPostal).not.toHaveBeenCalled();
  });

  it('si no está en el catálogo pregunta a Nominatim con postalcode, país MX y User-Agent', async () => {
    const { service, fetchFn } = crear({ respuesta: [{ lat: '25.43', lon: '-100.99' }] });

    await expect(service.geocodificar('25290')).resolves.toEqual({ lat: 25.43, lng: -100.99, fuente: 'nominatim' });

    const [url, opciones] = fetchFn.mock.calls[0];
    expect(url).toContain('https://nominatim.test/search?');
    expect(url).toContain('postalcode=25290');
    expect(url).toContain('countrycodes=mx');
    expect(opciones.headers['User-Agent']).toBe('MultiCasa-pruebas');
  });

  it('guarda en caché: la misma ubicación (sin importar mayúsculas ni acentos) no se consulta dos veces', async () => {
    const { service, fetchFn } = crear({ respuesta: [{ lat: '20.6', lon: '-103.3' }] });

    await service.geocodificar('Querétaro');
    await service.geocodificar('  queretaro ');
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('ubicación inexistente → null (y también queda en caché)', async () => {
    const { service, fetchFn } = crear({ respuesta: [] });

    await expect(service.geocodificar('Ciudad Inventada')).resolves.toBeNull();
    await expect(service.geocodificar('Ciudad Inventada')).resolves.toBeNull();
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('Nominatim caído → 503 GEOCODIFICACION_NO_DISPONIBLE', async () => {
    const { service } = crear({ falla: 'ECONNREFUSED' });

    await expect(service.geocodificar('Puebla')).rejects.toMatchObject({
      status: 503,
      codigo: 'GEOCODIFICACION_NO_DISPONIBLE',
    });
  });

  it('con Nominatim deshabilitado solo usa el catálogo', async () => {
    const { service, fetchFn } = crear();
    service.config = { ...CONFIG, habilitado: false };

    await expect(service.geocodificar('Puebla')).resolves.toBeNull();
    expect(fetchFn).not.toHaveBeenCalled();
  });
});

// ------------------------------------------------------------------ GET /api/casas/buscar

describe('GET /api/casas/buscar', () => {
  beforeAll(() => prepararBaseDePruebas(), 120000);

  it('sin filtros: todas las casas en venta (nunca vendidas), con portada y sin distancia', async () => {
    const res = await buscar();

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(res.body.data.length);
    expect(res.body.total).toBeGreaterThan(0);
    expect(res.body.centro).toBeNull();
    for (const casa of res.body.data) {
      expect(casa.estatus).toBe('venta');
      expect(casa).toHaveProperty('portada');
      expect(casa).toHaveProperty('lat');
      expect(casa).toHaveProperty('lng');
      expect(casa).not.toHaveProperty('distanciaKm');
      expect(casa).not.toHaveProperty('creadoPor');
    }
  });

  it('filtros vacíos ("Todos" / "No importa") = sin filtro', async () => {
    const todas = await buscar();
    const vacios = await buscar({ ubicacion: '', radioKm: '', precioMin: '', precioMax: '', recamaras: '', banos: '' });

    expect(vacios.status).toBe(200);
    expect(vacios.body.total).toBe(todas.body.total);
  });

  it('C.P. + radio: solo casas dentro del radio, de la más cercana a la más lejana', async () => {
    const res = await buscar({ ubicacion: '25000', radioKm: 5 });

    expect(res.status).toBe(200);
    expect(res.body.centro).toMatchObject({ fuente: 'catalogo', radioKm: 5 });
    expect(res.body.total).toBeGreaterThan(1);

    const distancias = res.body.data.map((c) => c.distanciaKm);
    expect(distancias.every((d) => typeof d === 'number' && d <= 5)).toBe(true);
    expect(distancias).toEqual([...distancias].sort((a, b) => a - b));
    expect(res.body.data[0].codigoPostal).toBe('25000');
  });

  it('un radio mayor incluye al menos las mismas casas', async () => {
    const chico = await buscar({ ubicacion: '25000', radioKm: 2 });
    const grande = await buscar({ ubicacion: '25000', radioKm: 20 });

    const idsGrande = grande.body.data.map((c) => c.id);
    expect(grande.body.total).toBeGreaterThanOrEqual(chico.body.total);
    chico.body.data.forEach((c) => expect(idsGrande).toContain(c.id));
  });

  it('ciudad + radio, sin importar mayúsculas, acentos ni nombre completo', async () => {
    const res = await buscar({ ubicacion: 'san pedro garza garcia', radioKm: 10 });

    expect(res.status).toBe(200);
    expect(res.body.centro.fuente).toBe('catalogo');
    expect(res.body.data.some((c) => c.ciudad === 'San Pedro Garza García')).toBe(true);
  });

  it('"Sin rango" con C.P.: solo casas de ese C.P.', async () => {
    const res = await buscar({ ubicacion: '25000' });

    expect(res.status).toBe(200);
    expect(res.body.centro).toBeNull();
    expect(res.body.total).toBeGreaterThan(0);
    res.body.data.forEach((c) => expect(c.codigoPostal).toBe('25000'));
  });

  it('"Sin rango" con ciudad: solo casas de esa ciudad', async () => {
    const res = await buscar({ ubicacion: 'monterrey' });

    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
    res.body.data.forEach((c) => expect(c.ciudad).toBe('Monterrey'));
  });

  it('precio de-a, recámaras y baños mínimos', async () => {
    const filtros = { precioMin: 1000000, precioMax: 3000000, recamaras: 3, banos: 2 };
    const res = await buscar(filtros);

    expect(res.status).toBe(200);
    expect(res.body.total).toBeGreaterThan(0);
    for (const c of res.body.data) {
      expect(c.precio).toBeGreaterThanOrEqual(filtros.precioMin);
      expect(c.precio).toBeLessThanOrEqual(filtros.precioMax);
      expect(c.recamaras).toBeGreaterThanOrEqual(filtros.recamaras);
      expect(c.banos).toBeGreaterThanOrEqual(filtros.banos);
    }
  });

  it('sin coincidencias → 200 con lista vacía', async () => {
    const res = await buscar({ precioMin: 900000000 });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ data: [], total: 0 });
  });

  it('ubicación que no existe (Nominatim apagado en pruebas) → 404 UBICACION_NO_ENCONTRADA', async () => {
    const res = await buscar({ ubicacion: '99999', radioKm: 5 });

    expect(res.status).toBe(404);
    expect(res.body.error.codigo).toBe('UBICACION_NO_ENCONTRADA');
  });

  it.each([
    [{ radioKm: 5 }, 'radioKm'],
    [{ ubicacion: 'Saltillo', radioKm: 7 }, 'radioKm'],
    [{ precioMin: 3000000, precioMax: 1000000 }, 'precioMax'],
    [{ precioMin: 'mucho' }, 'precioMin'],
    [{ recamaras: -1 }, 'recamaras'],
    [{ ubicacion: '%%' }, 'ubicacion'],
  ])('%o → 400 DATOS_INVALIDOS en %s', async (query, campo) => {
    const res = await buscar(query);

    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect(res.body.error.detalles.map((d) => d.campo)).toContain(campo);
  });

  it('/buscar no choca con /api/casas/:id', async () => {
    const res = await buscar({ ubicacion: 'Saltillo' });
    expect(res.status).toBe(200);
  });
});
