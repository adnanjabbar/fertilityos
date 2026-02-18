const db = require('../config/database');

// Get all treatment packages for clinic
const getTreatmentPackages = async (req, res) => {
  try {
    const clinicId = req.user.clinic_id;
    const { category = '' } = req.query;

    let query = 'SELECT * FROM treatment_packages WHERE clinic_id = $1 AND is_active = true';
    const params = [clinicId];

    if (category) {
      query += ' AND category = $2';
      params.push(category);
    }

    query += ' ORDER BY category, package_name';

    const result = await db.query(query, params);

    res.json({
      packages: result.rows
    });

  } catch (error) {
    console.error('Get treatment packages error:', error);
    res.status(500).json({ error: 'Error fetching treatment packages' });
  }
};

// Assign treatment to patient
const assignTreatment = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { patientId } = req.params;
    const {
      treatmentType,
      treatmentName,
      totalCost,
      cycleId,
      startDate,
      notes
    } = req.body;

    const clinicId = req.user.clinic_id;

    if (!treatmentType || !treatmentName || !totalCost) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await client.query('BEGIN');

    // Insert treatment
    const treatmentResult = await client.query(
      `INSERT INTO patient_treatments (
        patient_id, clinic_id, cycle_id, treatment_type, treatment_name,
        total_cost, outstanding, status, start_date, prescribed_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        patientId, clinicId, cycleId, treatmentType, treatmentName,
        totalCost, totalCost, 'planned', startDate, req.user.id, notes
      ]
    );

    // Update patient outstanding balance
    await client.query(
      `UPDATE patients SET outstanding_balance = outstanding_balance + $1 WHERE id = $2`,
      [totalCost, patientId]
    );

    // Log audit
    await client.query(
      `INSERT INTO audit_logs (clinic_id, user_id, user_type, action, table_name, record_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [clinicId, req.user.id, 'clinic_staff', 'TREATMENT_ASSIGNED', 'patient_treatments', treatmentResult.rows[0].id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Treatment assigned successfully',
      treatment: treatmentResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Assign treatment error:', error);
    res.status(500).json({ error: 'Error assigning treatment' });
  } finally {
    client.release();
  }
};

// Get patient treatments
const getPatientTreatments = async (req, res) => {
  try {
    const { patientId } = req.params;
    const clinicId = req.user.clinic_id;

    const result = await db.query(
      `SELECT pt.*, u.full_name as prescribed_by_name, c.cycle_code
       FROM patient_treatments pt
       LEFT JOIN users u ON pt.prescribed_by = u.id
       LEFT JOIN ivf_cycles c ON pt.cycle_id = c.id
       WHERE pt.patient_id = $1 AND pt.clinic_id = $2
       ORDER BY pt.created_at DESC`,
      [patientId, clinicId]
    );

    res.json({
      treatments: result.rows
    });

  } catch (error) {
    console.error('Get patient treatments error:', error);
    res.status(500).json({ error: 'Error fetching treatments' });
  }
};

// Generate invoice for treatment
const generateInvoice = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const {
      patientId,
      items, // Array of {name, quantity, unitPrice, total}
      subtotal,
      taxAmount,
      discountAmount,
      totalAmount,
      dueDate,
      notes
    } = req.body;

    const clinicId = req.user.clinic_id;

    await client.query('BEGIN');

    // Generate invoice number
    const invoiceCount = await client.query(
      'SELECT COUNT(*) as count FROM invoices WHERE clinic_id = $1',
      [clinicId]
    );
    const invoiceNumber = `INV-${String(parseInt(invoiceCount.rows[0].count) + 1).padStart(6, '0')}`;

    // Create invoice
    const invoiceResult = await client.query(
      `INSERT INTO invoices (
        invoice_number, patient_id, clinic_id, invoice_date, due_date,
        items, subtotal, tax_amount, discount_amount, total_amount,
        outstanding, status, notes, issued_by
      ) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *`,
      [
        invoiceNumber, patientId, clinicId, dueDate,
        JSON.stringify(items), subtotal, taxAmount || 0, discountAmount || 0,
        totalAmount, totalAmount, 'pending', notes, req.user.id
      ]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Invoice generated successfully',
      invoice: invoiceResult.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Generate invoice error:', error);
    res.status(500).json({ error: 'Error generating invoice' });
  } finally {
    client.release();
  }
};

// Record payment against invoice
const recordInvoicePayment = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { invoiceId } = req.params;
    const { amountPaid, paymentMethod, serviceDescription } = req.body;
    const clinicId = req.user.clinic_id;

    await client.query('BEGIN');

    // Get invoice
    const invoiceResult = await client.query(
      'SELECT * FROM invoices WHERE id = $1 AND clinic_id = $2',
      [invoiceId, clinicId]
    );

    if (invoiceResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const invoice = invoiceResult.rows[0];
    const newAmountPaid = parseFloat(invoice.amount_paid) + parseFloat(amountPaid);
    const newOutstanding = parseFloat(invoice.outstanding) - parseFloat(amountPaid);

    // Update invoice
    let newStatus = 'pending';
    if (newOutstanding <= 0) {
      newStatus = 'paid';
    } else if (newAmountPaid > 0) {
      newStatus = 'partial';
    }

    await client.query(
      `UPDATE invoices SET 
        amount_paid = $1,
        outstanding = $2,
        status = $3
       WHERE id = $4`,
      [newAmountPaid, Math.max(newOutstanding, 0), newStatus, invoiceId]
    );

    // Generate receipt
    const receiptCount = await client.query(
      'SELECT COUNT(*) as count FROM receipts WHERE clinic_id = $1',
      [clinicId]
    );
    const receiptNumber = `RCP-${String(parseInt(receiptCount.rows[0].count) + 1).padStart(6, '0')}`;

    const receiptResult = await client.query(
      `INSERT INTO receipts (
        receipt_number, patient_id, clinic_id, receipt_date,
        amount_paid, payment_method, service_type, service_description, issued_by
      ) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        receiptNumber, invoice.patient_id, clinicId,
        amountPaid, paymentMethod, 'invoice_payment',
        serviceDescription || `Payment for Invoice ${invoice.invoice_number}`,
        req.user.id
      ]
    );

    // Update patient totals
    await client.query(
      `UPDATE patients SET 
        total_paid = total_paid + $1,
        outstanding_balance = outstanding_balance - $1
       WHERE id = $2`,
      [amountPaid, invoice.patient_id]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Payment recorded successfully',
      receipt: receiptResult.rows[0],
      invoice: {
        id: invoiceId,
        amountPaid: newAmountPaid,
        outstanding: Math.max(newOutstanding, 0),
        status: newStatus
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Record invoice payment error:', error);
    res.status(500).json({ error: 'Error recording payment' });
  } finally {
    client.release();
  }
};

// Get patient invoices
const getPatientInvoices = async (req, res) => {
  try {
    const { patientId } = req.params;
    const clinicId = req.user.clinic_id;

    const result = await db.query(
      `SELECT i.*, u.full_name as issued_by_name
       FROM invoices i
       LEFT JOIN users u ON i.issued_by = u.id
       WHERE i.patient_id = $1 AND i.clinic_id = $2
       ORDER BY i.invoice_date DESC`,
      [patientId, clinicId]
    );

    res.json({
      invoices: result.rows
    });

  } catch (error) {
    console.error('Get patient invoices error:', error);
    res.status(500).json({ error: 'Error fetching invoices' });
  }
};

module.exports = {
  getTreatmentPackages,
  assignTreatment,
  getPatientTreatments,
  generateInvoice,
  recordInvoicePayment,
  getPatientInvoices
};
