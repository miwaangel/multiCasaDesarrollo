const { Op } = require('sequelize');
const BaseRepository = require('./BaseRepository');
const { Casa } = require('../models');

// Solo la imagen de portada (para listados y tarjetas)
const INCLUDE_PORTADA = {
  association: 'imagenes',
  where: { esPortada: true },
  required: false,
  attributes: ['id', 'url'],
};

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
        ['amenidades', 'tipo', 'ASC'],
        ['amenidades', 'nombre', 'ASC'],
        ['formasPago', 'id', 'ASC'],
      ],
      ...options,
    });
  }

  /** Casas en venta marcadas como destacadas, con su portada (slider del Inicio). */
  findDestacadas() {
    return this.findAll({
      where: { estatus: 'venta', destacada: true },
      include: [INCLUDE_PORTADA],
      order: [['actualizadoEn', 'DESC']],
    });
  }

  /**
   * Listado del panel de admin (venta y vendidas) con portada.
   * Filtros opcionales: estatus, busqueda (en título o colonia). Regresa { rows, count }.
   */
  findAdmin({ estatus, busqueda, pagina = 1, limite = 10 } = {}) {
    const where = {};
    if (estatus) {
      where.estatus = estatus;
    }
    if (busqueda) {
      const patron = `%${busqueda}%`;
      where[Op.or] = [{ titulo: { [Op.like]: patron } }, { colonia: { [Op.like]: patron } }];
    }

    return this.model.findAndCountAll({
      where,
      include: [INCLUDE_PORTADA],
      order: [
        ['creadoEn', 'DESC'],
        ['id', 'DESC'],
      ],
      limit: limite,
      offset: (pagina - 1) * limite,
      distinct: true,
    });
  }

  /** Reemplaza todas las amenidades de la casa por las de `ids` (tabla casa_amenidad). */
  reemplazarAmenidades(casa, ids, transaction) {
    return casa.setAmenidades(ids, { transaction });
  }

  /** Reemplaza todas las formas de pago de la casa por las de `ids` (tabla casa_forma_pago). */
  reemplazarFormasPago(casa, ids, transaction) {
    return casa.setFormasPago(ids, { transaction });
  }
}

module.exports = CasaRepository;
