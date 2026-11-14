const Database = require('../config/Database');

/**
 * Capa Service: lógica de negocio. No conoce req/res ni Express.
 * Ejemplo mínimo del flujo Controller → Service → (Repository / Database).
 */
class HealthService {
  constructor(database = Database.getInstance()) {
    this.database = database;
  }

  async getEstado() {
    const baseDeDatos = (await this.database.isConnected()) ? 'conectada' : 'desconectada';
    return {
      estado: 'ok',
      baseDeDatos,
      fecha: new Date().toISOString(),
    };
  }
}

module.exports = HealthService;
