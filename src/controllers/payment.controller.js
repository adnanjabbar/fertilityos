/**
 * Payment Controller
 * 
 * Handles multiple payment methods for patient billing:
 * - Stripe for credit/debit card processing
 * - Cash payments
 * - Cheque payments
 * - Bank transfer payments
 */

const db = require('../config/database');

// Payment method constants
const PAYMENT_METHODS = {
    CREDIT_CARD: 'credit_card',
    DEBIT_CARD: 'debit_card',
    CASH: 'cash',
    CHEQUE: 'cheque',
    BANK_TRANSFER: 'bank_transfer',
    INSURANCE: 'insurance',
    PAYMENT_PLAN: 'payment_plan'
};

// Payment status constants
const PAYMENT_STATUS = {
    PENDING: 'pending',
    PROCESSING: 'processing',
    COMPLETED: 'completed',
    FAILED: 'failed',
    REFUNDED: 'refunded',
    CANCELLED: 'cancelled',
    AWAITING_CLEARANCE: 'awaiting_clearance'
};

/**
 * Get Stripe configuration status
 */
const getStripeStatus = async (req, res) => {
    try {
        const isConfigured = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);
        
        res.json({
            success: true,
            data: {
                isConfigured,
                publishableKey: isConfigured ? process.env.STRIPE_PUBLISHABLE_KEY : null,
                supportedMethods: ['credit_card', 'debit_card'],
                currencies: ['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'PKR', 'INR', 'AED']
            }
        });
    } catch (error) {
        console.error('Get Stripe status error:', error);
        res.status(500).json({ success: false, error: 'Error checking Stripe configuration' });
    }
};

/**
 * Create a Stripe payment intent for card payments
 */
