const BaseRepository = require('./BaseRepository');
const { Amenidad } = require('../models');

/** Catálogo de amenidades (interior / exterior). */
class AmenidadRepository extends BaseRepository {
  constructor() {
    super(Amenidad);
  }

  findCatalogo() {
    return this.findAll({
      order: [
        ['tipo', 'ASC'],
        ['nombre', 'ASC'],
      ],
    });
  }

  /** Cuántos de los ids existen (para validar amenidadIds). */
  countByIds(ids) {
    return this.count({ where: { id: ids } });
  }
}

module.exports = AmenidadRepository;
