const AppError = require('../utils/AppError');
const { urlDeArchivo, rutaDeUrl, eliminarArchivos } = require('../utils/archivos');
const CasaRepository = require('../repositories/CasaRepository');
const ImagenCasaRepository = require('../repositories/ImagenCasaRepository');
const AmenidadRepository = require('../repositories/AmenidadRepository');
const FormaPagoRepository = require('../repositories/FormaPagoRepository');
const GeocodingService = require('./GeocodingService');

const casaNoEncontrada = () => AppError.notFound('La casa no existe', 'CASA_NO_ENCONTRADA');

/** Fecha de hoy (YYYY-MM-DD) en la zona horaria de Saltillo / Monterrey. */
function hoy() {
  return new Date().toLocaleDateString('sv-SE', { timeZone: 'America/Monterrey' });
}

/**
 * Reglas de negocio de las casas.
 * - El sitio público solo ve casas en venta.
 * - Alta y edición se hacen en una transacción (casa + imágenes + amenidades + formas de pago);
 *   si algo falla no queda nada a medias en la BD y se borran del disco las imágenes recién subidas.
 * - Vendida ⇒ fecha_venta = hoy y deja de ser destacada. De vuelta a venta ⇒ fecha_venta = null.
 */
class CasaService {
  constructor({
    casaRepository = new CasaRepository(),
    imagenRepository = new ImagenCasaRepository(),
    amenidadRepository = new AmenidadRepository(),
    formaPagoRepository = new FormaPagoRepository(),
    geocodingService = null,
  } = {}) {
    this.casas = casaRepository;
    this.imagenes = imagenRepository;
    this.amenidades = amenidadRepository;
    this.formasPago = formaPagoRepository;
    this.geocoding = geocodingService ?? new GeocodingService({ casaRepository });
  }

  // ------------------------------------------------------------------ sitio público

