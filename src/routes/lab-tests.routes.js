const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const { pool } = require('../config/database');

// Get all test categories
router.get('/test-categories', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM test_categories 
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

// Get sample types
router.get('/sample-types', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM sample_types WHERE is_active = true ORDER BY sample_name`
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get container types
router.get('/container-types', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM container_types WHERE is_active = true ORDER BY container_name`
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get all test definitions
router.get('/test-definitions', authenticateToken, async (req, res) => {
    try {
        const { category_id, gender, active_only } = req.query;
        
        let query = `
            SELECT td.*, 
                   tc.category_name,
                   st.sample_name,
                   ct.container_name, ct.color as container_color
            FROM test_definitions td
            LEFT JOIN test_categories tc ON td.category_id = tc.id
            LEFT JOIN sample_types st ON td.sample_type_id = st.id
            LEFT JOIN container_types ct ON td.container_type_id = ct.id
            WHERE (td.clinic_id IS NULL OR td.clinic_id = $1)
        `;
        const params = [req.user.clinic_id];
        let paramIndex = 2;

        if (category_id) {
            query += ` AND td.category_id = $${paramIndex++}`;
            params.push(category_id);
        }
        if (gender) {
            query += ` AND (td.applicable_gender = $${paramIndex++} OR td.applicable_gender = 'both')`;
            params.push(gender);
        }
        if (active_only === 'true') {
            query += ` AND td.is_active = true`;
        }

        query += ` ORDER BY tc.display_order, td.display_order, td.test_name`;

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get single test definition
router.get('/test-definitions/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT td.*, tc.category_name, st.sample_name, ct.container_name
             FROM test_definitions td
             LEFT JOIN test_categories tc ON td.category_id = tc.id
             LEFT JOIN sample_types st ON td.sample_type_id = st.id
             LEFT JOIN container_types ct ON td.container_type_id = ct.id
             WHERE td.id = $1`,
            [req.params.id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create test definition
router.post('/test-definitions', authenticateToken, async (req, res) => {
    try {
        const {
            test_name, test_code, short_name, description, category_id,
            sample_type_id, container_type_id, sample_volume_ml, sample_volume_unit,
            fasting_required, fasting_hours, special_instructions,
            unit, reference_range_female_min, reference_range_female_max,
            reference_range_male_min, reference_range_male_max, reference_range_text,
            base_price, cost_price, turnaround_time_text, applicable_gender,
            is_outsourced, outsource_lab, is_active
        } = req.body;

        const result = await pool.query(
            `INSERT INTO test_definitions (
                clinic_id, test_name, test_code, short_name, description, category_id,
                sample_type_id, container_type_id, sample_volume_ml, sample_volume_unit,
                fasting_required, fasting_hours, special_instructions,
                unit, reference_range_female_min, reference_range_female_max,
                reference_range_male_min, reference_range_male_max, reference_range_text,
                base_price, cost_price, turnaround_time_text, applicable_gender,
                is_outsourced, outsource_lab, is_active
            ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26)
            RETURNING *`,
            [
                req.user.clinic_id, test_name, test_code, short_name, description, category_id,
                sample_type_id, container_type_id, sample_volume_ml, sample_volume_unit || 'ml',
                fasting_required, fasting_hours, special_instructions,
                unit, reference_range_female_min, reference_range_female_max,
                reference_range_male_min, reference_range_male_max, reference_range_text,
                base_price || 0, cost_price, turnaround_time_text, applicable_gender || 'both',
                is_outsourced, outsource_lab, is_active !== false
            ]
        );

        res.json({ success: true, data: result.rows[0], message: 'Test created successfully' });
    } catch (error) {
        console.error('Error:', error);
        if (error.code === '23505') {
            return res.status(400).json({ success: false, message: 'Test code already exists' });
        }
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update test definition
router.put('/test-definitions/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const fields = req.body;
        
        const updates = [];
        const values = [];
        let paramIndex = 1;

        const allowedFields = [
            'test_name', 'test_code', 'short_name', 'description', 'category_id',
            'sample_type_id', 'container_type_id', 'sample_volume_ml', 'sample_volume_unit',
            'fasting_required', 'fasting_hours', 'special_instructions',
            'unit', 'reference_range_female_min', 'reference_range_female_max',
            'reference_range_male_min', 'reference_range_male_max', 'reference_range_text',
            'base_price', 'cost_price', 'turnaround_time_text', 'applicable_gender',
            'is_outsourced', 'outsource_lab', 'is_active'
        ];

        for (const [key, value] of Object.entries(fields)) {
            if (allowedFields.includes(key)) {
                updates.push(`${key} = $${paramIndex++}`);
                values.push(value);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }

        values.push(id);
        const query = `UPDATE test_definitions SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramIndex} RETURNING *`;
        
        const result = await pool.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Test not found' });
        }

        res.json({ success: true, data: result.rows[0], message: 'Test updated successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Delete test definition
router.delete('/test-definitions/:id', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `DELETE FROM test_definitions WHERE id = $1 AND clinic_id = $2 RETURNING *`,
            [req.params.id, req.user.clinic_id]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Test not found or cannot delete system test' });
        }

        res.json({ success: true, message: 'Test deleted successfully' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;

// ==================== LAB ORDERS ====================

// Get all lab orders
router.get('/orders', authenticateToken, async (req, res) => {
    try {
        const { patient_id, status, from_date, to_date } = req.query;
        
        let query = `
            SELECT lo.*, 
                   p.full_name as patient_name, p.mrn, p.gender,
                   array_agg(DISTINCT td.test_code) as tests
            FROM lab_orders lo
            JOIN patients p ON lo.patient_id = p.id
            LEFT JOIN lab_order_items loi ON lo.id = loi.order_id
            LEFT JOIN test_definitions td ON loi.test_id = td.id
            WHERE lo.clinic_id = $1
        `;
        const params = [req.user.clinic_id];
        let paramIndex = 2;

        if (patient_id) {
            query += ` AND lo.patient_id = $${paramIndex++}`;
            params.push(patient_id);
        }
        if (status) {
            query += ` AND lo.status = $${paramIndex++}`;
            params.push(status);
        }
        if (from_date) {
            query += ` AND lo.order_date >= $${paramIndex++}`;
            params.push(from_date);
        }
        if (to_date) {
            query += ` AND lo.order_date <= $${paramIndex++}`;
            params.push(to_date);
        }

        query += ` GROUP BY lo.id, p.full_name, p.mrn, p.gender ORDER BY lo.created_at DESC`;

        const result = await pool.query(query, params);
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Create lab order
router.post('/orders', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        const {
            patient_id, cycle_id, priority, test_ids, 
            lmp_date, cycle_day, clinical_notes, total_amount
        } = req.body;

        // Generate order number
        const countResult = await client.query(
            `SELECT COUNT(*) FROM lab_orders WHERE clinic_id = $1 AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)`,
            [req.user.clinic_id]
        );
        const count = parseInt(countResult.rows[0].count) + 1;
        const orderNumber = `LO-${new Date().getFullYear().toString().slice(-2)}${(new Date().getMonth() + 1).toString().padStart(2, '0')}-${count.toString().padStart(4, '0')}`;

        // Create order
        const orderResult = await client.query(
            `INSERT INTO lab_orders (
                clinic_id, patient_id, cycle_id, order_number, priority,
                lmp_date, cycle_day, clinical_notes, total_amount, net_amount, ordered_by
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $9, $10)
            RETURNING *`,
            [
                req.user.clinic_id, patient_id, cycle_id, orderNumber, priority || 'routine',
                lmp_date, cycle_day, clinical_notes, total_amount || 0, req.user.id
            ]
        );

        const order = orderResult.rows[0];

        // Add order items
        for (const testId of test_ids) {
            const testResult = await client.query(
                `SELECT * FROM test_definitions WHERE id = $1`,
                [testId]
            );
            
            if (testResult.rows.length > 0) {
                const test = testResult.rows[0];
                await client.query(
                    `INSERT INTO lab_order_items (
                        clinic_id, order_id, test_id, test_code, test_name, price,
                        reference_min, reference_max, reference_text, result_unit
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                    [
                        req.user.clinic_id, order.id, testId, test.test_code, test.test_name, test.base_price,
                        test.reference_range_female_min || test.reference_range_male_min,
                        test.reference_range_female_max || test.reference_range_male_max,
                        test.reference_range_text, test.unit
                    ]
                );
            }
        }

        await client.query('COMMIT');
        res.json({ success: true, data: order, message: 'Lab order created successfully' });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    } finally {
        client.release();
    }
});

