const { matchedData } = require('express-validator');
const NoticiaService = require('../services/NoticiaService');

// Solo los campos que tienen regla de validación (ya convertidos); contenido vacío llega como null
const datosDelBody = (req) => matchedData(req, { locations: ['body'], includeOptionals: true });

/** CRUD de noticias del panel de administración (rutas protegidas con token). */
class AdminNoticiaController {
  constructor(service = new NoticiaService()) {
    this.service = service;
    for (const metodo of ['listar', 'obtener', 'crear', 'actualizar', 'eliminar']) {
      this[metodo] = this[metodo].bind(this);
    }
  }

  async listar(req, res) {
    const { pagina = 1, limite = 10 } = matchedData(req, { locations: ['query'] });
    const { noticias, total } = await this.service.listarAdmin({ pagina, limite });
    res.json({ data: noticias, total, pagina, limite });
  }

  async obtener(req, res) {
    const data = await this.service.obtenerAdmin(req.params.id);
    res.json({ data });
  }

  async crear(req, res) {
    const data = await this.service.crear(datosDelBody(req), req.files[0], req.admin.id);
    res.status(201).json({ data });
  }

  async actualizar(req, res) {
    const data = await this.service.actualizar(req.params.id, datosDelBody(req), req.files[0]);
    res.json({ data });
  }

  async eliminar(req, res) {
    await this.service.eliminar(req.params.id);
    res.status(204).end();
  }
}

module.exports = AdminNoticiaController;
