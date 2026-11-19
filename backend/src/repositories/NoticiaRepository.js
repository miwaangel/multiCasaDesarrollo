const BaseRepository = require('./BaseRepository');
const { Noticia } = require('../models');

const MAS_RECIENTES = [
  ['fechaPublicacion', 'DESC'],
  ['id', 'DESC'],
];

/** Repositorio de noticias de última hora. */
class NoticiaRepository extends BaseRepository {
  constructor() {
    super(Noticia);
  }

  /** Activas, de la más reciente a la más vieja, sin el contenido largo. Regresa { rows, count }. */
  findActivas(limite) {
    return this.model.findAndCountAll({
      where: { activa: true },
      attributes: ['id', 'titulo', 'resumen', 'imagenUrl', 'fechaPublicacion'],
      order: MAS_RECIENTES,
      limit: limite,
    });
  }

  /** Todas (activas e inactivas) para el panel de admin, paginadas. Regresa { rows, count }. */
  findAdmin({ pagina = 1, limite = 10 } = {}) {
    return this.model.findAndCountAll({
      order: MAS_RECIENTES,
      limit: limite,
      offset: (pagina - 1) * limite,
    });
  }
}

module.exports = NoticiaRepository;
