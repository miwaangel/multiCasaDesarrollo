'use strict';

const bcrypt = require('bcryptjs');
const env = require('../../config/env');

/**
 * Admin de prueba: admin@multicasa.com
 * Contraseña: SEED_ADMIN_PASSWORD de backend/.env (si no existe, Admin123!), guardada con bcrypt.
 */
module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash(env.seed.adminPassword, 10);

    await queryInterface.bulkInsert('administradores', [
      {
        id: 1,
        nombre: 'Administrador',
        email: 'admin@multicasa.com',
        password_hash: passwordHash,
        activo: true,
      },
    ]);
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('administradores', { id: [1] });
  },
};
