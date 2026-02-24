const express = require('express');
const router = express.Router();
const medicalHistoryController = require('../controllers/medical-history.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// Get medical history for patient
router.get('/:patientId',
  medicalHistoryController.getMedicalHistory
);

// Update medical history
router.post('/:patientId',
  requireRole('admin', 'doctor', 'nurse', 'ivf_consultant'),
  medicalHistoryController.updateMedicalHistory
);

module.exports = router;
