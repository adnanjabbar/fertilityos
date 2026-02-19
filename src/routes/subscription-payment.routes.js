/**
 * Subscription Payment Routes
 * 
 * Routes for handling subscription payments via Stripe
 */

const express = require('express');
const router = express.Router();
const subscriptionPaymentController = require('../controllers/subscription-payment.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

/**
 * GET /api/subscription-payment/plans
 * Get available subscription plans
 */
router.get('/plans', subscriptionPaymentController.getPlans);

/**
 * POST /api/subscription-payment/checkout
 * Create Stripe checkout session
 */
router.post('/checkout', subscriptionPaymentController.createCheckoutSession);

/**
 * POST /api/subscription-payment/confirm
 * Confirm payment after Stripe processing
 */
router.post('/confirm', subscriptionPaymentController.confirmPayment);

/**
 * POST /api/subscription-payment/webhook
 * Stripe webhook handler
 * Note: This endpoint should not use authenticateToken as Stripe calls it directly
 */
router.post('/webhook', 
    express.raw({ type: 'application/json' }), 
    subscriptionPaymentController.handleWebhook
);

/**
 * GET /api/subscription-payment/invoice/:invoiceId
 * Get invoice details
 */
router.get('/invoice/:invoiceId', subscriptionPaymentController.getInvoice);

module.exports = router;
