const CasaService = require('../services/CasaService');

/** Casas del sitio público (solo en venta). */
class CasaController {
  constructor(service = new CasaService()) {
    this.service = service;
    this.destacadas = this.destacadas.bind(this);
    this.detalle = this.detalle.bind(this);
    this.buscar = this.buscar.bind(this);
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
