/**
 * Payment Routes
 * 
 * Routes for payment processing including Stripe and manual payments
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireModuleAccess, MODULES, PERMISSIONS } = require('../middleware/permissions.middleware');
const paymentController = require('../controllers/payment.controller');

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/payments/methods
 * Get available payment methods for the clinic
 */
router.get('/methods',
    requireModuleAccess(MODULES.PAYMENTS, PERMISSIONS.VIEW),
    paymentController.getPaymentMethods
);

/**
 * GET /api/payments/stripe/status
 * Get Stripe configuration status
 */
router.get('/stripe/status',
    requireModuleAccess(MODULES.PAYMENTS, PERMISSIONS.VIEW),
    paymentController.getStripeStatus
);

/**
 * POST /api/payments/stripe/create-intent
 * Create a Stripe payment intent for card payments
 */
router.post('/stripe/create-intent',
    requireModuleAccess(MODULES.PAYMENTS, PERMISSIONS.CREATE),
    paymentController.createPaymentIntent
);

/**
 * POST /api/payments/stripe/confirm
 * Confirm a Stripe payment
 */
router.post('/stripe/confirm',
    requireModuleAccess(MODULES.PAYMENTS, PERMISSIONS.CREATE),
    paymentController.confirmStripePayment
);

/**
 * POST /api/payments/manual
 * Process a manual payment (cash, cheque, bank transfer)
 */
router.post('/manual',
    requireModuleAccess(MODULES.PAYMENTS, PERMISSIONS.CREATE),
    paymentController.processManualPayment
);

/**
 * GET /api/payments/cheques/pending
 * Get pending cheques awaiting clearance
 */
router.get('/cheques/pending',
    requireModuleAccess(MODULES.PAYMENTS, PERMISSIONS.VIEW),
    paymentController.getPendingCheques
);

/**
 * PUT /api/payments/cheques/:transactionId/status
 * Update cheque clearance status
 */
router.put('/cheques/:transactionId/status',
    requireModuleAccess(MODULES.PAYMENTS, PERMISSIONS.EDIT),
    paymentController.updateChequeStatus
);

/**
 * GET /api/payments/patient/:patientId
 * Get payment history for a patient
 */
router.get('/patient/:patientId',
    requireModuleAccess(MODULES.PAYMENTS, PERMISSIONS.VIEW),
    paymentController.getPatientPayments
);

module.exports = router;
