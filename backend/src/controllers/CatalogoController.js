const CatalogoService = require('../services/CatalogoService');

/** Catálogos públicos: formas de pago y amenidades. */
class CatalogoController {
  constructor(service = new CatalogoService()) {
    this.service = service;
    this.formasPago = this.formasPago.bind(this);
    this.amenidades = this.amenidades.bind(this);
  }

  async formasPago(req, res) {
    const data = await this.service.listarFormasPago();
    res.json({ data, total: data.length });
  }

  // ?agrupar=tipo → { data: { interior: [...], exterior: [...] } }
  async amenidades(req, res) {
    const agrupar = req.query.agrupar === 'tipo';
    const data = await this.service.listarAmenidades({ agrupar });
    const total = agrupar ? data.interior.length + data.exterior.length : data.length;
    res.json({ data, total });
  }
}

module.exports = CatalogoController;
