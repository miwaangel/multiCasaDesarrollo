const AuthService = require('../services/AuthService');

/**
 * Login de administradores y perfil del admin autenticado.
 * Lee req, llama al service y responde { data }.
 */
class AuthController {
  constructor(service = new AuthService()) {
    this.service = service;
    this.login = this.login.bind(this);
    this.perfil = this.perfil.bind(this);
  }

  async login(req, res) {
    const { email, password } = req.body;
    const data = await this.service.login(email, password);
    res.json({ data });
  }

  // req.admin lo deja el middleware auth
  async perfil(req, res) {
    const data = await this.service.obtenerPerfil(req.admin.id);
    res.json({ data });
  }
}

module.exports = AuthController;
