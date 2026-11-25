const { matchedData } = require('express-validator');
const NoticiaService = require('../services/NoticiaService');

/** Noticias de la barra lateral del sitio público (solo activas). */
class NoticiaController {
  constructor(service = new NoticiaService()) {
    this.service = service;
    this.listar = this.listar.bind(this);
    this.detalle = this.detalle.bind(this);
  }

  async listar(req, res) {
    const { limite = 5 } = matchedData(req, { locations: ['query'] });
    const { noticias, total } = await this.service.listarActivas(limite);
    res.json({ data: noticias, total });
  }

  async detalle(req, res) {
    const data = await this.service.obtenerPublica(req.params.id);
    res.json({ data });
  }
}

module.exports = NoticiaController;
