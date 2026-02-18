const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

// All routes require authentication
router.use(authenticateToken);

// Get all users in clinic (admin only)
router.get('/', 
  requireRole('admin', 'lab_director'),
  userController.getUsers
);

// Add new user (admin only)
router.post('/', 
  requireRole('admin'),
  userController.addUser
);

// Update user (admin only)
router.put('/:userId',
  requireRole('admin'),
  userController.updateUser
);

// Deactivate user (admin only)
router.delete('/:userId',
  requireRole('admin'),
  userController.deactivateUser
);

// Get own profile
router.get('/profile/me',
  userController.getProfile
);

// Update own profile
router.put('/profile/me',
  userController.updateProfile
);

// Get clinic settings (admin only)
router.get('/clinic/settings',
  requireRole('admin', 'lab_director'),
  userController.getClinicSettings
);

// Update clinic settings (admin only)
router.put('/clinic/settings',
  requireRole('admin'),
  userController.updateClinicSettings
);

module.exports = router;
