const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user details
    const result = await db.query(
      'SELECT id, clinic_id, email, full_name, role, is_active FROM users WHERE id = $1',
      [decoded.userId]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    return res.status(403).json({ error: 'Invalid token' });
  }
};

// Check if user has required role
const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        required: allowedRoles,
        current: req.user.role
      });
    }

    next();
  };
};

// Verify user belongs to the clinic in the subdomain
const verifyClinicAccess = async (req, res, next) => {
  try {
    const subdomain = req.headers['x-clinic-subdomain'] || req.query.subdomain;

    if (!subdomain) {
      return res.status(400).json({ error: 'Clinic subdomain required' });
    }

    // Get clinic ID from subdomain
    const clinicResult = await db.query(
      'SELECT id, is_active FROM clinics WHERE subdomain = $1',
      [subdomain]
    );

    if (clinicResult.rows.length === 0) {
      return res.status(404).json({ error: 'Clinic not found' });
    }

    const clinic = clinicResult.rows[0];

    if (!clinic.is_active) {
      return res.status(403).json({ error: 'Clinic subscription is inactive' });
    }

    // Verify user belongs to this clinic
    if (req.user.clinic_id !== clinic.id) {
      return res.status(403).json({ error: 'Access denied to this clinic' });
    }

    req.clinic = clinic;
    next();
  } catch (error) {
    return res.status(500).json({ error: 'Error verifying clinic access' });
  }
};

module.exports = {
  authenticateToken,
  requireRole,
  verifyClinicAccess
};
