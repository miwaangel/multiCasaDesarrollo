/**
 * Formulario de contacto (issue #14).
 * - ContactoService y MailService: sin BD ni SMTP (repositorios y transporter falsos).
 * - POST /api/contacto: contra MySQL (base multicasa_test). El envío de correo se simula
 *   para que las pruebas nunca manden correos reales aunque backend/.env tenga MAIL_HOST.
 */
const request = require('supertest');
const { prepararBaseDePruebas } = require('./helpers/baseDePruebas');
const Database = require('../src/config/Database');
const MailService = require('../src/services/MailService');
const ContactoService = require('../src/services/ContactoService');
const app = require('../src/app');

afterAll(() => Database.getInstance().close());

const valido = {
  nombre: 'Ana López',
  email: 'ana@correo.com',
  telefono: '844 123 4567',
  asunto: 'informacion',
  mensaje: 'Me gustaría agendar una visita esta semana.',
};

// ------------------------------------------------------------------ MailService

describe('MailService', () => {
  it('sin MAIL_HOST no usa SMTP: solo arma el correo (jsonTransport)', async () => {
    const mail = new MailService({ config: { host: '', to: 'ventas@multicasa.com' } });
    const info = await mail.enviar({ asunto: 'Prueba', texto: 'Hola', responderA: 'ana@correo.com' });

    expect(mail.configurado).toBe(false);
    const enviado = JSON.parse(info.message);
    expect(enviado.subject).toBe('Prueba');
    expect(enviado.to[0].address).toBe('ventas@multicasa.com');
    expect(enviado.replyTo[0].address).toBe('ana@correo.com');
  });
});

// ------------------------------------------------------------------ ContactoService

describe('ContactoService', () => {
  const casa = { id: 3, titulo: 'Casa <Bonita>', colonia: 'Centro', ciudad: 'Saltillo', precio: 980000, estatus: 'venta' };

  function crear({ casaExiste = true, correoFalla = false } = {}) {
    const mensajeRepository = { create: jest.fn(async (datos) => ({ id: 7, ...datos })) };
    const casaRepository = { findById: jest.fn(async () => (casaExiste ? casa : null)) };
    const mailService = {
      enviar: jest.fn(async () => {
        if (correoFalla) throw new Error('SMTP caído');
      }),
    };
    const service = new ContactoService({ mensajeRepository, casaRepository, mailService });
    return { service, mensajeRepository, mailService };
  }

  it('guarda el mensaje y envía el correo con "Responder" al cliente', async () => {
    const { service, mensajeRepository, mailService } = crear();

    await expect(service.enviar(valido)).resolves.toEqual({ id: 7, correoEnviado: true });
    expect(mensajeRepository.create).toHaveBeenCalledWith(expect.objectContaining({ email: 'ana@correo.com', casaId: null }));

    const correo = mailService.enviar.mock.calls[0][0];
    expect(correo.responderA).toBe('Ana López <ana@correo.com>');
    expect(correo.asunto).toContain('Solicitar información');
    expect(correo.texto).toContain(valido.mensaje);
  });

  it('con casaId incluye la casa en el correo y escapa el HTML', async () => {
    const { service, mailService } = crear();

    await service.enviar({ ...valido, casaId: 3, mensaje: '<script>alert(1)</script> me interesa' });
    const correo = mailService.enviar.mock.calls[0][0];

    expect(correo.asunto).toContain('Casa #3');
    expect(correo.html).toContain('Casa &lt;Bonita&gt;');
    expect(correo.html).not.toContain('<script>');
  });

  it('casa inexistente → 400 sin guardar nada', async () => {
    const { service, mensajeRepository } = crear({ casaExiste: false });

    await expect(service.enviar({ ...valido, casaId: 999 })).rejects.toMatchObject({ status: 400, codigo: 'DATOS_INVALIDOS' });
    expect(mensajeRepository.create).not.toHaveBeenCalled();
  });

  it('si el correo falla el mensaje ya quedó guardado: correoEnviado = false', async () => {
    const { service, mensajeRepository } = crear({ correoFalla: true });

    await expect(service.enviar(valido)).resolves.toEqual({ id: 7, correoEnviado: false });
    expect(mensajeRepository.create).toHaveBeenCalled();
  });
});

// ------------------------------------------------------------------ POST /api/contacto

describe('POST /api/contacto', () => {
  const { MensajeContacto } = require('../src/models');
  const enviar = (datos) => request(app).post('/api/contacto').send(datos);
  let espiaCorreo;

  beforeAll(() => prepararBaseDePruebas(), 120000);
  beforeEach(() => {
    espiaCorreo = jest.spyOn(MailService.prototype, 'enviar').mockResolvedValue({});
  });
  afterEach(() => espiaCorreo.mockRestore());

  it('201: guarda el mensaje en mensajes_contacto y manda el correo', async () => {
    const res = await enviar(valido);

    expect(res.status).toBe(201);
    expect(res.body.data).toMatchObject({ correoEnviado: true });

    const guardado = await MensajeContacto.findByPk(res.body.data.id);
    expect(guardado).toMatchObject({ nombre: 'Ana López', email: 'ana@correo.com', asunto: 'informacion', leido: false });
    expect(espiaCorreo).toHaveBeenCalledTimes(1);
  });

  it('botón "Me interesa": guarda casaId', async () => {
    const res = await enviar({ ...valido, casaId: 1 });

    expect(res.status).toBe(201);
    const guardado = await MensajeContacto.findByPk(res.body.data.id);
    expect(guardado.casaId).toBe(1);
  });

  it('sin asunto usa "informacion"; sin teléfono guarda null', async () => {
    const { asunto, telefono, ...sinOpcionales } = valido;
    const res = await enviar(sinOpcionales);

    const guardado = await MensajeContacto.findByPk(res.body.data.id);
    expect(guardado).toMatchObject({ asunto: 'informacion', telefono: null });
  });

  it('el correo falla → 201 igual, con correoEnviado = false', async () => {
    espiaCorreo.mockRejectedValue(new Error('SMTP caído'));
    const res = await enviar(valido);

    expect(res.status).toBe(201);
    expect(res.body.data.correoEnviado).toBe(false);
  });

  it('campo trampa lleno (bot) → 201 pero no guarda ni envía', async () => {
    const antes = await MensajeContacto.count();
    const res = await enviar({ ...valido, sitioWeb: 'http://spam.example' });

    expect(res.status).toBe(201);
    expect(await MensajeContacto.count()).toBe(antes);
    expect(espiaCorreo).not.toHaveBeenCalled();
  });

  it.each([
    [{ nombre: '' }, 'nombre'],
    [{ email: 'no-es-correo' }, 'email'],
    [{ telefono: 'abc' }, 'telefono'],
    [{ asunto: 'Me interesa la casa' }, 'asunto'],
    [{ mensaje: 'hola' }, 'mensaje'],
    [{ casaId: 'x' }, 'casaId'],
    [{ casaId: 9999 }, 'casaId'],
  ])('%o → 400 en %s', async (cambio, campo) => {
    const res = await enviar({ ...valido, ...cambio });

    expect(res.status).toBe(400);
    expect(res.body.error.codigo).toBe('DATOS_INVALIDOS');
    expect(res.body.error.detalles.map((d) => d.campo)).toContain(campo);
    expect(espiaCorreo).not.toHaveBeenCalled();
  });
});
