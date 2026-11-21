const { DocumentoPdf } = require('../pdf/DocumentoPdf');
const { rutaDeLectura } = require('../utils/archivos');
const CasaService = require('./CasaService');

const TIPOS = { casa: 'Casa', departamento: 'Departamento', terreno: 'Terreno' };
const capitalizar = (t) => (t ? t.charAt(0).toUpperCase() + t.slice(1) : t);
const dinero = (v) => `$${Number(v).toLocaleString('es-MX')} MXN`;
const m2 = (v) => (v === null || v === undefined ? '—' : `${Number(v).toLocaleString('es-MX')} m2`);

/**
 * Ficha técnica en PDF de una casa en venta (issue #15).
 * Usa las mismas reglas que el detalle público (CasaService.obtenerPublica: solo casas en venta).
 */
class FichaPdfService {
  constructor({ casaService = new CasaService() } = {}) {
    this.casas = casaService;
  }

  /** Regresa { nombreArchivo, pdf (Buffer) }. 404 CASA_NO_ENCONTRADA si no existe o ya se vendió. */
  async generar(id) {
    const casa = await this.casas.obtenerPublica(id);
    const ficha = FichaPdfService.contenido(casa);

    const documento = new DocumentoPdf({ titulo: 'Ficha técnica' })
      .encabezado(`Propiedad #${casa.id}`)
      .titular(casa.titulo, { subtitulo: ficha.ubicacion, destacado: dinero(casa.precio) })
      .etiqueta(`${TIPOS[casa.tipo] ?? casa.tipo} en venta`.toUpperCase())
      .imagen(rutaDeLectura(ficha.portada))
      .seccion('Características')
      .datos(ficha.caracteristicas, { columnas: 3 })
      .seccion('Descripción')
      .parrafo(casa.descripcion)
      .seccion('Amenidades interiores')
      .lista(ficha.interiores, { columnas: 2, vacio: 'Sin amenidades interiores registradas' })
      .seccion('Amenidades exteriores')
      .lista(ficha.exteriores, { columnas: 2, vacio: 'Sin amenidades exteriores registradas' })
      .seccion('Formas de pago aceptadas')
      .bloques(ficha.formasPago, { vacio: 'Consulta las formas de pago con un asesor' })
      .seccion('Ubicación')
      .datos(ficha.ubicacionDetalle, { columnas: 2 })
      .enlace('Ver ubicación en el mapa (OpenStreetMap)', ficha.mapa);

    return { nombreArchivo: `ficha-casa-${casa.id}.pdf`, pdf: await documento.aBuffer() };
  }

  /** Datos ya formateados para la ficha (separado del dibujo para poder probarlo). */
  static contenido(casa) {
    const amenidades = casa.amenidades ?? [];
    const portada = (casa.imagenes ?? []).find((i) => i.esPortada) ?? casa.imagenes?.[0];

    return {
      portada: portada?.url ?? null,
      ubicacion: [casa.colonia, casa.ciudad, casa.estado].filter(Boolean).join(', '),
      caracteristicas: [
        ['Tipo', TIPOS[casa.tipo] ?? casa.tipo],
        ['Terreno', m2(casa.m2Terreno)],
        ['Construcción', m2(casa.m2Construccion)],
        ['Recámaras', casa.recamaras],
        ['Baños', casa.banos],
        ['Estacionamientos', casa.estacionamientos],
        ['Plantas', casa.plantas],
        ['Orientación', capitalizar(casa.orientacion) ?? '—'],
        ['Precio', dinero(casa.precio)],
      ],
      interiores: amenidades.filter((a) => a.tipo === 'interior').map((a) => a.nombre),
      exteriores: amenidades.filter((a) => a.tipo === 'exterior').map((a) => a.nombre),
      formasPago: (casa.formasPago ?? []).map((f) => ({
        titulo: f.nombre,
        texto: [f.descripcion, f.requisitos && `Requisitos: ${f.requisitos}`].filter(Boolean).join('\n'),
      })),
      ubicacionDetalle: [
        ['Dirección', casa.direccion],
        ['Colonia', casa.colonia],
        ['Ciudad', `${casa.ciudad}, ${casa.estado}`],
        ['C.P.', casa.codigoPostal],
      ],
      mapa: `https://www.openstreetmap.org/?mlat=${casa.lat}&mlon=${casa.lng}#map=17/${casa.lat}/${casa.lng}`,
    };
  }
}

module.exports = FichaPdfService;
