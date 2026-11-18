const CasaService = require('../services/CasaService');

/** Casas del sitio público (solo en venta). */
class CasaController {
  constructor(service = new CasaService()) {
    this.service = service;
    this.destacadas = this.destacadas.bind(this);
    this.detalle = this.detalle.bind(this);
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
