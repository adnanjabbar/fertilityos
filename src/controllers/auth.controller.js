const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');
const emailService = require('../services/email.service');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

// Register new clinic (onboarding) - Enhanced for multi-step wizard
const registerClinic = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const {
      // Step 1: Clinic Basics
      subdomain,
      clinicName,
      clinicCode,
      country,
      city,
      logoUrl,
      
      // Step 2: Admin Credentials
      adminName,
      adminEmail,
      adminPassword,
      
      // Step 3: Clinic Details & Compliance
      email,
      phone,
      address,
      licenseNumber,
      hasRegulatoryLicense,
      regulatoryBodyName,
      practiceType,
      yearsInOperation,
      
      // Step 4: Subscription & Payment
      billingCycle,
      planName,
      paymentIntentId
    } = req.body;

    // Validation
    if (!subdomain || !clinicName || !adminName || !adminEmail || !adminPassword) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required fields' 
      });
    }

    // Check if subdomain already exists
    const subdomainCheck = await db.query(
      'SELECT id FROM clinics WHERE subdomain = $1',
      [subdomain]
    );

    if (subdomainCheck.rows.length > 0) {
      return res.status(409).json({ 
        success: false,
        error: 'Subdomain already taken' 
      });
    }

    // Check if admin email already exists
    const emailCheck = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [adminEmail]
    );

    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ 
        success: false,
        error: 'Email already registered' 
      });
    }

    await client.query('BEGIN');

    // Create clinic with enhanced fields
    // Note: Using adminEmail as fallback for clinic email when not provided
    const clinicResult = await client.query(
      `INSERT INTO clinics (
        subdomain, clinic_name, clinic_code, email, phone, address, 
        city, country, license_number, regulatory_body_name, 
        practice_type, years_in_operation, 
        logo_url, billing_cycle, plan_name
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING id, subdomain, clinic_name, clinic_code`,
      [
        subdomain, clinicName, clinicCode || null, email || adminEmail, 
        phone, address, city, country || null, licenseNumber, 
        (hasRegulatoryLicense === 'yes' ? regulatoryBodyName : null), practiceType, 
        yearsInOperation, logoUrl, billingCycle || 'monthly', 
        planName || 'Starter'
      ]
    );

    const clinic = clinicResult.rows[0];

    // Hash password
    const passwordHash = await bcrypt.hash(adminPassword, 10);

    // Create owner user with email_verified = false initially
    const userResult = await client.query(
      `INSERT INTO users (
        clinic_id, email, password_hash, full_name, role, 
        is_active, email_verified
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, full_name, role`,
      [clinic.id, adminEmail, passwordHash, adminName, 'owner', false, false]
    );

    const user = userResult.rows[0];

    // Log audit
    await client.query(
      `INSERT INTO audit_logs (clinic_id, user_id, user_type, action, table_name, record_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [clinic.id, user.id, 'clinic_staff', 'CLINIC_REGISTERED', 'clinics', clinic.id]
    );

    await client.query('COMMIT');

    // Send verification email asynchronously (don't wait for it)
    emailService.sendVerificationEmail(user.id, adminEmail, adminName)
      .then(() => console.log('Verification email sent to:', adminEmail))
      .catch(err => console.error('Error sending verification email:', err));

    // Generate token
    const token = generateToken(user.id);

    res.status(201).json({
      success: true,
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
        role: user.role,
        emailVerified: false
      },
      token,
      accessUrl: `http://${subdomain}.ivfsoftware.com`,
      requiresEmailVerification: true
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Registration error:', error);
    
    if (error.code === '23505') { // Unique violation
      return res.status(409).json({ 
        success: false,
        error: 'Email or clinic code already exists' 
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Error registering clinic' 
    });
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
