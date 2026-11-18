const AppError = require('../utils/AppError');

/**
 * Patrón Repository: único lugar que habla con Sequelize.
 * Cada repositorio concreto hereda de aquí y recibe su modelo:
 *
 *   class CasaRepository extends BaseRepository {
 *     constructor() { super(Casa); }
 *     findDestacadas() { return this.findAll({ where: { destacada: true } }); }
 *   }
 *
 * Todos los métodos aceptan `options` de Sequelize (include, where, transaction...).
 */
class BaseRepository {
  constructor(model) {
    if (new.target === BaseRepository) {
      throw new Error('BaseRepository es abstracta: crea una clase que la extienda');
    }
    if (!model) {
      throw new Error(`${new.target.name} necesita un modelo de Sequelize`);
    }
    this.model = model;
  }

  findAll(options = {}) {
    return this.model.findAll(options);
  }

  findById(id, options = {}) {
    return this.model.findByPk(id, options);
  }

  async findByIdOrFail(id, options = {}) {
    const registro = await this.findById(id, options);
    if (!registro) {
      throw AppError.notFound(`${this.model.name} con id ${id} no existe`);
    }
    return registro;
  }

  findOne(options = {}) {
    return this.model.findOne(options);
  }

  count(options = {}) {
    return this.model.count(options);
  }

  create(data, options = {}) {
    return this.model.create(data, options);
  }

  async update(id, data, options = {}) {
    const registro = await this.findByIdOrFail(id, options);
    return registro.update(data, options);
  }

  async delete(id, options = {}) {
    const registro = await this.findByIdOrFail(id, options);
    await registro.destroy(options);
    return true;
  }

  /**
   * Ejecuta `trabajo(t)` dentro de una transacción. Si `trabajo` termina bien se hace COMMIT;
   * si lanza un error se hace ROLLBACK y el error se vuelve a lanzar.
   * Cada operación de adentro debe recibir { transaction: t }.
   */
  transaccion(trabajo) {
    return this.model.sequelize.transaction(trabajo);
  }
}

module.exports = BaseRepository;
