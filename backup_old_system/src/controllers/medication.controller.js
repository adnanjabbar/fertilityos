const db = require('../config/database');

// Get all medications in clinic inventory
const getMedications = async (req, res) => {
  try {
    const clinicId = req.user.clinic_id;
    const { search = '', category = '' } = req.query;

    let query = `SELECT * FROM medications WHERE clinic_id = $1 AND is_active = true`;
    const params = [clinicId];

    if (search) {
      query += ` AND (medication_name ILIKE $${params.length + 1} OR generic_name ILIKE $${params.length + 1})`;
      params.push(`%${search}%`);
    }

    if (category) {
      query += ` AND category = $${params.length + 1}`;
      params.push(category);
    }

    query += ` ORDER BY medication_name`;

    const result = await db.query(query, params);

    res.json({
      medications: result.rows
    });

  } catch (error) {
    console.error('Get medications error:', error);
    res.status(500).json({ error: 'Error fetching medications' });
  }
};

// Add medication to inventory
const addMedication = async (req, res) => {
  try {
    const {
      medicationName,
      genericName,
      brandName,
      category,
      dosageForm,
      strength,
      unitPrice,
      stockQuantity,
      reorderLevel
    } = req.body;

    const clinicId = req.user.clinic_id;

    const result = await db.query(
      `INSERT INTO medications (
        clinic_id, medication_name, generic_name, brand_name,
        category, dosage_form, strength, unit_price,
        stock_quantity, reorder_level
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        clinicId, medicationName, genericName, brandName,
        category, dosageForm, strength, unitPrice,
        stockQuantity, reorderLevel
      ]
    );

    res.status(201).json({
      message: 'Medication added successfully',
      medication: result.rows[0]
    });

  } catch (error) {
    console.error('Add medication error:', error);
    res.status(500).json({ error: 'Error adding medication' });
  }
};

// Get patient's current medications
const getPatientMedications = async (req, res) => {
  try {
    const { patientId } = req.params;
    const { type = 'current' } = req.query; // current or previous
    const clinicId = req.user.clinic_id;

    const isCurrent = type === 'current';

    const result = await db.query(
      `SELECT pm.*, m.medication_name as med_name, m.category, u.full_name as prescribed_by_name
       FROM patient_medications pm
       LEFT JOIN medications m ON pm.medication_id = m.id
       LEFT JOIN users u ON pm.prescribed_by = u.id
       WHERE pm.patient_id = $1 AND pm.clinic_id = $2 
       AND pm.is_current = $3
       ORDER BY pm.start_date DESC`,
      [patientId, clinicId, isCurrent]
    );

    res.json({
      medications: result.rows
    });

  } catch (error) {
    console.error('Get patient medications error:', error);
    res.status(500).json({ error: 'Error fetching patient medications' });
  }
};

// Add medication to patient
const addPatientMedication = async (req, res) => {
  try {
    const { patientId } = req.params;
    const {
      medicationId,
      medicationName, // For external medications
      dosage,
      frequency,
      route,
      startDate,
      endDate,
      isCurrent,
      isPrevious,
      notes
    } = req.body;

    const clinicId = req.user.clinic_id;

    const result = await db.query(
      `INSERT INTO patient_medications (
        patient_id, medication_id, medication_name, clinic_id,
        dosage, frequency, route, start_date, end_date,
        is_current, is_previous, prescribed_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        patientId, medicationId, medicationName, clinicId,
        dosage, frequency, route, startDate, endDate,
        isCurrent, isPrevious, req.user.id, notes
      ]
    );

    res.status(201).json({
      message: 'Medication added to patient',
      medication: result.rows[0]
    });

  } catch (error) {
    console.error('Add patient medication error:', error);
    res.status(500).json({ error: 'Error adding patient medication' });
  }
};

// Create prescription
const createPrescription = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { patientId } = req.params;
    const {
      diagnosis,
      medications, // Array of {medication, dosage, frequency}
      instructions,
      followUpDate
    } = req.body;

    const clinicId = req.user.clinic_id;

    await client.query('BEGIN');

    // Generate prescription number
    const prescCount = await client.query(
      'SELECT COUNT(*) as count FROM prescriptions WHERE clinic_id = $1',
      [clinicId]
    );
    const prescriptionNumber = `RX-${String(parseInt(prescCount.rows[0].count) + 1).padStart(6, '0')}`;

    // Insert prescription
    const result = await client.query(
      `INSERT INTO prescriptions (
        prescription_number, patient_id, clinic_id, prescription_date,
        diagnosis, medications, instructions, follow_up_date, prescribed_by
      ) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        prescriptionNumber, patientId, clinicId, diagnosis,
        JSON.stringify(medications), instructions, followUpDate, req.user.id
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Prescription created successfully',
      prescription: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create prescription error:', error);
    res.status(500).json({ error: 'Error creating prescription' });
  } finally {
    client.release();
  }
};

module.exports = {
  getMedications,
  addMedication,
  getPatientMedications,
  addPatientMedication,
  createPrescription
};
