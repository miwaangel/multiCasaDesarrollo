const { DashboardService } = require('../services/DashboardService');

/** Datos de las gráficas del dashboard del administrador. */
class DashboardController {
  constructor(service = new DashboardService()) {
    this.service = service;
    this.rangosPrecio = this.rangosPrecio.bind(this);
    this.estatus = this.estatus.bind(this);
  }

  // total = número de casas (suma de los 5 rangos), útil para calcular porcentajes
  async rangosPrecio(req, res) {
    const data = await this.service.rangosPrecio();
    res.json({ data, total: data.reduce((suma, r) => suma + r.total, 0) });
  }

  async estatus(req, res) {
    const data = await this.service.estatus();
    res.json({ data });
  }
}

module.exports = DashboardController;
