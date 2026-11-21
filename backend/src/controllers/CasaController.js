const CasaService = require('../services/CasaService');
const FichaPdfService = require('../services/FichaPdfService');

/** Casas del sitio público (solo en venta). */
class CasaController {
  constructor(service = new CasaService(), fichaPdf = new FichaPdfService({ casaService: service })) {
    this.service = service;
    this.fichaPdf = fichaPdf;
    this.destacadas = this.destacadas.bind(this);
    this.detalle = this.detalle.bind(this);
    this.buscar = this.buscar.bind(this);
    this.pdf = this.pdf.bind(this);
  }

  /** Ficha técnica en PDF. ?descargar=1 la baja como archivo; si no, se abre en el navegador. */
  async pdf(req, res) {
    const { nombreArchivo, pdf } = await this.fichaPdf.generar(req.params.id);
    const disposicion = req.query.descargar ? 'attachment' : 'inline';
    res
      .type('application/pdf')
      .set('Content-Disposition', `${disposicion}; filename="${nombreArchivo}"`)
      .set('Content-Length', pdf.length)
      .send(pdf);
  }

  async buscar(req, res) {
    const { ubicacion, radioKm, precioMin, precioMax, recamaras, banos } = req.query;
    const { casas, centro } = await this.service.buscar({
      ubicacion: ubicacion || undefined,
      radioKm: radioKm || undefined,
      precioMin: precioMin === '' ? undefined : precioMin,
      precioMax: precioMax === '' ? undefined : precioMax,
      recamaras: recamaras === '' ? undefined : recamaras,
      banos: banos === '' ? undefined : banos,
    });
    res.json({ data: casas, total: casas.length, centro });
  }

  async destacadas(req, res) {
    const data = await this.service.listarDestacadas();
    res.json({ data, total: data.length });
  }

  async detalle(req, res) {
    const data = await this.service.obtenerPublica(req.params.id);
    res.json({ data });
  }
}

module.exports = CasaController;
