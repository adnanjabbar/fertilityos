const express = require('express');
const router = express.Router();
const cycleController = require('../controllers/cycle.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// Start new IVF cycle
router.post('/', 
  requireRole('admin', 'doctor'),
  cycleController.startCycle
);

// Get all cycles with filters
router.get('/', 
  cycleController.getCycles
);

// Get single cycle details
router.get('/:cycleId', 
  cycleController.getCycleById
);

// Update cycle stage
router.put('/:cycleId/stage',
  requireRole('admin', 'doctor', 'embryologist'),
  cycleController.updateCycleStage
);

// Add stimulation monitoring
router.post('/:cycleId/monitoring',
  requireRole('admin', 'doctor', 'nurse'),
  cycleController.addStimulationMonitoring
);

// Record egg retrieval
router.post('/:cycleId/egg-retrieval',
  requireRole('admin', 'doctor'),
  cycleController.recordEggRetrieval
);

// Record sperm sample
router.post('/:cycleId/sperm-sample',
  requireRole('admin', 'doctor', 'embryologist', 'lab_tech'),
  cycleController.recordSpermSample
);

// Record fertilization
router.post('/:cycleId/fertilization',
  requireRole('admin', 'embryologist'),
  cycleController.recordFertilization
);

module.exports = router;
