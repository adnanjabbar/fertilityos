// billing.controller.js

/**
 * Billing Controller
 * Handles invoice generation, payment processing, and financial operations
 */

const db = require('../config/database');

/**
 * Generate an invoice for a patient/service
 */
exports.generateInvoice = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const {
            patientId,
            items,
            dueDate,
            notes,
            discountAmount
        } = req.body;

        if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'Patient ID and at least one item are required'
            });
        }

        // Verify patient belongs to this clinic
        const patientCheck = await db.query(
            'SELECT id, full_name FROM patients WHERE id = $1 AND clinic_id = $2',
            [patientId, clinicId]
        );

        if (patientCheck.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Patient not found' });
        }

        // Calculate totals
        let subtotal = 0;
        let taxAmount = 0;
        const processedItems = items.map(item => {
            const itemTotal = (item.quantity || 1) * (item.unitPrice || 0);
            const itemTax = itemTotal * ((item.taxRate || 0) / 100);
            subtotal += itemTotal;
            taxAmount += itemTax;
            return {
                ...item,
                total: itemTotal,
                tax: itemTax
            };
        });

        const discount = parseFloat(discountAmount) || 0;
        const totalAmount = subtotal + taxAmount - discount;
        const outstanding = totalAmount;

        // Generate invoice number
        const countResult = await db.query(
            'SELECT COUNT(*) FROM invoices WHERE clinic_id = $1',
            [clinicId]
        );
        const count = parseInt(countResult.rows[0].count) + 1;
        const invoiceNumber = `INV-${new Date().getFullYear()}-${count.toString().padStart(6, '0')}`;

        // Create invoice record (aligned with existing schema)
        const result = await db.query(
            `INSERT INTO invoices (
                clinic_id, invoice_number, patient_id, invoice_date, due_date,
                items, subtotal, tax_amount, discount_amount, total_amount, 
                amount_paid, outstanding, status, notes, issued_by
            ) VALUES ($1, $2, $3, CURRENT_DATE, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING *`,
            [
                clinicId, invoiceNumber, patientId, dueDate || null,
                JSON.stringify(processedItems), subtotal, taxAmount, discount,
                totalAmount, 0, outstanding, 'pending', notes || null, req.user.id
            ]
        );

        // Log audit
        await db.query(
            `INSERT INTO audit_logs (clinic_id, user_id, user_type, action, table_name, record_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [clinicId, req.user.id, 'clinic_staff', 'INVOICE_GENERATED', 'invoices', result.rows[0].id]
        );

        res.status(201).json({
            success: true,
            message: 'Invoice generated successfully',
            data: {
                invoice: result.rows[0],
                patient: patientCheck.rows[0]
            }
        });
    } catch (error) {
        console.error('Error generating invoice:', error);
        res.status(500).json({ success: false, error: 'Error generating invoice' });
    }
};

/**
 * Get invoice by ID
 */
exports.getInvoice = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const { invoiceId } = req.params;

        const result = await db.query(
            `SELECT i.*, p.full_name as patient_name, p.email as patient_email, p.phone as patient_phone
             FROM invoices i
             JOIN patients p ON i.patient_id = p.id
             WHERE i.id = $1 AND i.clinic_id = $2`,
            [invoiceId, clinicId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, error: 'Invoice not found' });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching invoice:', error);
        res.status(500).json({ success: false, error: 'Error fetching invoice' });
    }
};

/**
 * Get all invoices for the clinic
 */
exports.getInvoices = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const { status, patientId, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        // Build WHERE conditions
        let whereConditions = ['i.clinic_id = $1'];
        const params = [clinicId];

        if (status) {
            params.push(status);
            whereConditions.push(`i.status = $${params.length}`);
        }

        if (patientId) {
            params.push(patientId);
            whereConditions.push(`i.patient_id = $${params.length}`);
        }

        const whereClause = whereConditions.join(' AND ');

        // Get count using dedicated count query
        const countQuery = `
            SELECT COUNT(*) 
            FROM invoices i 
            JOIN patients p ON i.patient_id = p.id 
            WHERE ${whereClause}
        `;
        const countResult = await db.query(countQuery, params);
        const totalCount = parseInt(countResult.rows[0].count);

        // Get paginated results
        const selectQuery = `
            SELECT i.*, p.full_name as patient_name
            FROM invoices i
            JOIN patients p ON i.patient_id = p.id
            WHERE ${whereClause}
            ORDER BY i.created_at DESC 
            LIMIT $${params.length + 1} OFFSET $${params.length + 2}
        `;
        params.push(limit, offset);
        const result = await db.query(selectQuery, params);

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(totalCount / limit),
                totalCount,
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Error fetching invoices:', error);
        res.status(500).json({ success: false, error: 'Error fetching invoices' });
    }
};

/**
 * Process a payment using revenue_transactions table
 */
exports.processPayment = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const {
            invoiceId,
            patientId,
            amount,
            paymentMethod,
            paymentReference,
            description,
            category
        } = req.body;

        if (!amount || !paymentMethod) {
            return res.status(400).json({
                success: false,
                error: 'Amount and payment method are required'
            });
        }

        // Generate transaction number
        const countResult = await db.query(
            'SELECT COUNT(*) FROM revenue_transactions WHERE clinic_id = $1',
            [clinicId]
        );
        const count = parseInt(countResult.rows[0].count) + 1;
        const transactionNumber = `REV-${new Date().getFullYear()}-${count.toString().padStart(6, '0')}`;

        // Record payment as revenue transaction
        const paymentResult = await db.query(
            `INSERT INTO revenue_transactions (
                clinic_id, transaction_number, transaction_date, 
                source_type, source_id, patient_id,
                description, category, gross_amount, discount_amount,
                tax_amount, net_amount, payment_method, payment_reference,
                payment_status, received_by
            ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
            RETURNING *`,
            [
                clinicId, transactionNumber, 
                invoiceId ? 'invoice_payment' : 'patient_payment',
                invoiceId || null, patientId || null,
                description || 'Payment received', category || 'service_revenue',
                amount, 0, 0, amount, paymentMethod, paymentReference || null,
                'received', req.user.id
            ]
        );

        // If payment is for an invoice, update the invoice
        if (invoiceId) {
            const invoiceResult = await db.query(
                'SELECT * FROM invoices WHERE id = $1 AND clinic_id = $2',
                [invoiceId, clinicId]
            );

            if (invoiceResult.rows.length > 0) {
                const invoice = invoiceResult.rows[0];
                const newAmountPaid = parseFloat(invoice.amount_paid) + parseFloat(amount);
                const newOutstanding = parseFloat(invoice.total_amount) - newAmountPaid;
                
                let newStatus = 'pending';
                if (newOutstanding <= 0) {
                    newStatus = 'paid';
                } else if (newAmountPaid > 0) {
                    newStatus = 'partial';
                }

                await db.query(
                    `UPDATE invoices 
                     SET amount_paid = $1, outstanding = $2, status = $3
                     WHERE id = $4`,
                    [newAmountPaid, Math.max(0, newOutstanding), newStatus, invoiceId]
                );
            }
        }

        // Log audit
        await db.query(
            `INSERT INTO audit_logs (clinic_id, user_id, user_type, action, table_name, record_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [clinicId, req.user.id, 'clinic_staff', 'PAYMENT_RECEIVED', 'revenue_transactions', paymentResult.rows[0].id]
        );

        res.status(201).json({
            success: true,
            message: 'Payment processed successfully',
            data: paymentResult.rows[0]
        });
    } catch (error) {
        console.error('Error processing payment:', error);
        res.status(500).json({ success: false, error: 'Error processing payment' });
    }
};

/**
 * Get payment history (revenue transactions)
 */
exports.getPayments = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const { patientId, fromDate, toDate, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        let query = `
            SELECT rt.*, p.full_name as patient_name
            FROM revenue_transactions rt
            LEFT JOIN patients p ON rt.patient_id = p.id
            WHERE rt.clinic_id = $1
        `;
        const params = [clinicId];

        if (patientId) {
            params.push(patientId);
            query += ` AND rt.patient_id = $${params.length}`;
        }

        if (fromDate) {
            params.push(fromDate);
            query += ` AND rt.transaction_date >= $${params.length}`;
        }

        if (toDate) {
            params.push(toDate);
            query += ` AND rt.transaction_date <= $${params.length}`;
        }

        query += ` ORDER BY rt.transaction_date DESC, rt.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
        params.push(limit, offset);

        const result = await db.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching payments:', error);
        res.status(500).json({ success: false, error: 'Error fetching payments' });
    }
};