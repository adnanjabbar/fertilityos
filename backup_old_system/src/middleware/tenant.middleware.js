const db = require('../config/database');

const resolveTenant = async (req, res, next) => {
  try {
    const host = req.headers.host;

    if (!host) {
      return res.status(400).json({ message: 'Invalid host' });
    }

    // Extract subdomain
    const parts = host.split('.');
    const subdomain = parts.length > 2 ? parts[0] : null;

    if (!subdomain) {
      return res.status(400).json({ message: 'Subdomain required' });
    }

    const result = await db.query(
      `SELECT * FROM clinics WHERE subdomain = $1`,
      [subdomain]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Clinic not found' });
    }

    const clinic = result.rows[0];

    // Subscription check
    if (!clinic.is_active) {
      return res.status(403).json({ message: 'Clinic inactive' });
    }

    if (
      clinic.subscription_status === 'expired' ||
      (clinic.subscription_ends_at &&
        new Date(clinic.subscription_ends_at) < new Date())
    ) {
      return res.status(403).json({
        message: 'Subscription expired'
      });
    }

    req.clinic = clinic;
    next();

  } catch (error) {
    console.error('Tenant middleware error:', error);
    res.status(500).json({ message: 'Tenant resolution error' });
  }
};

module.exports = resolveTenant;
