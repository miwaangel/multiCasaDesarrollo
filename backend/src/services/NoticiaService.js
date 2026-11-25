const AppError = require('../utils/AppError');
const { urlDeArchivo, rutaDeUrl, eliminarArchivos } = require('../utils/archivos');
const NoticiaRepository = require('../repositories/NoticiaRepository');

const noticiaNoEncontrada = () => AppError.notFound('La noticia no existe', 'NOTICIA_NO_ENCONTRADA');

/**
 * Noticias de última hora (barra lateral).
 * - El sitio público solo ve noticias activas.
 * - La imagen es opcional. Si se sube una nueva, la anterior se borra del disco
 *   (solo después de guardar en la BD); si algo falla, se borra la recién subida.
 */
class NoticiaService {
  constructor(repository = new NoticiaRepository()) {
    this.repository = repository;
  }

  // ------------------------------------------------------------------ sitio público

  async listarActivas(limite = 5) {
    const { rows, count } = await this.repository.findActivas(limite);
    return { noticias: rows.map((n) => n.toJSON()), total: count };
  }

  async obtenerPublica(id) {
    const noticia = await this.repository.findById(id);
    if (!noticia || !noticia.activa) {
      throw noticiaNoEncontrada();
    }
    const { creadoPor, ...datos } = noticia.toJSON();
    return datos;
  }

  // ------------------------------------------------------------------ admin

  async listarAdmin(paginacion) {
    const { rows, count } = await this.repository.findAdmin(paginacion);
    return { noticias: rows.map((n) => n.toJSON()), total: count };
  }

  async obtenerAdmin(id) {
    const noticia = await this.repository.findById(id);
    if (!noticia) {
      throw noticiaNoEncontrada();
    }
    return noticia.toJSON();
  }

  /** `archivo` es la imagen que dejó multer (o undefined si no se subió ninguna). */
  async crear(datos, archivo, adminId) {
    try {
      const noticia = await this.repository.create({
        ...datos,
        ...(archivo ? { imagenUrl: urlDeArchivo('noticias', archivo.filename) } : {}),
        creadoPor: adminId,
      });
      // Se vuelve a leer para regresar todos los campos (create solo trae los que se enviaron)
      return this.obtenerAdmin(noticia.id);
    } catch (err) {
      await eliminarArchivos([archivo?.path]);
      throw err;
    }
  }

  /** Solo cambia los campos que vienen (incluye activar/desactivar con `activa`). */
  async actualizar(id, datos, archivo) {
    try {
      const noticia = await this.repository.findById(id);
      if (!noticia) {
        throw noticiaNoEncontrada();
      }
      const imagenAnterior = noticia.imagenUrl;
      const cambiaImagen = Boolean(archivo);

      await noticia.update({
        ...datos,
        ...(cambiaImagen ? { imagenUrl: urlDeArchivo('noticias', archivo.filename) } : {}),
      });

      if (cambiaImagen) {
        await eliminarArchivos([rutaDeUrl(imagenAnterior)]);
      }
      return noticia.toJSON();
    } catch (err) {
      await eliminarArchivos([archivo?.path]);
      throw err;
    }
  }

  /** Borra la noticia y, si tenía imagen subida por la API, su archivo. */
  async eliminar(id) {
    const noticia = await this.repository.findById(id);
    if (!noticia) {
      throw noticiaNoEncontrada();
    }
    const imagen = noticia.imagenUrl;
    await noticia.destroy();
    await eliminarArchivos([rutaDeUrl(imagen)]);
  }
}

module.exports = NoticiaService;
