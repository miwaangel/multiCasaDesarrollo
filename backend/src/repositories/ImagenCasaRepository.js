const BaseRepository = require('./BaseRepository');
const { ImagenCasa } = require('../models');

/** Repositorio de las imágenes de cada casa (tabla imagenes_casa). */
class ImagenCasaRepository extends BaseRepository {
  constructor() {
    super(ImagenCasa);
  }

  /**
   * Agrega imágenes al final de las que ya tiene la casa (orden siguiente).
   * Si la casa todavía no tiene portada, la primera imagen nueva se vuelve portada.
   */
  async agregar(casaId, urls, transaction) {
    if (!urls.length) {
      return [];
    }
    const ordenMaximo = (await this.model.max('orden', { where: { casaId }, transaction })) || 0;
    const tienePortada = (await this.count({ where: { casaId, esPortada: true }, transaction })) > 0;

    const filas = urls.map((url, i) => ({
      casaId,
      url,
      orden: ordenMaximo + i + 1,
      esPortada: !tienePortada && i === 0,
    }));
    return this.model.bulkCreate(filas, { transaction });
  }

  /** Imagen `imagenId` siempre que pertenezca a la casa `casaId`; null si no. */
  findDeCasa(imagenId, casaId, transaction) {
    return this.findOne({ where: { id: imagenId, casaId }, transaction });
  }

  /** Primera imagen de la casa por orden (la que hereda la portada). */
  findPrimera(casaId, transaction) {
    return this.findOne({
      where: { casaId },
      order: [
        ['orden', 'ASC'],
        ['id', 'ASC'],
      ],
      transaction,
    });
  }

  /** URLs de todas las imágenes de una casa (para borrar sus archivos). */
  async findUrlsDeCasa(casaId) {
    const imagenes = await this.findAll({ where: { casaId }, attributes: ['url'] });
    return imagenes.map((i) => i.url);
  }
}

module.exports = ImagenCasaRepository;
