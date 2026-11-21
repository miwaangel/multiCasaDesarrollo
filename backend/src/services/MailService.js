const nodemailer = require('nodemailer');
const env = require('../config/env');

/**
 * Envío de correos con nodemailer.
 *
 * - Con MAIL_HOST configurado: SMTP real (con Gmail: smtp.gmail.com + contraseña de aplicación).
 * - Sin MAIL_HOST (desarrollo / pruebas): no sale ningún correo; nodemailer solo arma el
 *   mensaje (jsonTransport) y en desarrollo se imprime en consola para revisarlo.
 */
class MailService {
  constructor({ config = env.mail, transporter = null } = {}) {
    this.config = config;
    this.configurado = Boolean(config.host);
    this.transporter = transporter ?? MailService.#crearTransporter(config);
  }

  static #crearTransporter(config) {
    if (!config.host) {
      return nodemailer.createTransport({ jsonTransport: true });
    }
    return nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.port === 465, // 465 = SSL; 587 = STARTTLS
      auth: { user: config.user, pass: config.password },
    });
  }

  /** Envía { para, responderA, asunto, texto, html }. Regresa el resultado de nodemailer. */
  async enviar({ para = this.config.to, responderA, asunto, texto, html }) {
    const info = await this.transporter.sendMail({
      from: this.config.from || this.config.user || 'MultiCasa <no-reply@multicasa.local>',
      to: para,
      replyTo: responderA,
      subject: asunto,
      text: texto,
      html,
    });

    if (!this.configurado && env.nodeEnv === 'development') {
      console.log(`[correo sin enviar: falta MAIL_HOST] ${asunto} → ${para || '(sin MAIL_TO)'}`);
    }
    return info;
  }
}

module.exports = MailService;
