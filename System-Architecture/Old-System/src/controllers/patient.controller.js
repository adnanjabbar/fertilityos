const db = require('../config/database');

// Register new patient
const registerPatient = async (req, res) => {
  try {
    const {
      patientCode,
      mrn,
      fullName,
      dateOfBirth,
      gender,
      cnic,
      phone,
      email,
      address,
      city,
      bloodGroup,
      heightCm,
      weightKg,
      partnerName,
      partnerAge,
      partnerPhone,
      referredBy,
      referringDoctor
    } = req.body;

    const clinicId = req.user.clinic_id;

    // Validation
    if (!fullName || !dateOfBirth || !phone) {
      return res.status(400).json({ 
        error: 'Missing required fields: fullName, dateOfBirth, phone' 
      });
    }

    // Calculate age from date of birth
    const dob = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }

    // Calculate BMI if height and weight provided
    let bmi = null;
    if (heightCm && weightKg) {
      const heightM = heightCm / 100;
      bmi = (weightKg / (heightM * heightM)).toFixed(2);
    }

    // Generate patient code if not provided
    let finalPatientCode = patientCode;
    if (!finalPatientCode) {
      const result = await db.query(
        'SELECT COUNT(*) as count FROM patients WHERE clinic_id = $1',
        [clinicId]
      );
      const patientCount = parseInt(result.rows[0].count) + 1;
      finalPatientCode = `P${String(patientCount).padStart(6, '0')}`;
    }

    // Check if patient code already exists
    const existing = await db.query(
      'SELECT id FROM patients WHERE clinic_id = $1 AND patient_code = $2',
      [clinicId, finalPatientCode]
    );

    if (existing.rows.length > 0) {
      return res.status(409).json({ 
        error: 'Patient code already exists' 
      });
    }

// Insert patient
    const insertResult = await db.query(
      `INSERT INTO patients (
        clinic_id, patient_code, mrn, full_name, date_of_birth, age, gender,
        cnic, phone, email, address, city, blood_group, height_cm, weight_kg, bmi,
        partner_name, partner_age, partner_phone, 
        referred_by, referring_doctor_name, referring_doctor_hospital, referring_doctor_phone,
        consultation_fee, outstanding_balance
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
      RETURNING *`,
      [
        clinicId, 
        finalPatientCode, 
        mrn || `MRN-${finalPatientCode}`, 
        fullName, 
        dateOfBirth, 
        age, 
        gender,
        cnic, 
        phone, 
        email, 
        address, 
        city, 
        bloodGroup, 
        heightCm, 
        weightKg, 
        bmi,
        partnerName, 
        partnerAge, 
        partnerPhone,
        referredBy, 
        req.body.referringDoctor, 
        req.body.referringDoctorHospital, 
        req.body.referringDoctorPhone,
        req.body.consultationFee || 0, 
        req.body.consultationFee || 0
      ]
    );

    const patient = insertResult.rows[0];

    // Log audit
    await db.query(
      `INSERT INTO audit_logs (clinic_id, user_id, user_type, action, table_name, record_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [clinicId, req.user.id, 'clinic_staff', 'PATIENT_REGISTERED', 'patients', patient.id]
    );

    res.status(201).json({
      message: 'Patient registered successfully',
      patient: {
        id: patient.id,
        patientCode: patient.patient_code,
        fullName: patient.full_name,
        age: patient.age,
        phone: patient.phone,
        email: patient.email,
        createdAt: patient.created_at
      }
    });

  } catch (error) {
    console.error('Register patient error:', error);
    res.status(500).json({ error: 'Error registering patient' });
  }
};

// Get all patients for a clinic
const getPatients = async (req, res) => {
  try {
    const clinicId = req.user.clinic_id;
    const { page = 1, limit = 20, search = '' } = req.query;
    
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, patient_code, mrn, full_name, date_of_birth, age, gender,
             phone, email, city, is_active, created_at
      FROM patients
      WHERE clinic_id = $1
    `;

    const params = [clinicId];

    // Add search filter
    if (search) {
      query += ` AND (
        full_name ILIKE $${params.length + 1} OR
        patient_code ILIKE $${params.length + 1} OR
        phone ILIKE $${params.length + 1} OR
        mrn ILIKE $${params.length + 1}
      )`;
      params.push(`%${search}%`);
    }

    // Get total count
    const countResult = await db.query(
      query.replace('SELECT id, patient_code, mrn, full_name, date_of_birth, age, gender, phone, email, city, is_active, created_at', 'SELECT COUNT(*)'),
      params
    );
    const totalPatients = parseInt(countResult.rows[0].count);

    // Add pagination
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const result = await db.query(query, params);

    res.json({
      patients: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalPatients / limit),
        totalPatients,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get patients error:', error);
    res.status(500).json({ error: 'Error fetching patients' });
  }
};

// Get single patient details
const getPatientById = async (req, res) => {
  try {
    const { patientId } = req.params;
    const clinicId = req.user.clinic_id;

    const result = await db.query(
      'SELECT * FROM patients WHERE id = $1 AND clinic_id = $2',
      [patientId, clinicId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patient = result.rows[0];

    // Get patient's IVF cycles count
    const cyclesResult = await db.query(
      'SELECT COUNT(*) as cycle_count FROM ivf_cycles WHERE patient_id = $1',
      [patientId]
    );

    res.json({
      patient: {
        ...patient,
        totalCycles: parseInt(cyclesResult.rows[0].cycle_count)
      }
    });

  } catch (error) {
    console.error('Get patient error:', error);
    res.status(500).json({ error: 'Error fetching patient details' });
  }
};

// Update patient information
const updatePatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const clinicId = req.user.clinic_id;

    // Verify patient belongs to this clinic
    const checkResult = await db.query(
      'SELECT id FROM patients WHERE id = $1 AND clinic_id = $2',
      [patientId, clinicId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const {
      fullName,
      phone,
      email,
      address,
      city,
      bloodGroup,
      heightCm,
      weightKg,
      partnerName,
      partnerAge,
      partnerPhone
    } = req.body;

    // Calculate BMI if height and weight updated
    let bmi = null;
    if (heightCm && weightKg) {
      const heightM = heightCm / 100;
      bmi = (weightKg / (heightM * heightM)).toFixed(2);
    }

    const updateResult = await db.query(
      `UPDATE patients SET
        full_name = COALESCE($1, full_name),
        phone = COALESCE($2, phone),
        email = COALESCE($3, email),
        address = COALESCE($4, address),
        city = COALESCE($5, city),
        blood_group = COALESCE($6, blood_group),
        height_cm = COALESCE($7, height_cm),
        weight_kg = COALESCE($8, weight_kg),
        bmi = COALESCE($9, bmi),
        partner_name = COALESCE($10, partner_name),
        partner_age = COALESCE($11, partner_age),
        partner_phone = COALESCE($12, partner_phone),
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13 AND clinic_id = $14
      RETURNING *`,
      [
        fullName, phone, email, address, city, bloodGroup,
        heightCm, weightKg, bmi, partnerName, partnerAge, partnerPhone,
        patientId, clinicId
      ]
    );

    // Log audit
    await db.query(
      `INSERT INTO audit_logs (clinic_id, user_id, user_type, action, table_name, record_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [clinicId, req.user.id, 'clinic_staff', 'PATIENT_UPDATED', 'patients', patientId]
    );

    res.json({
      message: 'Patient updated successfully',
      patient: updateResult.rows[0]
    });

  } catch (error) {
    console.error('Update patient error:', error);
    res.status(500).json({ error: 'Error updating patient' });
  }
};

// Delete/deactivate patient
const deactivatePatient = async (req, res) => {
  try {
    const { patientId } = req.params;
    const clinicId = req.user.clinic_id;

    const result = await db.query(
      'UPDATE patients SET is_active = false WHERE id = $1 AND clinic_id = $2 RETURNING patient_code, full_name',
      [patientId, clinicId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    // Log audit
    await db.query(
      `INSERT INTO audit_logs (clinic_id, user_id, user_type, action, table_name, record_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [clinicId, req.user.id, 'clinic_staff', 'PATIENT_DEACTIVATED', 'patients', patientId]
    );

    res.json({
      message: 'Patient deactivated successfully',
      patient: result.rows[0]
    });

  } catch (error) {
    console.error('Deactivate patient error:', error);
    res.status(500).json({ error: 'Error deactivating patient' });
  }
};

module.exports = {
  registerPatient,
  getPatients,
  getPatientById,
  updatePatient,
  deactivatePatient
};
