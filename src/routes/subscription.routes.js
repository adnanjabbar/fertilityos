'use strict';

const express = require('express');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');
const subscriptionController = require('../controllers/subscription.controller');

// Get available subscription plans (public endpoint)
router.get('/plans', subscriptionController.getPlans);

// Create a new subscription for the clinic
router.post('/subscriptions', authenticateToken, requireRole('admin'), subscriptionController.createSubscription);

// Get subscription details for a clinic
router.get('/subscriptions', authenticateToken, subscriptionController.getSubscriptionDetails);
router.get('/subscriptions/:clinicId', authenticateToken, requireRole('admin'), subscriptionController.getSubscriptionDetails);

// Update subscription
router.put('/subscriptions', authenticateToken, requireRole('admin'), subscriptionController.updateSubscription);
router.put('/subscriptions/:clinicId', authenticateToken, requireRole('admin'), subscriptionController.updateSubscription);

// Cancel subscription
router.delete('/subscriptions', authenticateToken, requireRole('admin'), subscriptionController.cancelSubscription);
router.delete('/subscriptions/:clinicId', authenticateToken, requireRole('admin'), subscriptionController.cancelSubscription);

// Get modules based on subscription
router.get('/modules', authenticateToken, subscriptionController.getModules);

module.exports = router;