const createPaymentIntent = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const { amount, currency = 'USD', patientId, invoiceId, description } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Valid amount is required' 
            });
        }

        // Check if Stripe is configured
        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(400).json({
                success: false,
                error: 'Stripe is not configured. Please configure STRIPE_SECRET_KEY in environment variables.'
            });
        }

        // Initialize Stripe
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

        // Convert amount to cents (Stripe uses smallest currency unit)
        const amountInCents = Math.round(amount * 100);

        // Get clinic details for statement descriptor
        const clinicResult = await db.query(
            'SELECT clinic_name FROM clinics WHERE id = $1',
            [clinicId]
        );
        const clinicName = clinicResult.rows[0]?.clinic_name || 'Fertility Clinic';

        // Create payment intent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: amountInCents,
            currency: currency.toLowerCase(),
            metadata: {
                clinic_id: clinicId,
                patient_id: patientId || '',
                invoice_id: invoiceId || '',
                created_by: req.user.id
            },
            statement_descriptor_suffix: clinicName.substring(0, 22),
            description: description || `Payment to ${clinicName}`
        });

        // Record pending payment
        const countResult = await db.query(
            'SELECT COUNT(*) FROM revenue_transactions WHERE clinic_id = $1',
            [clinicId]
        );
        const transactionNumber = `PAY-${new Date().getFullYear()}-${(parseInt(countResult.rows[0].count) + 1).toString().padStart(6, '0')}`;

        await db.query(
            `INSERT INTO revenue_transactions (
                clinic_id, transaction_number, transaction_date, source_type, source_id,
                patient_id, description, category, gross_amount, net_amount,
                payment_method, payment_reference, payment_status, received_by
            ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
            [
                clinicId, transactionNumber, 'stripe_payment', invoiceId, patientId,
                description || 'Card payment', 'service_revenue', amount, amount,
                PAYMENT_METHODS.CREDIT_CARD, paymentIntent.id, PAYMENT_STATUS.PROCESSING, req.user.id
            ]
        );

        res.json({
            success: true,
            data: {
                clientSecret: paymentIntent.client_secret,
                paymentIntentId: paymentIntent.id,
                transactionNumber,
                amount,
                currency
            }
        });

    } catch (error) {
        console.error('Create payment intent error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Error creating payment intent' 
        });
    }
};

/**
 * Confirm Stripe payment (webhook or manual confirmation)
 */
const confirmStripePayment = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const { paymentIntentId } = req.body;

        if (!paymentIntentId) {
            return res.status(400).json({ 
                success: false, 
                error: 'Payment intent ID is required' 
            });
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            return res.status(400).json({
                success: false,
                error: 'Stripe is not configured'
            });
        }

        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        // Update transaction status
        let status = PAYMENT_STATUS.PENDING;
        if (paymentIntent.status === 'succeeded') {
            status = PAYMENT_STATUS.COMPLETED;
        } else if (paymentIntent.status === 'canceled') {
            status = PAYMENT_STATUS.CANCELLED;
        } else if (paymentIntent.status === 'requires_payment_method') {
            status = PAYMENT_STATUS.FAILED;
        }

        await db.query(
            `UPDATE revenue_transactions 
             SET payment_status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE payment_reference = $2 AND clinic_id = $3`,
            [status, paymentIntentId, clinicId]
        );

        // If payment succeeded and linked to invoice, update invoice
        if (status === PAYMENT_STATUS.COMPLETED && paymentIntent.metadata.invoice_id) {
            const invoiceId = paymentIntent.metadata.invoice_id;
            const amount = paymentIntent.amount / 100; // Convert from cents

            const invoiceResult = await db.query(
                'SELECT amount_paid, total_amount FROM invoices WHERE id = $1 AND clinic_id = $2',
                [invoiceId, clinicId]
            );

            if (invoiceResult.rows.length > 0) {
                const invoice = invoiceResult.rows[0];
                const newAmountPaid = parseFloat(invoice.amount_paid) + amount;
                const newOutstanding = parseFloat(invoice.total_amount) - newAmountPaid;
                
                let invoiceStatus = 'pending';
                if (newOutstanding <= 0) {
                    invoiceStatus = 'paid';
                } else if (newAmountPaid > 0) {
                    invoiceStatus = 'partial';
                }

                await db.query(
                    `UPDATE invoices 
                     SET amount_paid = $1, outstanding = $2, status = $3
                     WHERE id = $4`,
                    [newAmountPaid, Math.max(0, newOutstanding), invoiceStatus, invoiceId]
                );
            }
        }

        // Log audit
        await db.query(
            `INSERT INTO audit_logs (clinic_id, user_id, user_type, action, table_name, record_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [clinicId, req.user.id, 'clinic_staff', 'STRIPE_PAYMENT_CONFIRMED', 'revenue_transactions', paymentIntentId]
        );

        res.json({
            success: true,
            data: {
                status,
                paymentIntentId,
                stripeStatus: paymentIntent.status
            }
        });

    } catch (error) {
        console.error('Confirm Stripe payment error:', error);
        res.status(500).json({ 
            success: false, 
            error: error.message || 'Error confirming payment' 
        });
    }
};

/**
 * Process a manual payment (cash, cheque, bank transfer)
 */
