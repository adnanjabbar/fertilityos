const express = require('express');
const router = express.Router();
const documentController = require('../controllers/document.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// Upload document
router.post('/patient/:patientId',
  requireRole('admin', 'doctor', 'nurse', 'receptionist'),
  documentController.uploadDocument
);

// Get patient documents
router.get('/patient/:patientId',
  documentController.getPatientDocuments
);

// Get single document
router.get('/:documentId',
  documentController.getDocument
);

// Delete document
router.delete('/:documentId',
  requireRole('admin', 'doctor'),
  documentController.deleteDocument
);

module.exports = router;
