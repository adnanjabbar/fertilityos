const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const pool = require('../config/database');

// ==================== DASHBOARD ====================
router.get('/dashboard', authenticateToken, async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const { period } = req.query;
        
        let dateFilter = "DATE_TRUNC('month', CURRENT_DATE)";
        if (period === 'today') dateFilter = 'CURRENT_DATE';
        else if (period === 'week') dateFilter = "DATE_TRUNC('week', CURRENT_DATE)";
        else if (period === 'year') dateFilter = "DATE_TRUNC('year', CURRENT_DATE)";

        // Revenue
        const revenueResult = await pool.query(
            `SELECT COALESCE(SUM(net_amount), 0) as total 
             FROM revenue_transactions 
             WHERE clinic_id = $1 AND transaction_date >= ${dateFilter}`,
            [clinicId]
        );

        // Expenses
        const expenseResult = await pool.query(
            `SELECT COALESCE(SUM(total_amount), 0) as total 
             FROM expenses 
             WHERE clinic_id = $1 AND expense_date >= ${dateFilter}`,
            [clinicId]
        );

        // Pending receivables
        const pendingResult = await pool.query(
            `SELECT COALESCE(SUM(net_amount), 0) as total, COUNT(*) as count 
             FROM revenue_transactions 
             WHERE clinic_id = $1 AND payment_status = 'pending'`,
            [clinicId]
        );

        const totalRevenue = parseFloat(revenueResult.rows[0].total) || 0;
        const totalExpenses = parseFloat(expenseResult.rows[0].total) || 0;

        res.json({
            success: true,
            data: {
                totalRevenue,
                totalExpenses,
                netProfit: totalRevenue - totalExpenses,
                pendingReceivables: parseFloat(pendingResult.rows[0].total) || 0,
                pendingCount: parseInt(pendingResult.rows[0].count) || 0
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== EXPENSE CATEGORIES ====================
router.get('/expense-categories', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM expense_categories 
             WHERE (clinic_id IS NULL OR clinic_id = $1) AND is_active = true 
             ORDER BY display_order, category_name`,
            [req.user.clinic_id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== REVENUE ====================
router.post('/revenue', authenticateToken, async (req, res) => {
    try {
        const {
            transaction_date, source_type, source_id, patient_id,
            description, category, gross_amount, discount_amount, tax_amount,
            net_amount, payment_method, payment_reference, payment_status
        } = req.body;

        // Generate transaction number
        const countResult = await pool.query(
            `SELECT COUNT(*) FROM revenue_transactions WHERE clinic_id = $1`,
            [req.user.clinic_id]
        );
        const count = parseInt(countResult.rows[0].count) + 1;
        const transactionNumber = `REV-${new Date().getFullYear()}-${count.toString().padStart(6, '0')}`;

        const result = await pool.query(
            `INSERT INTO revenue_transactions (
                clinic_id, transaction_number, transaction_date, source_type, source_id,
                patient_id, description, category, gross_amount, discount_amount,
                tax_amount, net_amount, payment_method, payment_reference, payment_status, received_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
            RETURNING *`,
            [
                req.user.clinic_id, transactionNumber, transaction_date, source_type, source_id,
                patient_id, description, category, gross_amount, discount_amount || 0,
                tax_amount || 0, net_amount || gross_amount, payment_method, payment_reference, 
                payment_status || 'received', req.user.id
            ]
        );

        res.json({ success: true, data: result.rows[0], message: 'Revenue recorded successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/revenue', authenticateToken, async (req, res) => {
    try {
        const { from_date, to_date, source_type } = req.query;
        let query = `
            SELECT rt.*, p.full_name as patient_name 
            FROM revenue_transactions rt
            LEFT JOIN patients p ON rt.patient_id = p.id
            WHERE rt.clinic_id = $1
        `;
        const params = [req.user.clinic_id];
        let idx = 2;

        if (from_date) { query += ` AND rt.transaction_date >= $${idx++}`; params.push(from_date); }
        if (to_date) { query += ` AND rt.transaction_date <= $${idx++}`; params.push(to_date); }
        if (source_type) { query += ` AND rt.source_type = $${idx++}`; params.push(source_type); }

        query += ' ORDER BY rt.transaction_date DESC, rt.created_at DESC';

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== EXPENSES ====================
router.post('/expenses', authenticateToken, async (req, res) => {
    try {
        const {
            expense_date, category_id, vendor_id, vendor_name, description,
            amount, tax_amount, payment_method, payment_status, payment_date,
            is_recurring, recurring_frequency, recurring_end_date
        } = req.body;

        const countResult = await pool.query(
            `SELECT COUNT(*) FROM expenses WHERE clinic_id = $1`,
            [req.user.clinic_id]
        );
        const count = parseInt(countResult.rows[0].count) + 1;
        const expenseNumber = `EXP-${new Date().getFullYear()}-${count.toString().padStart(6, '0')}`;

        const total = (parseFloat(amount) || 0) + (parseFloat(tax_amount) || 0);

        const result = await pool.query(
            `INSERT INTO expenses (
                clinic_id, expense_number, expense_date, category_id, vendor_id, vendor_name,
                description, amount, tax_amount, total_amount, payment_method, payment_status,
                payment_date, is_recurring, recurring_frequency, recurring_end_date, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
            RETURNING *`,
            [
                req.user.clinic_id, expenseNumber, expense_date, category_id, vendor_id, vendor_name,
                description, amount, tax_amount || 0, total, payment_method, payment_status || 'pending',
                payment_date, is_recurring, recurring_frequency, recurring_end_date, req.user.id
            ]
        );

        res.json({ success: true, data: result.rows[0], message: 'Expense recorded successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/expenses', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT e.*, ec.category_name 
             FROM expenses e
             LEFT JOIN expense_categories ec ON e.category_id = ec.id
             WHERE e.clinic_id = $1
             ORDER BY e.expense_date DESC`,
            [req.user.clinic_id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== ASSET CATEGORIES ====================
router.get('/asset-categories', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM asset_categories 
             WHERE (clinic_id IS NULL OR clinic_id = $1) AND is_active = true 
             ORDER BY category_name`,
            [req.user.clinic_id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== ASSETS ====================
router.get('/assets', authenticateToken, async (req, res) => {
    try {
        const { category_id, status, is_clinical } = req.query;
        let query = `
            SELECT a.*, ac.category_name, ac.category_type
            FROM assets a
            LEFT JOIN asset_categories ac ON a.category_id = ac.id
            WHERE a.clinic_id = $1
        `;
        const params = [req.user.clinic_id];
        let idx = 2;

        if (category_id) { query += ` AND a.category_id = $${idx++}`; params.push(category_id); }
        if (status) { query += ` AND a.status = $${idx++}`; params.push(status); }
        if (is_clinical !== undefined) { query += ` AND a.is_clinical = $${idx++}`; params.push(is_clinical === 'true'); }

        query += ' ORDER BY a.created_at DESC';

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/assets', authenticateToken, async (req, res) => {
    try {
        const fields = req.body;
        
        // Generate barcode
        const barcode = fields.asset_code;

        const result = await pool.query(
            `INSERT INTO assets (
                clinic_id, asset_code, asset_name, barcode, category_id, asset_type, is_clinical,
                description, serial_number, model_number, brand, location, department,
                purchase_date, purchase_price, warranty_expiry, current_value, salvage_value,
                useful_life_years, last_maintenance_date, next_maintenance_date, maintenance_frequency_days,
                status, condition, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25)
            RETURNING *`,
            [
                req.user.clinic_id, fields.asset_code, fields.asset_name, barcode, fields.category_id,
                fields.asset_type, fields.is_clinical, fields.description, fields.serial_number,
                fields.model_number, fields.brand, fields.location, fields.department,
                fields.purchase_date, fields.purchase_price, fields.warranty_expiry,
                fields.current_value || fields.purchase_price, fields.salvage_value, fields.useful_life_years,
                fields.last_maintenance_date, fields.next_maintenance_date, fields.maintenance_frequency_days,
                fields.status || 'active', fields.condition || 'good', fields.notes
            ]
        );

        res.json({ success: true, data: result.rows[0], message: 'Asset created successfully' });
    } catch (error) {
        console.error('Error:', error);
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'Asset code already exists' });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.put('/assets/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const fields = req.body;
        
        const allowedFields = [
            'asset_name', 'category_id', 'asset_type', 'is_clinical', 'description',
            'serial_number', 'model_number', 'brand', 'location', 'department',
            'purchase_date', 'purchase_price', 'warranty_expiry', 'current_value',
            'salvage_value', 'useful_life_years', 'last_maintenance_date',
            'next_maintenance_date', 'maintenance_frequency_days', 'status', 'condition', 'notes'
        ];

        const updates = [];
        const values = [];
        let idx = 1;

        for (const [key, value] of Object.entries(fields)) {
            if (allowedFields.includes(key)) {
                updates.push(`${key} = $${idx++}`);
                values.push(value);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        values.push(id, req.user.clinic_id);
        const query = `UPDATE assets SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx++} AND clinic_id = $${idx} RETURNING *`;

        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Asset not found' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Asset updated successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== ASSET MAINTENANCE ====================
router.post('/asset-maintenance', authenticateToken, async (req, res) => {
    try {
        const { asset_id, maintenance_date, maintenance_type, description, performed_by, vendor_id, cost, next_due_date } = req.body;

        const result = await pool.query(
            `INSERT INTO asset_maintenance (
                clinic_id, asset_id, maintenance_date, maintenance_type, description,
                performed_by, vendor_id, cost, next_due_date
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING *`,
            [req.user.clinic_id, asset_id, maintenance_date, maintenance_type, description, performed_by, vendor_id, cost, next_due_date]
        );

        // Update asset maintenance dates
        await pool.query(
            `UPDATE assets SET last_maintenance_date = $1, next_maintenance_date = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
            [maintenance_date, next_due_date, asset_id]
        );

        res.json({ success: true, data: result.rows[0], message: 'Maintenance logged successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// ==================== CONTRACTS ====================
router.get('/contracts', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM contracts WHERE clinic_id = $1 ORDER BY renewal_date ASC NULLS LAST, end_date ASC`,
            [req.user.clinic_id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/contracts', authenticateToken, async (req, res) => {
    try {
        const {
            contract_type, contract_name, contract_number, party_name, party_contact, party_email, party_phone,
            start_date, end_date, renewal_date, contract_value, payment_frequency, payment_amount,
            auto_renew, license_number, issuing_authority, regulatory_body, description, notes
        } = req.body;

        const result = await pool.query(
            `INSERT INTO contracts (
                clinic_id, contract_type, contract_name, contract_number, party_name, party_contact, party_email, party_phone,
                start_date, end_date, renewal_date, contract_value, payment_frequency, payment_amount,
                auto_renew, license_number, issuing_authority, regulatory_body, description, notes, created_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
            RETURNING *`,
            [
                req.user.clinic_id, contract_type, contract_name, contract_number, party_name, party_contact, party_email, party_phone,
                start_date, end_date, renewal_date, contract_value, payment_frequency, payment_amount,
                auto_renew, license_number, issuing_authority, regulatory_body, description, notes, req.user.id
            ]
        );

        res.json({ success: true, data: result.rows[0], message: 'Contract saved successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

// ==================== INVENTORY ====================
router.get('/inventory-categories', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM inventory_categories WHERE (clinic_id IS NULL OR clinic_id = $1) AND is_active = true ORDER BY category_name`,
            [req.user.clinic_id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/inventory', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT i.*, ic.category_name FROM inventory_items i 
             LEFT JOIN inventory_categories ic ON i.category_id = ic.id 
             WHERE i.clinic_id = $1 ORDER BY i.item_name`,
            [req.user.clinic_id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/inventory', authenticateToken, async (req, res) => {
    try {
        const { item_code, item_name, category_id, description, unit, unit_price, minimum_stock, reorder_level, reorder_quantity, storage_location } = req.body;
        const result = await pool.query(
            `INSERT INTO inventory_items (clinic_id, item_code, item_name, category_id, description, unit, unit_price, minimum_stock, reorder_level, reorder_quantity, storage_location, current_stock)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0) RETURNING *`,
            [req.user.clinic_id, item_code, item_name, category_id, description, unit, unit_price, minimum_stock, reorder_level, reorder_quantity, storage_location]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/inventory/transaction', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { item_id, transaction_type, quantity, unit_price, vendor_id, invoice_number, patient_id, batch_number, expiry_date, notes } = req.body;
        
        // Record transaction
        await client.query(
            `INSERT INTO inventory_transactions (clinic_id, item_id, transaction_type, quantity, unit_price, vendor_id, invoice_number, patient_id, batch_number, expiry_date, notes, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [req.user.clinic_id, item_id, transaction_type, quantity, unit_price, vendor_id, invoice_number, patient_id, batch_number, expiry_date, notes, req.user.id]
        );
        
        // Update stock
        const stockChange = transaction_type === 'purchase' || transaction_type === 'return' ? quantity : -quantity;
        await client.query(
            `UPDATE inventory_items SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [stockChange, item_id]
        );
        
        await client.query('COMMIT');
        res.json({ success: true, message: 'Transaction recorded' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        client.release();
    }
});

// ==================== INVENTORY ====================
router.get('/inventory-categories', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM inventory_categories WHERE (clinic_id IS NULL OR clinic_id = $1) AND is_active = true ORDER BY category_name`,
            [req.user.clinic_id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.get('/inventory', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT i.*, ic.category_name FROM inventory_items i 
             LEFT JOIN inventory_categories ic ON i.category_id = ic.id 
             WHERE i.clinic_id = $1 ORDER BY i.item_name`,
            [req.user.clinic_id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/inventory', authenticateToken, async (req, res) => {
    try {
        const { item_code, item_name, category_id, description, unit, unit_price, minimum_stock, reorder_level, reorder_quantity, storage_location } = req.body;
        const result = await pool.query(
            `INSERT INTO inventory_items (clinic_id, item_code, item_name, category_id, description, unit, unit_price, minimum_stock, reorder_level, reorder_quantity, storage_location, current_stock)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, 0) RETURNING *`,
            [req.user.clinic_id, item_code, item_name, category_id, description, unit, unit_price, minimum_stock, reorder_level, reorder_quantity, storage_location]
        );
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

router.post('/inventory/transaction', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { item_id, transaction_type, quantity, unit_price, vendor_id, invoice_number, patient_id, batch_number, expiry_date, notes } = req.body;
        
        // Record transaction
        await client.query(
            `INSERT INTO inventory_transactions (clinic_id, item_id, transaction_type, quantity, unit_price, vendor_id, invoice_number, patient_id, batch_number, expiry_date, notes, created_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
            [req.user.clinic_id, item_id, transaction_type, quantity, unit_price, vendor_id, invoice_number, patient_id, batch_number, expiry_date, notes, req.user.id]
        );
        
        // Update stock
        const stockChange = transaction_type === 'purchase' || transaction_type === 'return' ? quantity : -quantity;
        await client.query(
            `UPDATE inventory_items SET current_stock = current_stock + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [stockChange, item_id]
        );
        
        await client.query('COMMIT');
        res.json({ success: true, message: 'Transaction recorded' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    } finally {
        client.release();
    }
});