  async listarDestacadas() {
    const casas = await this.casas.findDestacadas();
    return casas.map((casa) => this.#tarjeta(casa, { publica: true }));
  }

  /**
   * Búsqueda del formulario "Encuentra tu futura propiedad" (issue #13).
   * - ubicacion + radioKm: C.P. / ciudad → coordenadas (GeocodingService) → casas dentro del radio.
   * - ubicacion sin radio ("Sin rango"): solo las casas de ese C.P. o de esa ciudad.
   * - sin ubicacion: todas las casas en venta que cumplan los demás filtros.
   * Regresa { casas, centro }; centro sirve para centrar el mapa (null si no se geocodificó).
   */
  async buscar({ ubicacion, radioKm, ...filtros } = {}) {
    let centro = null;
    const criterios = { ...filtros };

    if (ubicacion && radioKm) {
      centro = await this.geocoding.geocodificar(ubicacion);
      if (!centro) {
        throw AppError.notFound(
          `No encontramos "${ubicacion}". Revisa el C.P. (5 dígitos) o el nombre de la ciudad.`,
          'UBICACION_NO_ENCONTRADA',
        );
      }
      Object.assign(criterios, { centro, radioKm });
    } else if (ubicacion) {
      criterios[/^\d{5}$/.test(ubicacion) ? 'codigoPostal' : 'ciudad'] = ubicacion;
    }

    const casas = await this.casas.buscar(criterios);
    return {
      casas: casas.map((casa) => this.#tarjeta(casa, { publica: true })),
      centro: centro && { ...centro, radioKm },
    };
  }

  async obtenerPublica(id) {
    const casa = await this.casas.findDetalle(id);
    if (!casa || casa.estatus !== 'venta') {
      throw casaNoEncontrada();
    }
    const { creadoPor, ...datos } = casa.toJSON();
    return datos;
  }

  // ------------------------------------------------------------------ admin

  async listarAdmin(filtros) {
    const { rows, count } = await this.casas.findAdmin(filtros);
    return { casas: rows.map((casa) => this.#tarjeta(casa)), total: count };
  }

  async obtenerAdmin(id) {
    const casa = await this.casas.findDetalle(id);
    if (!casa) {
      throw casaNoEncontrada();
    }
    return casa.toJSON();
  }

  /**
   * Alta de una casa. `archivos` son los que dejó multer en req.files; el primero es la portada.
   * `datos` ya viene convertido por el validador (números, booleanos y arreglos de ids).
   */
  async crear(datos, archivos, adminId) {
    const { amenidadIds, formaPagoIds, ...campos } = datos;

    try {
      await this.#validarCatalogos(amenidadIds, formaPagoIds);

      const casaId = await this.casas.transaccion(async (t) => {
        const casa = await this.casas.create(
          { ...campos, ...this.#reglasDeEstatus(campos), creadoPor: adminId },
          { transaction: t },
        );
        await this.imagenes.agregar(casa.id, archivos.map((a) => urlDeArchivo('casas', a.filename)), t);
        if (amenidadIds) {
          await this.casas.reemplazarAmenidades(casa, amenidadIds, t);
        }
        if (formaPagoIds) {
          await this.casas.reemplazarFormasPago(casa, formaPagoIds, t);
        }
        return casa.id;
      });

      return this.obtenerAdmin(casaId);
    } catch (err) {
      // ROLLBACK ya deshizo la BD; ahora se quitan del disco las imágenes que subió esta petición
      await eliminarArchivos(archivos.map((a) => a.path));
      throw err;
    }
  }

  /**
   * Edición. Solo cambia los campos que vienen; las imágenes nuevas se AGREGAN a las existentes;
   * amenidadIds / formaPagoIds, si vienen, REEMPLAZAN las anteriores.
   */
  async actualizar(id, datos, archivos) {
    const { amenidadIds, formaPagoIds, ...campos } = datos;

    try {
      const casa = await this.casas.findById(id);
      if (!casa) {
        throw casaNoEncontrada();
      }
      await this.#validarCatalogos(amenidadIds, formaPagoIds);

      await this.casas.transaccion(async (t) => {
        await casa.update({ ...campos, ...this.#reglasDeEstatus(campos, casa) }, { transaction: t });
        await this.imagenes.agregar(casa.id, archivos.map((a) => urlDeArchivo('casas', a.filename)), t);
        if (amenidadIds) {
          await this.casas.reemplazarAmenidades(casa, amenidadIds, t);
        }
        if (formaPagoIds) {
          await this.casas.reemplazarFormasPago(casa, formaPagoIds, t);
        }
      });

      return this.obtenerAdmin(id);
    } catch (err) {
      await eliminarArchivos(archivos.map((a) => a.path));
      throw err;
    }
  }

  async cambiarEstatus(id, estatus) {
    const casa = await this.casas.findById(id);
    if (!casa) {
      throw casaNoEncontrada();
    }
    await casa.update({ estatus, ...this.#reglasDeEstatus({ estatus }, casa) });
    return this.obtenerAdmin(id);
  }

  /** Borra la casa (la BD borra en cascada imágenes y relaciones) y después sus archivos. */
  async eliminar(id) {
    const casa = await this.casas.findById(id);
    if (!casa) {
      throw casaNoEncontrada();
    }
    const urls = await this.imagenes.findUrlsDeCasa(id);
    await casa.destroy();
    await eliminarArchivos(urls.map(rutaDeUrl));
  }

  /** Borra una imagen y su archivo; si era la portada, la siguiente por orden pasa a serlo. */
  async eliminarImagen(casaId, imagenId) {
    const casa = await this.casas.findById(casaId);
    if (!casa) {
      throw casaNoEncontrada();
    }

    const url = await this.imagenes.transaccion(async (t) => {
      const imagen = await this.imagenes.findDeCasa(imagenId, casaId, t);
      if (!imagen) {
        throw AppError.notFound('La imagen no existe en esta casa', 'IMAGEN_NO_ENCONTRADA');
      }
      await imagen.destroy({ transaction: t });

      if (imagen.esPortada) {
        const siguiente = await this.imagenes.findPrimera(casaId, t);
        if (siguiente) {
          await siguiente.update({ esPortada: true }, { transaction: t });
        }
      }
      return imagen.url;
    });

    // El archivo se borra solo después del COMMIT (si la BD fallara, la imagen seguiría existiendo)
    await eliminarArchivos([rutaDeUrl(url)]);
    return this.obtenerAdmin(casaId);
  }

  // ------------------------------------------------------------------ privados

  async #validarCatalogos(amenidadIds, formaPagoIds) {
    const detalles = [];
    if (amenidadIds?.length && (await this.amenidades.countByIds(amenidadIds)) !== amenidadIds.length) {
      detalles.push({ campo: 'amenidadIds', mensaje: 'Alguna amenidad no existe' });
    }
    if (formaPagoIds?.length && (await this.formasPago.countByIds(formaPagoIds)) !== formaPagoIds.length) {
      detalles.push({ campo: 'formaPagoIds', mensaje: 'Alguna forma de pago no existe' });
    }
    if (detalles.length) {
      throw new AppError(400, 'DATOS_INVALIDOS', 'Revisa los datos enviados', detalles);
    }
  }

  /** Campos que se ajustan solos según el estatus (nuevo o el que ya tenía la casa). */
  #reglasDeEstatus(campos, casaActual = null) {
    const estatus = campos.estatus ?? casaActual?.estatus ?? 'venta';
    if (estatus === 'vendida') {
      const yaEstabaVendida = casaActual?.estatus === 'vendida' && casaActual.fechaVenta;
      return { fechaVenta: yaEstabaVendida ? casaActual.fechaVenta : hoy(), destacada: false };
    }
    return campos.estatus ? { fechaVenta: null } : {};
  }

  /** Datos para listados: la casa sin la lista de imágenes, con la URL de su portada. */
  #tarjeta(casa, { publica = false } = {}) {
    const { imagenes, creadoPor, ...datos } = casa.toJSON();
    return { ...datos, ...(publica ? {} : { creadoPor }), portada: imagenes?.[0]?.url ?? null };
  }
}

module.exports = CasaService;
