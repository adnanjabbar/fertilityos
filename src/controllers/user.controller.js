const db = require('../config/database');
const bcrypt = require('bcrypt');

// Get all users in the clinic
const getUsers = async (req, res) => {
  try {
    const clinicId = req.user.clinic_id;
    
    const result = await db.query(
      `SELECT id, email, full_name, role, phone, is_active, last_login, created_at
       FROM users
       WHERE clinic_id = $1
       ORDER BY created_at DESC`,
      [clinicId]
    );
    
    res.json({
      users: result.rows
    });
    
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Error fetching users' });
  }
};

// Add new user to clinic
const addUser = async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      role,
      phone
    } = req.body;
    
    const clinicId = req.user.clinic_id;
    
    // Validation
    if (!email || !password || !fullName || !role) {
      return res.status(400).json({ 
        error: 'Missing required fields: email, password, fullName, role' 
      });
    }
    
    // Valid roles
    const validRoles = [
      'admin', 'doctor', 'embryologist', 'nurse', 'lab_tech', 
      'receptionist', 'ivf_consultant', 'lab_director', 'quality_manager'
    ];
    
    if (!validRoles.includes(role)) {
      return res.status(400).json({ error: 'Invalid role' });
    }
    
    // Check if email already exists
    const existingUser = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Insert user
    const result = await db.query(
      `INSERT INTO users (clinic_id, email, password_hash, full_name, role, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, email, full_name, role, phone, is_active, created_at`,
      [clinicId, email, passwordHash, fullName, role, phone]
    );
    
    // Log audit
    await db.query(
      `INSERT INTO audit_logs (clinic_id, user_id, user_type, action, table_name, record_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [clinicId, req.user.id, 'clinic_staff', 'USER_ADDED', 'users', result.rows[0].id]
    );
    
    res.status(201).json({
      message: 'User added successfully',
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Add user error:', error);
    res.status(500).json({ error: 'Error adding user' });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { fullName, role, phone, isActive } = req.body;
    const clinicId = req.user.clinic_id;
    
    // Check user belongs to clinic
    const userCheck = await db.query(
      'SELECT id FROM users WHERE id = $1 AND clinic_id = $2',
      [userId, clinicId]
    );
    
    if (userCheck.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    const result = await db.query(
      `UPDATE users SET
        full_name = COALESCE($1, full_name),
        role = COALESCE($2, role),
        phone = COALESCE($3, phone),
        is_active = COALESCE($4, is_active),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $5 AND clinic_id = $6
       RETURNING id, email, full_name, role, phone, is_active`,
      [fullName, role, phone, isActive, userId, clinicId]
    );
    
    res.json({
      message: 'User updated successfully',
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Error updating user' });
  }
};

// Update own profile
const updateProfile = async (req, res) => {
  try {
    const { fullName, phone, currentPassword, newPassword } = req.body;
    const userId = req.user.id;
    
    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password required' });
      }
      
      const userResult = await db.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );
      
      const validPassword = await bcrypt.compare(
        currentPassword, 
        userResult.rows[0].password_hash
      );
      
      if (!validPassword) {
        return res.status(401).json({ error: 'Current password is incorrect' });
      }
      
      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);
      
      await db.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [newPasswordHash, userId]
      );
    }
    
    // Update profile
    const result = await db.query(
      `UPDATE users SET
        full_name = COALESCE($1, full_name),
        phone = COALESCE($2, phone),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING id, email, full_name, role, phone`,
      [fullName, phone, userId]
    );
    
    res.json({
      message: 'Profile updated successfully',
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Error updating profile' });
  }
};

// Deactivate user
const deactivateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const clinicId = req.user.clinic_id;
    
    // Can't deactivate yourself
    if (userId === req.user.id) {
      return res.status(400).json({ error: 'Cannot deactivate your own account' });
    }
    
    const result = await db.query(
      `UPDATE users SET is_active = false 
       WHERE id = $1 AND clinic_id = $2
       RETURNING email, full_name`,
      [userId, clinicId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json({
      message: 'User deactivated successfully',
      user: result.rows[0]
    });
    
  } catch (error) {
    console.error('Deactivate user error:', error);
    res.status(500).json({ error: 'Error deactivating user' });
  }
};

// Get clinic settings
const getClinicSettings = async (req, res) => {
  try {
    const clinicId = req.user.clinic_id;
    
    const result = await db.query(
      'SELECT * FROM clinics WHERE id = $1',
      [clinicId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Clinic not found' });
    }
    
    res.json({
      clinic: result.rows[0]
    });
    
  } catch (error) {
    console.error('Get clinic settings error:', error);
    res.status(500).json({ error: 'Error fetching clinic settings' });
  }
};

// Update clinic settings
const updateClinicSettings = async (req, res) => {
  try {
    const clinicId = req.user.clinic_id;
    const {
      clinicName,
      email,
      phone,
      address,
      city,
      licenseNumber,
      phcRegistration
    } = req.body;
    
    const result = await db.query(
      `UPDATE clinics SET
        clinic_name = COALESCE($1, clinic_name),
        email = COALESCE($2, email),
        phone = COALESCE($3, phone),
        address = COALESCE($4, address),
        city = COALESCE($5, city),
        license_number = COALESCE($6, license_number),
        phc_registration = COALESCE($7, phc_registration),
        updated_at = CURRENT_TIMESTAMP
       WHERE id = $8
       RETURNING *`,
      [clinicName, email, phone, address, city, licenseNumber, phcRegistration, clinicId]
    );
    
    res.json({
      message: 'Clinic settings updated successfully',
      clinic: result.rows[0]
    });
    
  } catch (error) {
    console.error('Update clinic settings error:', error);
    res.status(500).json({ error: 'Error updating clinic settings' });
  }
};

// Get user profile (for settings page)
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
  getUsers,
  addUser,
  updateUser,
  updateProfile,
  deactivateUser,
  getClinicSettings,
  updateClinicSettings,
  getProfile
};
