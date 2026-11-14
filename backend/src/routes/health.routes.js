const { Router } = require('express');
const HealthController = require('../controllers/HealthController');
const asyncHandler = require('../utils/asyncHandler');

function healthRoutes(controller = new HealthController()) {
  const router = Router();
  router.get('/', asyncHandler(controller.getEstado));
  return router;
}

module.exports = healthRoutes;
