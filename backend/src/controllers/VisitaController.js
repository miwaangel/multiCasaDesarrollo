const { matchedData } = require('express-validator');
const VisitaService = require('../services/VisitaService');

/** Contador de visitas y conectados de la barra lateral (público). */
class VisitaController {
  constructor(service = new VisitaService()) {
    this.service = service;
    this.registrar = this.registrar.bind(this);
    this.resumen = this.resumen.bind(this);
  }

  // 201 si se contó; 200 si se ignoró por repetida. Nunca se regresa la IP ni el hash.
  async registrar(req, res) {
    const { pagina = null } = matchedData(req, { locations: ['body'], includeOptionals: true });
    const { registrada } = await this.service.registrar({
      ip: req.ip,
      userAgent: req.get('user-agent') || '',
      pagina,
    });
    res.status(registrada ? 201 : 200).json({ data: { registrada } });
  }

  async resumen(req, res) {
    const data = await this.service.resumen();
    res.json({ data });
  }
}

module.exports = VisitaController;