const processManualPayment = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const {
            patientId,
            invoiceId,
            amount,
            paymentMethod,
            paymentReference,
            description,
            category,
            chequeNumber,
            chequeDate,
            chequeBankName,
            bankTransferReference,
            bankName,
            transferDate,
            notes
        } = req.body;

        // Validation
        if (!amount || amount <= 0) {
            return res.status(400).json({ 
                success: false, 
                error: 'Valid amount is required' 
            });
        }

        if (!paymentMethod) {
            return res.status(400).json({ 
                success: false, 
                error: 'Payment method is required' 
            });
        }

        const validMethods = [PAYMENT_METHODS.CASH, PAYMENT_METHODS.CHEQUE, PAYMENT_METHODS.BANK_TRANSFER];
        if (!validMethods.includes(paymentMethod)) {
            return res.status(400).json({ 
                success: false, 
                error: `Invalid payment method. Use: ${validMethods.join(', ')}` 
            });
        }

        // Generate transaction number
        const countResult = await db.query(
            'SELECT COUNT(*) FROM revenue_transactions WHERE clinic_id = $1',
            [clinicId]
        );
        const count = parseInt(countResult.rows[0].count) + 1;
        const transactionNumber = `PAY-${new Date().getFullYear()}-${count.toString().padStart(6, '0')}`;

        // Determine initial status based on payment method
        let status = PAYMENT_STATUS.COMPLETED;
        let reference = paymentReference || '';

        if (paymentMethod === PAYMENT_METHODS.CHEQUE) {
            status = PAYMENT_STATUS.AWAITING_CLEARANCE;
            reference = chequeNumber || '';
        } else if (paymentMethod === PAYMENT_METHODS.BANK_TRANSFER) {
            reference = bankTransferReference || '';
        }

        // Build metadata for different payment types
        const metadata = {};
        if (paymentMethod === PAYMENT_METHODS.CHEQUE) {
            metadata.cheque_number = chequeNumber;
            metadata.cheque_date = chequeDate;
            metadata.bank_name = chequeBankName;
        } else if (paymentMethod === PAYMENT_METHODS.BANK_TRANSFER) {
            metadata.bank_name = bankName;
            metadata.transfer_reference = bankTransferReference;
            metadata.transfer_date = transferDate;
        }
        if (notes) {
            metadata.notes = notes;
        }

        // Record payment
        const result = await db.query(
            `INSERT INTO revenue_transactions (
                clinic_id, transaction_number, transaction_date, source_type, source_id,
                patient_id, description, category, gross_amount, discount_amount,
                tax_amount, net_amount, payment_method, payment_reference,
                payment_status, metadata, received_by
            ) VALUES ($1, $2, CURRENT_DATE, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *`,
            [
                clinicId, transactionNumber,
                invoiceId ? 'invoice_payment' : 'patient_payment',
                invoiceId || null, patientId || null,
                description || `${paymentMethod} payment`, category || 'service_revenue',
                amount, 0, 0, amount, paymentMethod, reference,
                status, JSON.stringify(metadata), req.user.id
            ]
        );

        // If payment is for an invoice and completed, update the invoice
        if (invoiceId && status === PAYMENT_STATUS.COMPLETED) {
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
            [clinicId, req.user.id, 'clinic_staff', 'MANUAL_PAYMENT_RECORDED', 'revenue_transactions', result.rows[0].id]
        );

        res.status(201).json({
            success: true,
            message: 'Payment recorded successfully',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Process manual payment error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error processing payment' 
        });
    }
};

/**
 * Update cheque clearance status
 */
