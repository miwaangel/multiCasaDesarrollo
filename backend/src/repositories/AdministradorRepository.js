const BaseRepository = require('./BaseRepository');
const { Administrador } = require('../models');

/**
 * Repositorio de administradores. Hereda de BaseRepository el CRUD
 * (findById, create, update...) que nunca trae password_hash (defaultScope del modelo).
 */
class AdministradorRepository extends BaseRepository {
  constructor() {
    super(Administrador);
  }

  /** Único método que trae password_hash: solo lo usa el login. null si no existe. */
  findByEmailConPassword(email) {
    return this.model.scope('conPassword').findOne({ where: { email } });
  }
}

module.exports = AdministradorRepository;
