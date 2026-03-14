const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const pool = require('../config/database');

// Get all countries
router.get('/', authenticateToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT * FROM countries WHERE is_active = true ORDER BY country_name`
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching countries:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get single country with ID documents
router.get('/:id', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const countryResult = await pool.query(
            `SELECT * FROM countries WHERE id = $1`,
            [id]
        );
        
        if (countryResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Country not found' });
        }
        
        const idDocsResult = await pool.query(
            `SELECT * FROM country_id_documents WHERE country_id = $1 AND is_active = true ORDER BY display_order`,
            [id]
        );
        
        res.json({ 
            success: true, 
            data: {
                ...countryResult.rows[0],
                id_documents: idDocsResult.rows
            }
        });
    } catch (error) {
        console.error('Error fetching country:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

// Get ID document types for a country
router.get('/:id/id-documents', authenticateToken, async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query(
            `SELECT * FROM country_id_documents WHERE country_id = $1 AND is_active = true ORDER BY display_order`,
            [id]
        );
        res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching ID documents:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
});

module.exports = router;