const updateChequeStatus = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const { transactionId } = req.params;
        const { status, notes } = req.body;

        const validStatuses = [PAYMENT_STATUS.COMPLETED, PAYMENT_STATUS.FAILED];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ 
                success: false, 
                error: `Status must be: ${validStatuses.join(' or ')}` 
            });
        }

        // Get current transaction
        const txResult = await db.query(
            `SELECT * FROM revenue_transactions 
             WHERE id = $1 AND clinic_id = $2 AND payment_method = $3`,
            [transactionId, clinicId, PAYMENT_METHODS.CHEQUE]
        );

        if (txResult.rows.length === 0) {
            return res.status(404).json({ 
                success: false, 
                error: 'Cheque payment not found' 
            });
        }

        const transaction = txResult.rows[0];

        // Update status
        await db.query(
            `UPDATE revenue_transactions 
             SET payment_status = $1, updated_at = CURRENT_TIMESTAMP
             WHERE id = $2`,
            [status, transactionId]
        );

        // If cleared and linked to invoice, update invoice
        if (status === PAYMENT_STATUS.COMPLETED && transaction.source_id) {
            const invoiceResult = await db.query(
                'SELECT * FROM invoices WHERE id = $1 AND clinic_id = $2',
                [transaction.source_id, clinicId]
            );

            if (invoiceResult.rows.length > 0) {
                const invoice = invoiceResult.rows[0];
                const newAmountPaid = parseFloat(invoice.amount_paid) + parseFloat(transaction.net_amount);
                const newOutstanding = parseFloat(invoice.total_amount) - newAmountPaid;
                
                let invoiceStatus = 'pending';
                if (newOutstanding <= 0) {
                    invoiceStatus = 'paid';
                } else if (newAmountPaid > 0) {
                    invoiceStatus = 'partial';
                }

                await db.query(
                    `UPDATE invoices 
                     SET amount_paid = $1, outstanding = $2, status = $3
                     WHERE id = $4`,
                    [newAmountPaid, Math.max(0, newOutstanding), invoiceStatus, transaction.source_id]
                );
            }
        }

        // Log audit
        await db.query(
            `INSERT INTO audit_logs (clinic_id, user_id, user_type, action, table_name, record_id)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [clinicId, req.user.id, 'clinic_staff', 'CHEQUE_STATUS_UPDATED', 'revenue_transactions', transactionId]
        );

        res.json({
            success: true,
            message: `Cheque marked as ${status}`,
            data: { transactionId, status }
        });

    } catch (error) {
        console.error('Update cheque status error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error updating cheque status' 
        });
    }
};

/**
 * Get available payment methods for the clinic
 */
const getPaymentMethods = async (req, res) => {
    try {
        const stripeConfigured = !!(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_PUBLISHABLE_KEY);

        const methods = [
            {
                id: PAYMENT_METHODS.CASH,
                name: 'Cash',
                description: 'Cash payment at the clinic',
                available: true,
                requiresReference: false
            },
            {
                id: PAYMENT_METHODS.CHEQUE,
                name: 'Cheque',
                description: 'Payment by cheque (requires clearance)',
                available: true,
                requiresReference: true,
                fields: ['chequeNumber', 'chequeDate', 'chequeBankName']
            },
            {
                id: PAYMENT_METHODS.BANK_TRANSFER,
                name: 'Bank Transfer',
                description: 'Direct bank transfer',
                available: true,
                requiresReference: true,
                fields: ['bankTransferReference', 'bankName', 'transferDate']
            },
            {
                id: PAYMENT_METHODS.CREDIT_CARD,
                name: 'Credit Card',
                description: 'Pay with credit card via Stripe',
                available: stripeConfigured,
                requiresStripe: true
            },
            {
                id: PAYMENT_METHODS.DEBIT_CARD,
                name: 'Debit Card',
                description: 'Pay with debit card via Stripe',
                available: stripeConfigured,
                requiresStripe: true
            }
        ];

        res.json({
            success: true,
            data: {
                methods,
                stripeConfigured,
                publishableKey: stripeConfigured ? process.env.STRIPE_PUBLISHABLE_KEY : null
            }
        });

    } catch (error) {
        console.error('Get payment methods error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error fetching payment methods' 
        });
    }
};

/**
 * Get payment history for a patient
 */
const getPatientPayments = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const { patientId } = req.params;
        const { page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const result = await db.query(
            `SELECT rt.*, u.full_name as received_by_name
             FROM revenue_transactions rt
             LEFT JOIN users u ON rt.received_by = u.id
             WHERE rt.clinic_id = $1 AND rt.patient_id = $2
             ORDER BY rt.transaction_date DESC, rt.created_at DESC
             LIMIT $3 OFFSET $4`,
            [clinicId, patientId, limit, offset]
        );

        const countResult = await db.query(
            `SELECT COUNT(*) FROM revenue_transactions 
             WHERE clinic_id = $1 AND patient_id = $2`,
            [clinicId, patientId]
        );

        res.json({
            success: true,
            data: result.rows,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(parseInt(countResult.rows[0].count) / limit),
                totalCount: parseInt(countResult.rows[0].count),
                limit: parseInt(limit)
            }
        });

    } catch (error) {
        console.error('Get patient payments error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error fetching patient payments' 
        });
    }
};

/**
 * Get pending cheques awaiting clearance
 */
const getPendingCheques = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;

        const result = await db.query(
            `SELECT rt.*, p.full_name as patient_name, u.full_name as received_by_name
             FROM revenue_transactions rt
             LEFT JOIN patients p ON rt.patient_id = p.id
             LEFT JOIN users u ON rt.received_by = u.id
             WHERE rt.clinic_id = $1 
                AND rt.payment_method = $2 
                AND rt.payment_status = $3
             ORDER BY rt.transaction_date ASC`,
            [clinicId, PAYMENT_METHODS.CHEQUE, PAYMENT_STATUS.AWAITING_CLEARANCE]
        );

        res.json({
            success: true,
            data: result.rows
        });

    } catch (error) {
        console.error('Get pending cheques error:', error);
        res.status(500).json({ 
            success: false, 
            error: 'Error fetching pending cheques' 
        });
    }
};

module.exports = {
    getStripeStatus,
    createPaymentIntent,
    confirmStripePayment,
    processManualPayment,
    updateChequeStatus,
    getPaymentMethods,
    getPatientPayments,
    getPendingCheques,
    PAYMENT_METHODS,
    PAYMENT_STATUS
};
