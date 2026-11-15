const Database = require('../src/config/Database');
const { Administrador, Casa } = require('../src/models');
const BaseRepository = require('../src/repositories/BaseRepository');
const CasaRepository = require('../src/repositories/CasaRepository');

afterAll(() => Database.getInstance().close());

const casaValida = {
  titulo: 'Casa en el centro',
  precio: 1500000,
  direccion: 'Calle 1 #10',
  colonia: 'Centro',
  ciudad: 'Hermosillo',
  estado: 'Sonora',
  codigoPostal: '83000',
  lat: 29.072967,
  lng: -110.955919,
};

describe('Casa: validaciones (CHECK del modelo físico)', () => {
  it('acepta una casa válida', async () => {
    await expect(Casa.build(casaValida).validate()).resolves.toBeDefined();
  });

  it.each([
    ['precio', 0, /mayor a 0/],
    ['precio', -10, /mayor a 0/],
    ['codigoPostal', '8300', /5 dígitos/],
    ['codigoPostal', '8300A', /5 dígitos/],
    ['lat', 90.5, /latitud/],
    ['lng', -180.5, /longitud/],
  ])('rechaza %s = %p', async (campo, valor, mensaje) => {
    await expect(Casa.build({ ...casaValida, [campo]: valor }).validate()).rejects.toThrow(mensaje);
  });

  it('mapea camelCase a las columnas snake_case', () => {
    expect(Casa.rawAttributes.m2Terreno.field).toBe('m2_terreno');
    expect(Casa.rawAttributes.codigoPostal.field).toBe('codigo_postal');
    expect(Casa.rawAttributes.creadoEn.field).toBe('creado_en');
  });
});

describe('Administrador: password_hash', () => {
  it('el defaultScope no trae passwordHash y conPassword sí', () => {
    expect(Administrador.options.defaultScope.attributes.exclude).toContain('passwordHash');
    expect(Administrador.options.scopes.conPassword).toBeDefined();
  });

  it('toJSON nunca incluye passwordHash', () => {
    const admin = Administrador.build({ nombre: 'Admin', email: 'a@b.com', passwordHash: 'x' });
    expect(admin.toJSON()).not.toHaveProperty('passwordHash');
  });
});

describe('Relaciones', () => {
  it('Casa tiene imagenes, formasPago, amenidades, mensajes y creador', () => {
    expect(Object.keys(Casa.associations)).toEqual(
      expect.arrayContaining(['imagenes', 'formasPago', 'amenidades', 'mensajes', 'creador']),
    );
    expect(Casa.associations.formasPago.through.model.tableName).toBe('casa_forma_pago');
    expect(Casa.associations.amenidades.through.model.tableName).toBe('casa_amenidad');
  });
});

describe('CasaRepository', () => {
  it('hereda de BaseRepository y usa el modelo Casa', () => {
    const repo = new CasaRepository();
    expect(repo).toBeInstanceOf(BaseRepository);
    expect(repo.model).toBe(Casa);
  });
});
