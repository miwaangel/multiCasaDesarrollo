const HealthService = require('../services/HealthService');

/**
 * Capa Controller: lee req, llama al service y responde { data }.
 * Sin lógica de negocio ni consultas a la BD.
 */
class HealthController {
  constructor(service = new HealthService()) {
    this.service = service;
    this.getEstado = this.getEstado.bind(this);
  }

  async getEstado(req, res) {
    const data = await this.service.getEstado();
    res.json({ data });
  }
}

module.exports = HealthController;
