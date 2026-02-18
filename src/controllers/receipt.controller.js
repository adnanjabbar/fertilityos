const db = require('../config/database');

// Generate receipt for payment
const generateReceipt = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const {
      patientId,
      amountPaid,
      paymentMethod,
      serviceType,
      serviceDescription,
      cycleId
    } = req.body;

    const clinicId = req.user.clinic_id;

    if (!patientId || !amountPaid) {
      return res.status(400).json({ error: 'Patient ID and amount required' });
    }

    await client.query('BEGIN');

    // Get patient details
    const patientResult = await client.query(
      `SELECT patient_code, full_name, phone, total_paid, outstanding_balance 
       FROM patients WHERE id = $1 AND clinic_id = $2`,
      [patientId, clinicId]
    );

    if (patientResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patient = patientResult.rows[0];

    // Generate receipt number
    const receiptCount = await client.query(
      'SELECT COUNT(*) as count FROM receipts WHERE clinic_id = $1',
      [clinicId]
    );
    const receiptNumber = `RCP-${String(parseInt(receiptCount.rows[0].count) + 1).padStart(6, '0')}`;

    // Insert receipt
    const receiptResult = await client.query(
      `INSERT INTO receipts (
        receipt_number, patient_id, clinic_id, receipt_date,
        amount_paid, payment_method, service_type, service_description,
        cycle_id, issued_by
      ) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        receiptNumber, patientId, clinicId, amountPaid, paymentMethod,
        serviceType, serviceDescription, cycleId, req.user.id
      ]
    );

    // Update patient payment totals
    const newTotalPaid = parseFloat(patient.total_paid || 0) + parseFloat(amountPaid);
    const newOutstanding = parseFloat(patient.outstanding_balance || 0) - parseFloat(amountPaid);

    await client.query(
      `UPDATE patients SET 
        total_paid = $1,
        outstanding_balance = GREATEST($2, 0)
       WHERE id = $3`,
      [newTotalPaid, newOutstanding, patientId]
    );

    // Log audit
    await client.query(
      `INSERT INTO audit_logs (clinic_id, user_id, user_type, action, table_name, record_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [clinicId, req.user.id, 'clinic_staff', 'RECEIPT_GENERATED', 'receipts', receiptResult.rows[0].id]
    );

    await client.query('COMMIT');

    // Get clinic details for receipt
    const clinicResult = await client.query(
      'SELECT * FROM clinics WHERE id = $1',
      [clinicId]
    );

    res.status(201).json({
      message: 'Receipt generated successfully',
      receipt: {
        ...receiptResult.rows[0],
        patient: {
          name: patient.full_name,
          code: patient.patient_code,
          phone: patient.phone
        },
        clinic: clinicResult.rows[0]
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Generate receipt error:', error);
    res.status(500).json({ error: 'Error generating receipt' });
  } finally {
    client.release();
  }
};

// Get all receipts for patient
const getPatientReceipts = async (req, res) => {
  try {
    const { patientId } = req.params;
    const clinicId = req.user.clinic_id;

    const result = await db.query(
      `SELECT r.*, u.full_name as issued_by_name
       FROM receipts r
       LEFT JOIN users u ON r.issued_by = u.id
       WHERE r.patient_id = $1 AND r.clinic_id = $2
       ORDER BY r.receipt_date DESC`,
      [patientId, clinicId]
    );

    res.json({
      receipts: result.rows
    });

  } catch (error) {
    console.error('Get receipts error:', error);
    res.status(500).json({ error: 'Error fetching receipts' });
  }
};

// Get single receipt details (for printing)
const getReceiptDetails = async (req, res) => {
  try {
    const { receiptId } = req.params;
    const clinicId = req.user.clinic_id;

    const result = await db.query(
      `SELECT r.*, 
              p.full_name as patient_name, p.patient_code, p.phone as patient_phone,
              u.full_name as issued_by_name
       FROM receipts r
       JOIN patients p ON r.patient_id = p.id
       LEFT JOIN users u ON r.issued_by = u.id
       WHERE r.id = $1 AND r.clinic_id = $2`,
      [receiptId, clinicId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const receipt = result.rows[0];
    
    // Get clinic details
    const clinicResult = await db.query(
      'SELECT * FROM clinics WHERE id = $1',
      [clinicId]
    );
    
    const clinic = clinicResult.rows[0];

    res.json({
      receipt: {
        ...receipt,
        clinic_name: clinic.clinic_name,
        clinic_address: clinic.address,
        clinic_phone: clinic.phone,
        clinic_email: clinic.email,
        license_number: clinic.license_number
      }
    });

  } catch (error) {
    console.error('Get receipt details error:', error);
    res.status(500).json({ error: 'Error fetching receipt' });
  }
};

module.exports = {
  generateReceipt,
  getPatientReceipts,
  getReceiptDetails
};
