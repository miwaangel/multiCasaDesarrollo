const { matchedData } = require('express-validator');
const CasaService = require('../services/CasaService');

// Solo los campos que tienen regla de validación (ya convertidos); un campo vacío opcional llega como null
const datosDelBody = (req) => matchedData(req, { locations: ['body'], includeOptionals: true });

/** CRUD de casas del panel de administración (rutas protegidas con token). */
class AdminCasaController {
  constructor(service = new CasaService()) {
    this.service = service;
    for (const metodo of ['listar', 'obtener', 'crear', 'actualizar', 'cambiarEstatus', 'eliminar', 'eliminarImagen']) {
      this[metodo] = this[metodo].bind(this);
    }
  }

  async listar(req, res) {
    const { estatus, busqueda, pagina = 1, limite = 10 } = matchedData(req, { locations: ['query'] });
    const { casas, total } = await this.service.listarAdmin({ estatus, busqueda, pagina, limite });
    res.json({ data: casas, total, pagina, limite });
  }

  async obtener(req, res) {
    const data = await this.service.obtenerAdmin(req.params.id);
    res.json({ data });
  }

  async crear(req, res) {
    const data = await this.service.crear(datosDelBody(req), req.files, req.admin.id);
    res.status(201).json({ data });
  }

  async actualizar(req, res) {
    const data = await this.service.actualizar(req.params.id, datosDelBody(req), req.files);
    res.json({ data });
  }

  async cambiarEstatus(req, res) {
    const data = await this.service.cambiarEstatus(req.params.id, req.body.estatus);
    res.json({ data });
  }

  async eliminar(req, res) {
    await this.service.eliminar(req.params.id);
    res.status(204).end();
  }

  async eliminarImagen(req, res) {
    const data = await this.service.eliminarImagen(req.params.id, req.params.imagenId);
    res.json({ data });
  }
}

module.exports = AdminCasaController;
