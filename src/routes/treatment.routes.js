const express = require('express');
const router = express.Router();
const treatmentController = require('../controllers/treatment.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// Get treatment packages
router.get('/packages',
  treatmentController.getTreatmentPackages
);

// Assign treatment to patient
router.post('/patient/:patientId',
  requireRole('admin', 'doctor'),
  treatmentController.assignTreatment
);

// Get patient treatments
router.get('/patient/:patientId',
  treatmentController.getPatientTreatments
);

// Generate invoice
router.post('/invoice',
  requireRole('admin', 'doctor', 'receptionist'),
  treatmentController.generateInvoice
);

// Get patient invoices
router.get('/invoice/patient/:patientId',
  treatmentController.getPatientInvoices
);

// Record payment against invoice
router.post('/invoice/:invoiceId/payment',
  requireRole('admin', 'doctor', 'receptionist'),
  treatmentController.recordInvoicePayment
);

module.exports = router;
