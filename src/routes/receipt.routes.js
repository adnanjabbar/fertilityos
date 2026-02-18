const express = require('express');
const router = express.Router();
const receiptController = require('../controllers/receipt.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

router.use(authenticateToken);

// Generate new receipt
router.post('/',
  requireRole('admin', 'doctor', 'receptionist'),
  receiptController.generateReceipt
);

// Get patient receipts
router.get('/patient/:patientId',
  receiptController.getPatientReceipts
);

// Get receipt details
router.get('/:receiptId',
  receiptController.getReceiptDetails
);

module.exports = router;