// Update order workflow status (Professional LIS Workflow)
router.put('/orders/:id/status', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;

        // Allowed workflow states
        const allowedStatuses = [
            'ordered',
            'collected',
            'processing',
            'result-entered',
            'verified',
            'finalized',
            'cancelled'
        ];

        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid status value'
            });
        }

        const result = await pool.query(
            `
            UPDATE lab_orders
            SET
                status = $1::text,

                collection_date = CASE 
                    WHEN $1::text = 'collected' THEN CURRENT_DATE 
                    ELSE collection_date 
                END,

                collection_time = CASE 
                    WHEN $1::text = 'collected' THEN CURRENT_TIME 
                    ELSE collection_time 
                END,

                collected_by = CASE 
                    WHEN $1::text = 'collected' THEN $3 
                    ELSE collected_by 
                END,

                result_status = CASE 
                    WHEN $1::text = 'result-entered' THEN 'entered'
                    ELSE result_status
                END,

                verification_status = CASE
                    WHEN $1::text = 'verified' THEN 'verified'
                    ELSE verification_status
                END,

                completed_at = CASE
                    WHEN $1::text = 'finalized' THEN CURRENT_TIMESTAMP
                    ELSE completed_at
                END,

                updated_at = CURRENT_TIMESTAMP

            WHERE id = $2 
            AND clinic_id = $4

            RETURNING *
            `,
            [status, id, req.user.id, req.user.clinic_id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            data: result.rows[0],
            message: 'Order workflow updated successfully'
        });

    } catch (error) {
        console.error('Workflow Update Error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error updating workflow'
        });
    }
});

