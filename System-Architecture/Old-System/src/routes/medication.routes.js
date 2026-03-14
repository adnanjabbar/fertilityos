const express = require('express');
const router = express.Router();
const medicationController = require('../controllers/medication.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// Medication inventory
router.get('/',
  medicationController.getMedications
);

router.post('/',
  requireRole('admin', 'doctor', 'pharmacist'),
  medicationController.addMedication
);

// Patient medications
router.get('/patient/:patientId',
  medicationController.getPatientMedications
);

router.post('/patient/:patientId',
  requireRole('admin', 'doctor'),
  medicationController.addPatientMedication
);

// Prescriptions
router.post('/patient/:patientId/prescription',
  requireRole('admin', 'doctor'),
  medicationController.createPrescription
);

module.exports = router;
