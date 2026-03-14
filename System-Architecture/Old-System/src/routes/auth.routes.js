const db = require('../config/database');
const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// Public routes
router.post('/register-clinic', authController.registerClinic);
router.post('/login', authController.login);

// Protected routes
router.get('/profile', authenticateToken, authController.getProfile);
router.get('/check-subdomain/:subdomain', async (req, res) => {
  try {
    const subdomain = req.params.subdomain.toLowerCase().trim();

    if (!subdomain.match(/^[a-z0-9-]+$/)) {
      return res.json({
        available: false,
        message: 'Invalid format'
      });
    }

    const result = await db.query(
      'SELECT id FROM clinics WHERE subdomain = $1',
      [subdomain]
    );

    if (result.rows.length > 0) {
      return res.json({
        available: false,
        message: 'Already taken'
      });
    }

    res.json({
      available: true,
      message: 'Available'
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ available: false });
  }
});
module.exports = router;
