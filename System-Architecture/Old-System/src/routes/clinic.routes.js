const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const pool = require('../config/database');

// Get clinic settings
router.get('/settings', authenticateToken, async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const result = await pool.query(
            `SELECT c.*, co.country_name, co.currency_code as country_currency, 
                    co.currency_symbol, co.regulatory_body, co.license_field_name
             FROM clinics c
             LEFT JOIN countries co ON c.country_id = co.id
             WHERE c.id = $1`,
            [clinicId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Clinic not found' });
        }
        
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching clinic settings:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Update clinic settings
router.put('/settings', authenticateToken, async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const {
            clinic_name, clinic_code, email, phone, website, address, city, country_id,
            primary_contact_name, primary_contact_phone, primary_contact_email,
            logo_url, logo_base64, currency_code, timezone, date_format, language,
            regulatory_license, regulatory_expiry, tax_id,
            billing_address, bank_name, bank_account, bank_iban
        } = req.body;
        
        // Build dynamic update query
        const updates = [];
        const values = [];
        let paramIndex = 1;
        
        const fields = {
            clinic_name, clinic_code, email, phone, website, address, city, country_id,
            primary_contact_name, primary_contact_phone, primary_contact_email,
            logo_url, logo_base64, currency_code, timezone, date_format, language,
            regulatory_license, regulatory_expiry, tax_id,
            billing_address, bank_name, bank_account, bank_iban
        };
        
        for (const [key, value] of Object.entries(fields)) {
            if (value !== undefined) {
                updates.push(`${key} = $${paramIndex++}`);
                values.push(value);
            }
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ success: false, message: 'No fields to update' });
        }
        
        values.push(clinicId);
        
        const query = `
            UPDATE clinics 
            SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
            WHERE id = $${paramIndex}
            RETURNING *
        `;
        
        const result = await pool.query(query, values);
        
        res.json({ success: true, data: result.rows[0], message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error updating clinic settings:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Get clinic logo
router.get('/logo', authenticateToken, async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const result = await pool.query(
            `SELECT logo_base64, logo_url, clinic_name FROM clinics WHERE id = $1`,
            [clinicId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Clinic not found' });
        }
        
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error('Error fetching logo:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
