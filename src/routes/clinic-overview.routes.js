/**
 * Clinic Overview Routes
 * 
 * Routes for owner/admin dashboard with birds-eye view
 */

const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const { requireModuleAccess, requireAdmin, MODULES, PERMISSIONS } = require('../middleware/permissions.middleware');
const clinicOverviewController = require('../controllers/clinic-overview.controller');

// All routes require authentication
router.use(authenticateToken);

/**
 * GET /api/clinic/overview
 * Get comprehensive clinic overview for owner dashboard
 * Requires: dashboard view permission or admin role
 */
router.get('/overview',
    requireModuleAccess(MODULES.DASHBOARD, PERMISSIONS.VIEW),
    clinicOverviewController.getClinicOverview
);

/**
 * GET /api/clinic/usage
 * Get usage statistics for the clinic
 * Requires: analytics view permission
 */
router.get('/usage',
    requireModuleAccess(MODULES.ANALYTICS, PERMISSIONS.VIEW),
    clinicOverviewController.getUsageStatistics
);

/**
 * GET /api/clinic/roles
 * Get all available roles for user management
 * Requires: user_management view permission
 */
router.get('/roles',
    requireModuleAccess(MODULES.USER_MANAGEMENT, PERMISSIONS.VIEW),
    clinicOverviewController.getAvailableRoles
);

/**
 * GET /api/clinic/my-permissions
 * Get current user's permissions
 * No special permission required - users can view their own permissions
 */
router.get('/my-permissions',
    clinicOverviewController.getUserPermissions
);

module.exports = router;
