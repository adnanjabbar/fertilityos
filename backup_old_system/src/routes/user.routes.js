const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');
const { requireModuleAccess, requireAdmin, MODULES, PERMISSIONS } = require('../middleware/permissions.middleware');

// All routes require authentication
router.use(authenticateToken);

// Get all users in clinic (requires user management view permission)
router.get('/', 
  requireModuleAccess(MODULES.USER_MANAGEMENT, PERMISSIONS.VIEW),
  userController.getUsers
);

// Add new user (requires user management create permission)
router.post('/', 
  requireModuleAccess(MODULES.USER_MANAGEMENT, PERMISSIONS.CREATE),
  userController.addUser
);

// Update user (requires user management edit permission)
router.put('/:userId',
  requireModuleAccess(MODULES.USER_MANAGEMENT, PERMISSIONS.EDIT),
  userController.updateUser
);

// Deactivate user (requires user management delete permission)
router.delete('/:userId',
  requireModuleAccess(MODULES.USER_MANAGEMENT, PERMISSIONS.DELETE),
  userController.deactivateUser
);

// Get own profile (no special permission needed)
router.get('/profile/me',
  userController.getProfile
);

// Update own profile (no special permission needed)
router.put('/profile/me',
  userController.updateProfile
);

// Get clinic settings (requires clinic settings view permission)
router.get('/clinic/settings',
  requireModuleAccess(MODULES.CLINIC_SETTINGS, PERMISSIONS.VIEW),
  userController.getClinicSettings
);

// Update clinic settings (requires clinic settings edit permission)
router.put('/clinic/settings',
  requireModuleAccess(MODULES.CLINIC_SETTINGS, PERMISSIONS.EDIT),
  userController.updateClinicSettings
);

module.exports = router;
