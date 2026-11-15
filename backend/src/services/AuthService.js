const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const env = require('../config/env');
const AppError = require('../utils/AppError');
const AdministradorRepository = require('../repositories/AdministradorRepository');

// Hash de relleno: si el email no existe igual se ejecuta un bcrypt.compare, así la
// respuesta tarda lo mismo y no se puede adivinar qué emails están registrados.
const HASH_DE_RELLENO = bcrypt.hashSync('multicasa-hash-de-relleno', 10);

/**
 * Autenticación de administradores: login con bcrypt y tokens JWT.
 * No conoce Express; el controller le pasa los datos y el middleware le pide verificar tokens.
 */
class AuthService {
  constructor(repository = new AdministradorRepository(), config = env.jwt) {
    this.repository = repository;
    this.config = config;
  }

  /**
   * Regresa { token, admin: { id, nombre, email } }.
   * Email inexistente, admin inactivo o contraseña incorrecta lanzan el MISMO error.
   */
  async login(email, password) {
    const admin = await this.repository.findByEmailConPassword(email);
    const passwordCorrecto = await bcrypt.compare(password, admin ? admin.passwordHash : HASH_DE_RELLENO);

    if (!admin || !admin.activo || !passwordCorrecto) {
      throw AppError.unauthorized('Email o contraseña incorrectos', 'CREDENCIALES_INVALIDAS');
    }

    const token = jwt.sign({ id: admin.id, email: admin.email }, this.#secreto(), {
      algorithm: 'HS256',
      expiresIn: this.config.expiresIn,
    });

    return { token, admin: { id: admin.id, nombre: admin.nombre, email: admin.email } };
  }

  /** Verifica firma y vigencia del token. Regresa { id, email } o lanza TOKEN_INVALIDO. */
  verificarToken(token) {
    try {
      const { id, email } = jwt.verify(token, this.#secreto(), { algorithms: ['HS256'] });
      return { id, email };
    } catch {
      throw AppError.unauthorized('El token no es válido o ya venció', 'TOKEN_INVALIDO');
    }
  }

  /** Datos del admin dueño del token; si ya no existe o lo desactivaron, el token deja de servir. */
  async obtenerPerfil(id) {
    const admin = await this.repository.findById(id);
    if (!admin || !admin.activo) {
      throw AppError.unauthorized('El token no es válido o ya venció', 'TOKEN_INVALIDO');
    }
    return { id: admin.id, nombre: admin.nombre, email: admin.email };
  }

  #secreto() {
    if (!this.config.secret) {
      throw new Error('Falta JWT_SECRET en backend/.env');
    }
    return this.config.secret;
  }
}

module.exports = AuthService;