// Get single order with items
router.get('/orders/:id', authenticateToken, async (req, res) => {
    try {
        const orderResult = await pool.query(
            `SELECT lo.*, p.full_name as patient_name, p.mrn, p.gender, p.date_of_birth
             FROM lab_orders lo
             JOIN patients p ON lo.patient_id = p.id
             WHERE lo.id = $1 AND lo.clinic_id = $2`,
            [req.params.id, req.user.clinic_id]
        );

        if (orderResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const itemsResult = await pool.query(
            `SELECT loi.*
             FROM lab_order_items loi
             LEFT JOIN test_definitions td ON loi.test_id = td.id
             WHERE loi.order_id = $1`,
            [req.params.id]
        );

        res.json({ 
            success: true, 
            data: {
                ...orderResult.rows[0],
                items: itemsResult.rows
            }
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Save lab results
router.put('/orders/:id/results', authenticateToken, async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        const { id } = req.params;
        const { results } = req.body;

        for (const item of results) {

    // Determine abnormal flag automatically
    let flag = null;

    if (item.result_numeric !== null && item.result_numeric !== undefined) {
        const numeric = parseFloat(item.result_numeric);
        const refMin = item.reference_min !== null ? parseFloat(item.reference_min) : null;
        const refMax = item.reference_max !== null ? parseFloat(item.reference_max) : null;

        if (refMin !== null && numeric < refMin) {
            flag = 'L'; // Low
        } else if (refMax !== null && numeric > refMax) {
            flag = 'H'; // High
        } else {
            flag = 'N'; // Normal
        }
    }

    await client.query(
        `UPDATE lab_order_items
         SET result_numeric = $1,
             result_text = $2,
             result_value = $3,
             interpretation = $4,
             result_flag = $5,
             status = 'completed',
             resulted_at = CURRENT_TIMESTAMP,
             resulted_by = $6,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $7`,
        [
            item.result_numeric || null,
            item.result_text || null,
            item.result_value || null,
            item.interpretation || null,
            flag,
            req.user.id,
            item.id
        ]
    );
}

        await client.query(
            `UPDATE lab_orders
             SET status = 'completed',
                 completed_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [id]
        );

        await client.query('COMMIT');

        res.json({ success: true, message: 'Results saved successfully' });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error(error);
        res.status(500).json({ success: false, message: 'Error saving results' });
    } finally {
        client.release();
    }
});
// Verify lab order (Pathologist Only)
router.put('/orders/:id/verify', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;

        // Only allow specific roles
        const allowedRoles = ['pathologist', 'lab_head', 'admin'];

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'You are not authorized to verify reports'
            });
        }

        const result = await pool.query(
            `
            UPDATE lab_orders
            SET
                verification_status = 'verified',
                status = 'verified',
                verified_at = CURRENT_TIMESTAMP,
                verified_by = $2,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $1
            RETURNING *
            `,
            [id, req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Order not found'
            });
        }

        res.json({
            success: true,
            message: 'Report verified successfully',
            data: result.rows[0]
        });

    } catch (error) {
        console.error('Verification Error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying report'
        });
    }
});
