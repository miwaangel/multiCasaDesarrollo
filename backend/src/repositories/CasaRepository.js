const BaseRepository = require('./BaseRepository');
const { Casa } = require('../models');

/**
 * Repositorio de casas. Hereda de BaseRepository findAll, findById, create,
 * update, delete... y agrega las consultas propias de Casa.
 */
class CasaRepository extends BaseRepository {
  constructor() {
    super(Casa);
  }

  /** Ficha completa: imágenes (en orden), amenidades y formas de pago. null si no existe. */
  findDetalle(id, options = {}) {
    return this.findById(id, {
      include: [
        { association: 'imagenes' },
        { association: 'amenidades', through: { attributes: [] } },
        { association: 'formasPago', through: { attributes: [] } },
      ],
      order: [
        ['imagenes', 'orden', 'ASC'],
        ['imagenes', 'id', 'ASC'],
      ],
      ...options,
    });
  }
}

module.exports = CasaRepository;
