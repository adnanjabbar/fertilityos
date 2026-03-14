const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patient.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// Register new patient (doctors, nurses, receptionists can register)
router.post('/', 
  requireRole('admin', 'doctor', 'nurse', 'receptionist'),
  patientController.registerPatient
);

// Get all patients (all staff can view)
router.get('/', 
  patientController.getPatients
);

// Get single patient details
router.get('/:patientId', 
  patientController.getPatientById
);

// Update patient information
router.put('/:patientId',
  requireRole('admin', 'doctor', 'nurse', 'receptionist'),
  patientController.updatePatient
);

// Deactivate patient
router.delete('/:patientId',
  requireRole('admin', 'doctor'),
  patientController.deactivatePatient
);

module.exports = router;
