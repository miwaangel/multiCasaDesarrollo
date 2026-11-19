const { Op } = require('sequelize');
const BaseRepository = require('./BaseRepository');
const { Visita } = require('../models');

/** Repositorio de visitas (contador de Visitas y Conectados de la barra lateral). */
class VisitaRepository extends BaseRepository {
  constructor() {
    super(Visita);
  }

  /** ¿Este visitante ya registró esta página desde `desde`? */
  async existeReciente(visitanteHash, pagina, desde) {
    const visita = await this.findOne({
      where: { visitanteHash, pagina, fecha: { [Op.gte]: desde } },
      attributes: ['id'],
    });
    return Boolean(visita);
  }

  registrar({ visitanteHash, pagina }) {
    return this.create({ visitanteHash, pagina });
  }

  /** Visitas = todos los registros. */
  contarVisitas() {
    return this.count();
  }

  /** Conectados = visitantes distintos (visitante_hash) desde `desde`. */
  contarConectados(desde) {
    return this.count({
      distinct: true,
      col: 'visitanteHash',
      where: { fecha: { [Op.gte]: desde } },
    });
  }
}

module.exports = VisitaRepository;
