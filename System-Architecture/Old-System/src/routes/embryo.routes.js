const express = require('express');
const router = express.Router();
const embryoController = require('../controllers/embryo.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// Get embryos for a cycle
router.get('/cycle/:cycleId',
  embryoController.getEmbryosByCycle
);

// Update embryo development (Day 2-6)
router.put('/:embryoId/development',
  requireRole('admin', 'embryologist'),
  embryoController.updateEmbryoDevelopment
);

// Update embryo status
router.put('/:embryoId/status',
  requireRole('admin', 'embryologist', 'doctor'),
  embryoController.updateEmbryoStatus
);

// Record embryo transfer
router.post('/cycle/:cycleId/transfer',
  requireRole('admin', 'doctor', 'embryologist'),
  embryoController.recordEmbryoTransfer
);

// Freeze embryos
router.post('/cycle/:cycleId/freeze',
  requireRole('admin', 'embryologist'),
  embryoController.freezeEmbryos
);

// Record pregnancy outcome
router.post('/cycle/:cycleId/pregnancy-outcome',
  requireRole('admin', 'doctor'),
  embryoController.recordPregnancyOutcome
);

module.exports = router;
