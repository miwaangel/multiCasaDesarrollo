const env = require('../config/env');
const AppError = require('../utils/AppError');
const CasaRepository = require('../repositories/CasaRepository');
const MensajeContactoRepository = require('../repositories/MensajeContactoRepository');
const MailService = require('./MailService');
const { ASUNTOS } = require('../validators/contacto.validators');

const escaparHtml = (texto = '') =>
  String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const precio = (valor) => `$${Number(valor).toLocaleString('es-MX')}`;

/**
 * Formulario de contacto (issue #14).
 * 1. Guarda el mensaje en mensajes_contacto (así no se pierde aunque falle el correo).
 * 2. Envía un correo a MAIL_TO con los datos; "Responder" le contesta directo al cliente.
 * Si viene casaId (botón "Me interesa"), el correo incluye la casa.
 */
class ContactoService {
  constructor({
    mensajeRepository = new MensajeContactoRepository(),
    casaRepository = new CasaRepository(),
    mailService = new MailService(),
  } = {}) {
    this.mensajes = mensajeRepository;
    this.casas = casaRepository;
    this.mail = mailService;
  }

  async enviar({ nombre, email, telefono, asunto = 'informacion', mensaje, casaId }) {
    const casa = casaId ? await this.casas.findById(casaId) : null;
    if (casaId && !casa) {
      throw new AppError(400, 'DATOS_INVALIDOS', 'Revisa los datos enviados', [
        { campo: 'casaId', mensaje: 'La casa no existe' },
      ]);
    }

    const registro = await this.mensajes.create({
      nombre,
      email,
      telefono: telefono || null,
      asunto,
      mensaje,
      casaId: casa?.id ?? null,
    });

    let correoEnviado = true;
    try {
      await this.mail.enviar({ responderA: `${nombre} <${email}>`, ...this.#correo(registro, casa) });
    } catch (err) {
      correoEnviado = false;
      if (env.nodeEnv !== 'test') {
        console.error(`No se pudo enviar el correo del mensaje ${registro.id}: ${err.message}`);
      }
    }

    return { id: registro.id, correoEnviado };
  }

  #correo(registro, casa) {
    const { id, nombre, email, telefono, asunto, mensaje } = registro;
    const tema = ASUNTOS[asunto] ?? asunto;
    const filas = [
      ['Nombre', nombre],
      ['Correo', email],
      ['Teléfono', telefono || '—'],
      ['Asunto', tema],
      ...(casa
        ? [['Casa', `#${casa.id} ${casa.titulo} · ${casa.colonia}, ${casa.ciudad} · ${precio(casa.precio)} (${casa.estatus})`]]
        : []),
    ];

    const texto = [...filas.map(([k, v]) => `${k}: ${v}`), '', mensaje, '', `Mensaje #${id} guardado en la BD.`].join('\n');
    const html = `
      <div style="font-family:Arial,sans-serif;color:#1d3b53">
        <h2 style="color:#1f6fa8;margin:0 0 12px">Nuevo mensaje desde MultiCasa</h2>
        <table cellpadding="6" style="border-collapse:collapse">
          ${filas.map(([k, v]) => `<tr><th align="left">${k}</th><td>${escaparHtml(v)}</td></tr>`).join('')}
        </table>
        <p style="white-space:pre-line;border-left:4px solid #c8872e;padding-left:12px">${escaparHtml(mensaje)}</p>
        <p style="color:#888;font-size:12px">Mensaje #${id}. Responde este correo para contestarle a ${escaparHtml(nombre)}.</p>
      </div>`;

    return { asunto: `[MultiCasa] ${tema}${casa ? ` · Casa #${casa.id}` : ''} — ${nombre}`, texto, html };
  }
}

module.exports = ContactoService;
