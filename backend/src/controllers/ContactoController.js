const ContactoService = require('../services/ContactoService');

/** Formulario de contacto del sitio público. */
class ContactoController {
  constructor(service = new ContactoService()) {
    this.service = service;
    this.enviar = this.enviar.bind(this);
  }

  async enviar(req, res) {
    // Campo trampa: es invisible para las personas; si viene lleno lo llenó un bot.
    // Se responde igual que un envío correcto para no darle pistas, pero no se guarda nada.
    if (req.body.sitioWeb) {
      return res.status(201).json({ data: { id: null, correoEnviado: true } });
    }

    const { nombre, email, telefono, asunto, mensaje, casaId } = req.body;
    const data = await this.service.enviar({ nombre, email, telefono, asunto, mensaje, casaId });
    return res.status(201).json({ data });
  }
}

module.exports = ContactoController;
