'use strict';

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');
const billingController = require('../controllers/billing.controller');

// Invoice endpoints
router.post('/invoices', authenticateToken, requireRole('admin', 'receptionist'), billingController.generateInvoice);
router.get('/invoices', authenticateToken, billingController.getInvoices);
router.get('/invoices/:invoiceId', authenticateToken, billingController.getInvoice);

// Payment endpoints
router.post('/payments', authenticateToken, requireRole('admin', 'receptionist'), billingController.processPayment);
router.get('/payments', authenticateToken, billingController.getPayments);

module.exports = router;
