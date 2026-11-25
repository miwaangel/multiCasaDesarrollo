const { Op, literal, fn, col, where: sqlWhere } = require('sequelize');
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

  /**
   * Búsqueda pública (solo casas en venta) con su portada.
   *
   * - centro + radioKm: casas a máximo radioKm del centro (ST_Distance_Sphere), con distanciaKm,
   *   ordenadas de la más cercana a la más lejana.
   * - codigoPostal o ciudad (sin radio): filtro exacto por C.P. o por nombre de ciudad.
   * - precioMin, precioMax, recamaras, banos: mínimos / máximos; si no vienen, no filtran.
   */
  buscar({ centro, radioKm, codigoPostal, ciudad, precioMin, precioMax, recamaras, banos } = {}) {
    const where = { estatus: 'venta' };
    const attributes = { include: [] };
    let order = [
      ['precio', 'ASC'],
      ['id', 'ASC'],
    ];

    if (precioMin !== undefined || precioMax !== undefined) {
      where.precio = {
        ...(precioMin !== undefined && { [Op.gte]: precioMin }),
        ...(precioMax !== undefined && { [Op.lte]: precioMax }),
      };
    }
    if (recamaras !== undefined) {
      where.recamaras = { [Op.gte]: recamaras };
    }
    if (banos !== undefined) {
      where.banos = { [Op.gte]: banos };
    }

    if (centro && radioKm) {
      const metros = this.#distanciaEnMetros(centro);
      attributes.include.push([literal(`ROUND(${metros} / 1000, 2)`), 'distanciaKm']);
      where[Op.and] = [sqlWhere(literal(metros), Op.lte, radioKm * 1000)];
      order = [[literal('distanciaKm'), 'ASC'], ['id', 'ASC']];
    } else if (codigoPostal) {
      where.codigoPostal = codigoPostal;
    } else if (ciudad) {
      where.ciudad = { [Op.like]: `%${ciudad}%` };
    }

    return this.findAll({ attributes, where, include: [INCLUDE_PORTADA], order });
  }

  /**
   * Todas las casas para el reporte del admin (issue #17), sin imágenes ni relaciones.
   * Primero las que siguen en venta, después las vendidas; dentro de cada grupo por id.
   */
  findParaReporte({ estatus } = {}) {
    return this.findAll({
      attributes: [
        'id', 'titulo', 'tipo', 'colonia', 'ciudad', 'estado', 'codigoPostal', 'precio', 'recamaras',
        'banos', 'm2Terreno', 'm2Construccion', 'estatus', 'destacada', 'fechaVenta', 'creadoEn',
      ],
      where: estatus ? { estatus } : {},
      order: [
        ['estatus', 'ASC'], // ENUM('venta', 'vendida'): MySQL ordena por la posición en el ENUM
        ['id', 'ASC'],
      ],
      raw: true,
    });
  }

  /** Centro (promedio de lat / lng) de las casas con ese C.P. null si no hay ninguna. */
  findCentroPorCodigoPostal(codigoPostal) {
    return this.#centro({ codigoPostal });
  }

  /**
   * Centro de las casas cuya ciudad contiene el texto ("san pedro" → San Pedro Garza García).
   * La collation utf8mb4_unicode_ci ignora mayúsculas y acentos. null si no hay ninguna.
   */
  findCentroPorCiudad(ciudad) {
    return this.#centro({ ciudad: { [Op.like]: `%${ciudad}%` } });
  }

  async #centro(where) {
    const fila = await this.model.findOne({
      attributes: [
        [fn('AVG', col('lat')), 'lat'],
        [fn('AVG', col('lng')), 'lng'],
      ],
      where,
      raw: true,
    });
    if (fila?.lat === null || fila?.lat === undefined) {
      return null;
    }
    return { lat: Number(fila.lat), lng: Number(fila.lng) };
  }

  /** Expresión SQL con la distancia en metros de cada casa al centro (POINT es lng, lat). */
  #distanciaEnMetros({ lat, lng }) {
    const { sequelize } = this.model;
    return `ST_Distance_Sphere(POINT(Casa.lng, Casa.lat), POINT(${sequelize.escape(Number(lng))}, ${sequelize.escape(Number(lat))}))`;
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
