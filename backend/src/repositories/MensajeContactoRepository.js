const BaseRepository = require('./BaseRepository');
const { MensajeContacto } = require('../models');

/** Mensajes del formulario de contacto (tabla mensajes_contacto). */
class MensajeContactoRepository extends BaseRepository {
  constructor() {
    super(MensajeContacto);
  }
}

module.exports = MensajeContactoRepository;
