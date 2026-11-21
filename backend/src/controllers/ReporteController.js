const ReporteService = require('../services/ReporteService');

/** Reportes del administrador (rutas protegidas con el token). */
class ReporteController {
  constructor(service = new ReporteService()) {
    this.service = service;
    this.casas = this.casas.bind(this);
  }

  async casas(req, res) {
    const { formato = 'pdf', estatus } = req.query;
    const { archivo, contentType, nombreArchivo } = await this.service.reporteCasas({
      formato,
      estatus: estatus || undefined,
      generadoPor: req.admin.email,
    });

    res
      .type(contentType)
      .set('Content-Disposition', `attachment; filename="${nombreArchivo}"`)
      .set('Content-Length', archivo.length)
      .send(archivo);
  }
}

module.exports = ReporteController;
