const BaseRepository = require('./BaseRepository');
const { FormaPago } = require('../models');

/** Catálogo de formas de pago, con descripción y requisitos. */
class FormaPagoRepository extends BaseRepository {
  constructor() {
    super(FormaPago);
  }

  findCatalogo() {
    return this.findAll({ order: [['id', 'ASC']] });
  }

  /** Cuántos de los ids existen (para validar formaPagoIds). */
  countByIds(ids) {
    return this.count({ where: { id: ids } });
  }
}

module.exports = FormaPagoRepository;
