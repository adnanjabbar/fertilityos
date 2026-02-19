const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Register new clinic (onboarding)
const registerClinic = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const {
      subdomain,
      clinicName,
      clinicCode,
      email,
      phone,
      address,
      city,
      licenseNumber,
      phcRegistration,
      adminName,
      adminEmail,
      adminPassword
    } = req.body;

    // Validation
    if (!subdomain || !clinicName || !email || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if subdomain already exists
    const subdomainCheck = await db.query(
      'SELECT id FROM clinics WHERE subdomain = $1',
      [subdomain]
    );

    if (subdomainCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Subdomain already taken' });
    }

    await client.query('BEGIN');

    // Create clinic
    const clinicResult = await client.query(
      `INSERT INTO clinics (subdomain, clinic_name, clinic_code, email, phone, address, city, license_number, phc_registration)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id, subdomain, clinic_name, clinic_code`,
      [subdomain, clinicName, clinicCode, email, phone, address, city, licenseNumber, phcRegistration]
    );

    const clinic = clinicResult.rows[0];

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create owner user (the first user who registers the clinic becomes the owner)
    const userResult = await client.query(
      `INSERT INTO users (clinic_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, full_name, role`,
      [clinic.id, adminEmail, passwordHash, adminName, 'owner']
    );

    const user = userResult.rows[0];

    // Log audit
    await client.query(
      `INSERT INTO audit_logs (clinic_id, user_id, user_type, action, table_name, record_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [clinic.id, user.id, 'clinic_staff', 'CLINIC_REGISTERED', 'clinics', clinic.id]
    );

    await client.query('COMMIT');

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      message: 'Clinic registered successfully',
      clinic: {
        id: clinic.id,
        subdomain: clinic.subdomain,
        name: clinic.clinic_name,
        code: clinic.clinic_code
      },
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role
      },
      token,
      accessUrl: `http://${subdomain}.ivfsoftware.com` // Or your actual domain
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ error: 'Email or clinic code already exists' });
    }
    
    res.status(500).json({ error: 'Error registering clinic' });
  } finally {
    client.release();
  }
};

// Login
const login = async (req, res) => {
  try {
    const { email, password, subdomain } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Get user with clinic info
    let query = `
      SELECT u.id, u.clinic_id, u.email, u.password_hash, u.full_name, u.role, u.is_active,
             c.subdomain, c.clinic_name, c.is_active as clinic_active
      FROM users u
      JOIN clinics c ON u.clinic_id = c.id
      WHERE u.email = $1
    `;
    
    const params = [email];

    // If subdomain provided, verify user belongs to that clinic
    if (subdomain) {
      query += ' AND c.subdomain = $2';
      params.push(subdomain);
    }

    const result = await db.query(query, params);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is deactivated' });
    }

    if (!user.clinic_active) {
      return res.status(403).json({ error: 'Clinic subscription is inactive' });
    }

    // Verify password
    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await db.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Log audit
    await db.query(
      `INSERT INTO audit_logs (clinic_id, user_id, user_type, action)
       VALUES ($1, $2, $3, $4)`,
      [user.clinic_id, user.id, 'clinic_staff', 'USER_LOGIN']
    );

    // Generate token
    const token = generateToken(user.id);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        name: user.full_name,
        email: user.email,
        role: user.role,
        clinic: {
          id: user.clinic_id,
          subdomain: user.subdomain,
          name: user.clinic_name
        }
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error during login' });
  }
};

// Get current user profile
const getProfile = async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.email, u.full_name, u.role, u.phone, u.last_login, u.created_at,
              c.id as clinic_id, c.subdomain, c.clinic_name, c.clinic_code
       FROM users u
       JOIN clinics c ON u.clinic_id = c.id
       WHERE u.id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Error fetching profile' });
  }
};

module.exports = {
  registerClinic,
  login,
  getProfile
};
