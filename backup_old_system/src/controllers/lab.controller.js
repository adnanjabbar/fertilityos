// ============================================
// FertilityOS - Lab Controller
// Handles all laboratory operations
// ============================================

const pool = require('../config/database');

// ============================================
// SEMEN ANALYSIS & PROCESSING
// ============================================

// Generate unique sample number
const generateSampleNumber = async (clinicId, type = 'SA') => {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    const result = await pool.query(
        `SELECT COUNT(*) as count FROM semen_samples WHERE clinic_id = $1 AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())`,
        [clinicId]
    );
    
    const sequence = (parseInt(result.rows[0].count) + 1).toString().padStart(4, '0');
    return `${type}-${year}${month}-${sequence}`;
};

// Create semen sample
exports.createSemenSample = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const sampleNumber = await generateSampleNumber(clinicId, 'SA');
        
        const {
            patient_id, cycle_id, collection_date, collection_time, collection_method,
            abstinence_days, volume_ml, ph, liquefaction_time_min, appearance, viscosity,
            concentration_million_per_ml, total_sperm_count_million,
            progressive_motility_percent, non_progressive_motility_percent, immotile_percent,
            normal_morphology_percent, head_defects_percent, midpiece_defects_percent, tail_defects_percent,
            vitality_percent, round_cells_million_per_ml, wbc_million_per_ml,
            processing_method, processing_notes,
            post_wash_volume_ml, post_wash_concentration, post_wash_motility_percent, post_wash_total_motile_count,
            sample_quality, diagnosis, used_for, notes
        } = req.body;

        // Calculate total motility
        const total_motility = (parseFloat(progressive_motility_percent) || 0) + (parseFloat(non_progressive_motility_percent) || 0);

        const result = await pool.query(
            `INSERT INTO semen_samples (
                clinic_id, patient_id, cycle_id, sample_number, collection_date, collection_time,
                collection_method, abstinence_days, volume_ml, ph, liquefaction_time_min, appearance, viscosity,
                concentration_million_per_ml, total_sperm_count_million,
                progressive_motility_percent, non_progressive_motility_percent, immotile_percent, total_motility_percent,
                normal_morphology_percent, head_defects_percent, midpiece_defects_percent, tail_defects_percent,
                vitality_percent, round_cells_million_per_ml, wbc_million_per_ml,
                processing_method, processing_notes,
                post_wash_volume_ml, post_wash_concentration, post_wash_motility_percent, post_wash_total_motile_count,
                sample_quality, diagnosis, used_for, analyzed_by, processed_by, notes
            ) VALUES (
                $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19,
                $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38
            ) RETURNING *`,
            [
                clinicId, patient_id, cycle_id, sampleNumber, collection_date, collection_time,
                collection_method, abstinence_days, volume_ml, ph, liquefaction_time_min, appearance, viscosity,
                concentration_million_per_ml, total_sperm_count_million,
                progressive_motility_percent, non_progressive_motility_percent, immotile_percent, total_motility,
                normal_morphology_percent, head_defects_percent, midpiece_defects_percent, tail_defects_percent,
                vitality_percent, round_cells_million_per_ml, wbc_million_per_ml,
                processing_method, processing_notes,
                post_wash_volume_ml, post_wash_concentration, post_wash_motility_percent, post_wash_total_motile_count,
                sample_quality, diagnosis, used_for, req.user.id, req.user.id, notes
            ]
        );

        res.status(201).json({
            success: true,
            message: 'Semen sample created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating semen sample:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get all semen samples
exports.getSemenSamples = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const { patient_id, cycle_id, from_date, to_date } = req.query;

        let query = `
            SELECT ss.*, 
                   p.full_name as patient_name,
                   p.mrn
            FROM semen_samples ss
            JOIN patients p ON ss.patient_id = p.id
            WHERE ss.clinic_id = $1
        `;
        const params = [clinicId];
        let paramIndex = 2;

        if (patient_id) {
            query += ` AND ss.patient_id = $${paramIndex++}`;
            params.push(patient_id);
        }

        if (cycle_id) {
            query += ` AND ss.cycle_id = $${paramIndex++}`;
            params.push(cycle_id);
        }

        if (from_date) {
            query += ` AND ss.collection_date >= $${paramIndex++}`;
            params.push(from_date);
        }

        if (to_date) {
            query += ` AND ss.collection_date <= $${paramIndex++}`;
            params.push(to_date);
        }

        query += ` ORDER BY ss.collection_date DESC, ss.created_at DESC`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching semen samples:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get single semen sample
exports.getSemenSample = async (req, res) => {
    try {
        const { id } = req.params;
        const clinicId = req.user.clinic_id;

        const result = await pool.query(
            `SELECT ss.*, 
                    p.full_name as patient_name,
                    p.mrn,
                    u1.full_name as analyzed_by_name,
                    u2.full_name as processed_by_name
             FROM semen_samples ss
             JOIN patients p ON ss.patient_id = p.id
             LEFT JOIN users u1 ON ss.analyzed_by = u1.id
             LEFT JOIN users u2 ON ss.processed_by = u2.id
             WHERE ss.id = $1 AND ss.clinic_id = $2`,
            [id, clinicId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Sample not found' });
        }

        res.json({
            success: true,
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error fetching semen sample:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Update semen sample
exports.updateSemenSample = async (req, res) => {
    try {
        const { id } = req.params;
        const clinicId = req.user.clinic_id;
        const updates = req.body;

        // Build dynamic update query
        const fields = Object.keys(updates).filter(k => k !== 'id' && k !== 'clinic_id');
        const setClause = fields.map((f, i) => `${f} = $${i + 3}`).join(', ');
        const values = fields.map(f => updates[f]);

        const result = await pool.query(
            `UPDATE semen_samples SET ${setClause}, updated_at = NOW() 
             WHERE id = $1 AND clinic_id = $2 RETURNING *`,
            [id, clinicId, ...values]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Sample not found' });
        }

        res.json({
            success: true,
            message: 'Sample updated successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating semen sample:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ============================================
// OOCYTE RETRIEVAL
// ============================================

// Generate retrieval number
const generateRetrievalNumber = async (clinicId) => {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    const result = await pool.query(
        `SELECT COUNT(*) as count FROM oocyte_retrievals WHERE clinic_id = $1 AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())`,
        [clinicId]
    );
    
    const sequence = (parseInt(result.rows[0].count) + 1).toString().padStart(4, '0');
    return `OPU-${year}${month}-${sequence}`;
};

// Create oocyte retrieval
exports.createOocyteRetrieval = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const clinicId = req.user.clinic_id;
        const retrievalNumber = await generateRetrievalNumber(clinicId);
        
        const {
            patient_id, cycle_id, retrieval_date, retrieval_time,
            total_follicles_aspirated, total_oocytes_retrieved,
            mii_count, mi_count, gv_count, degenerated_count, abnormal_count,
            anesthesia_type, procedure_duration_min, complications,
            insemination_method, insemination_time, sperm_source, semen_sample_id,
            notes, oocytes // Array of individual oocyte data
        } = req.body;

        // Insert retrieval record
        const retrievalResult = await client.query(
            `INSERT INTO oocyte_retrievals (
                clinic_id, patient_id, cycle_id, retrieval_number, retrieval_date, retrieval_time,
                total_follicles_aspirated, total_oocytes_retrieved,
                mii_count, mi_count, gv_count, degenerated_count, abnormal_count,
                anesthesia_type, procedure_duration_min, complications,
                insemination_method, insemination_time, sperm_source, semen_sample_id,
                retrieved_by, embryologist_id, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
            RETURNING *`,
            [
                clinicId, patient_id, cycle_id, retrievalNumber, retrieval_date, retrieval_time,
                total_follicles_aspirated, total_oocytes_retrieved,
                mii_count || 0, mi_count || 0, gv_count || 0, degenerated_count || 0, abnormal_count || 0,
                anesthesia_type, procedure_duration_min, complications,
                insemination_method, insemination_time, sperm_source, semen_sample_id,
                req.user.id, req.user.id, notes
            ]
        );

        const retrieval = retrievalResult.rows[0];

        // Insert individual oocytes if provided
        if (oocytes && oocytes.length > 0) {
            for (const oocyte of oocytes) {
                await client.query(
                    `INSERT INTO oocytes (
                        clinic_id, retrieval_id, oocyte_number, dish_position,
                        maturity, morphology_grade, zona_thickness, polar_body,
                        cytoplasm, perivitelline_space, shape, notes
                    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
                    [
                        clinicId, retrieval.id, oocyte.oocyte_number, oocyte.dish_position,
                        oocyte.maturity, oocyte.morphology_grade, oocyte.zona_thickness, oocyte.polar_body,
                        oocyte.cytoplasm, oocyte.perivitelline_space, oocyte.shape, oocyte.notes
                    ]
                );
            }
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Oocyte retrieval recorded successfully',
            data: retrieval
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating oocyte retrieval:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    } finally {
        client.release();
    }
};

// Get oocyte retrievals
exports.getOocyteRetrievals = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const { patient_id, cycle_id, from_date, to_date } = req.query;

        let query = `
            SELECT opr.*, 
                   p.full_name as patient_name,
                   p.mrn,
                   (SELECT COUNT(*) FROM oocytes WHERE retrieval_id = opr.id) as oocyte_count
            FROM oocyte_retrievals opr
            JOIN patients p ON opr.patient_id = p.id
            WHERE opr.clinic_id = $1
        `;
        const params = [clinicId];
        let paramIndex = 2;

        if (patient_id) {
            query += ` AND opr.patient_id = $${paramIndex++}`;
            params.push(patient_id);
        }

        if (cycle_id) {
            query += ` AND opr.cycle_id = $${paramIndex++}`;
            params.push(cycle_id);
        }

        if (from_date) {
            query += ` AND opr.retrieval_date >= $${paramIndex++}`;
            params.push(from_date);
        }

        if (to_date) {
            query += ` AND opr.retrieval_date <= $${paramIndex++}`;
            params.push(to_date);
        }

        query += ` ORDER BY opr.retrieval_date DESC, opr.created_at DESC`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching oocyte retrievals:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get single retrieval with oocytes
exports.getOocyteRetrieval = async (req, res) => {
    try {
        const { id } = req.params;
        const clinicId = req.user.clinic_id;

        const retrievalResult = await pool.query(
            `SELECT opr.*, 
                    p.full_name as patient_name,
                    p.mrn
             FROM oocyte_retrievals opr
             JOIN patients p ON opr.patient_id = p.id
             WHERE opr.id = $1 AND opr.clinic_id = $2`,
            [id, clinicId]
        );

        if (retrievalResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Retrieval not found' });
        }

        const oocytesResult = await pool.query(
            `SELECT * FROM oocytes WHERE retrieval_id = $1 ORDER BY oocyte_number`,
            [id]
        );

        res.json({
            success: true,
            data: {
                ...retrievalResult.rows[0],
                oocytes: oocytesResult.rows
            }
        });
    } catch (error) {
        console.error('Error fetching oocyte retrieval:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Update fertilization check
exports.updateFertilizationCheck = async (req, res) => {
    try {
        const { oocyteId } = req.params;
        const clinicId = req.user.clinic_id;
        const { fertilization_status, pronuclei_count, polar_bodies_count, notes } = req.body;

        const result = await pool.query(
            `UPDATE oocytes SET 
                fertilization_checked = true,
                fertilization_time = NOW(),
                fertilization_status = $1,
                pronuclei_count = $2,
                polar_bodies_count = $3,
                status = CASE WHEN $1 = '2PN' THEN 'fertilized' ELSE 'failed' END,
                notes = COALESCE($4, notes),
                updated_at = NOW()
             WHERE id = $5 AND clinic_id = $6
             RETURNING *`,
            [fertilization_status, pronuclei_count, polar_bodies_count, notes, oocyteId, clinicId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Oocyte not found' });
        }

        res.json({
            success: true,
            message: 'Fertilization check updated',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating fertilization check:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ============================================
// EMBRYO MANAGEMENT
// ============================================

// Generate embryo code
const generateEmbryoCode = async (clinicId, patientId) => {
    const year = new Date().getFullYear().toString().slice(-2);
    
    const result = await pool.query(
        `SELECT COUNT(*) as count FROM lab_embryos WHERE clinic_id = $1 AND patient_id = $2`,
        [clinicId, patientId]
    );
    
    const sequence = (parseInt(result.rows[0].count) + 1).toString().padStart(3, '0');
    return `EMB-${patientId}-${year}-${sequence}`;
};

// Create embryo from fertilized oocyte
exports.createEmbryo = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        
        const {
            patient_id, cycle_id, retrieval_id, oocyte_id, embryo_number,
            oocyte_source, sperm_source, fertilization_method, fertilization_date, fertilization_time,
            notes
        } = req.body;

        const embryoCode = await generateEmbryoCode(clinicId, patient_id);

        const result = await pool.query(
            `INSERT INTO lab_embryos (
                clinic_id, patient_id, cycle_id, retrieval_id, oocyte_id,
                embryo_number, embryo_code, oocyte_source, sperm_source,
                fertilization_method, fertilization_date, fertilization_time,
                current_day, current_stage, created_by, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 1, 'zygote', $13, $14)
            RETURNING *`,
            [
                clinicId, patient_id, cycle_id, retrieval_id, oocyte_id,
                embryo_number, embryoCode, oocyte_source || 'self', sperm_source || 'partner',
                fertilization_method, fertilization_date, fertilization_time,
                req.user.id, notes
            ]
        );

        // Update oocyte with embryo link
        if (oocyte_id) {
            await pool.query(
                `UPDATE oocytes SET embryo_id = $1, status = 'fertilized' WHERE id = $2`,
                [result.rows[0].id, oocyte_id]
            );
        }

        res.status(201).json({
            success: true,
            message: 'Embryo created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating embryo:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get embryos
exports.getEmbryos = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const { patient_id, cycle_id, outcome, current_day } = req.query;

        let query = `
            SELECT e.*, 
                   p.full_name as patient_name,
                   p.mrn,
                   (SELECT ea.current_grade FROM embryo_assessments ea 
                    WHERE ea.embryo_id = e.id ORDER BY ea.assessment_day DESC LIMIT 1) as latest_grade
            FROM lab_embryos e
            JOIN patients p ON e.patient_id = p.id
            WHERE e.clinic_id = $1
        `;
        const params = [clinicId];
        let paramIndex = 2;

        if (patient_id) {
            query += ` AND e.patient_id = $${paramIndex++}`;
            params.push(patient_id);
        }

        if (cycle_id) {
            query += ` AND e.cycle_id = $${paramIndex++}`;
            params.push(cycle_id);
        }

        if (outcome) {
            query += ` AND e.outcome = $${paramIndex++}`;
            params.push(outcome);
        }

        if (current_day) {
            query += ` AND e.current_day = $${paramIndex++}`;
            params.push(current_day);
        }

        query += ` ORDER BY e.created_at DESC`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching embryos:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get single embryo with all assessments
exports.getEmbryo = async (req, res) => {
    try {
        const { id } = req.params;
        const clinicId = req.user.clinic_id;

        const embryoResult = await pool.query(
            `SELECT e.*, 
                    p.full_name as patient_name,
                    p.mrn
             FROM lab_embryos e
             JOIN patients p ON e.patient_id = p.id
             WHERE e.id = $1 AND e.clinic_id = $2`,
            [id, clinicId]
        );

        if (embryoResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Embryo not found' });
        }

        const assessmentsResult = await pool.query(
            `SELECT ea.*, u.name as assessed_by_name
             FROM embryo_assessments ea
             LEFT JOIN users u ON ea.assessed_by = u.id
             WHERE ea.embryo_id = $1
             ORDER BY ea.assessment_day ASC`,
            [id]
        );

        res.json({
            success: true,
            data: {
                ...embryoResult.rows[0],
                assessments: assessmentsResult.rows
            }
        });
    } catch (error) {
        console.error('Error fetching embryo:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Add embryo assessment
exports.addEmbryoAssessment = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const clinicId = req.user.clinic_id;
        const { embryoId } = req.params;
        
        const {
            assessment_day, assessment_date, assessment_time, hours_post_fertilization,
            cell_count, fragmentation_percent, symmetry, multinucleation, compaction,
            cleavage_grade, morula_grade,
            blastocyst_expansion, icm_grade, te_grade, blastocyst_grade,
            expansion_score, icm_score, te_score,
            zona_status, cytoplasm_quality, vacuoles,
            development_status, quality_category, suitable_for_transfer, suitable_for_freeze,
            notes, image_path
        } = req.body;

        // Insert assessment
        const assessmentResult = await client.query(
            `INSERT INTO embryo_assessments (
                clinic_id, embryo_id, assessment_day, assessment_date, assessment_time,
                hours_post_fertilization, cell_count, fragmentation_percent, symmetry,
                multinucleation, compaction, cleavage_grade, morula_grade,
                blastocyst_expansion, icm_grade, te_grade, blastocyst_grade,
                expansion_score, icm_score, te_score,
                zona_status, cytoplasm_quality, vacuoles,
                development_status, quality_category, suitable_for_transfer, suitable_for_freeze,
                assessed_by, notes, image_path
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30)
            RETURNING *`,
            [
                clinicId, embryoId, assessment_day, assessment_date, assessment_time,
                hours_post_fertilization, cell_count, fragmentation_percent, symmetry,
                multinucleation, compaction, cleavage_grade, morula_grade,
                blastocyst_expansion, icm_grade, te_grade, blastocyst_grade,
                expansion_score, icm_score, te_score,
                zona_status, cytoplasm_quality, vacuoles,
                development_status, quality_category, suitable_for_transfer, suitable_for_freeze,
                req.user.id, notes, image_path
            ]
        );

        // Update embryo current state
        let currentStage = 'zygote';
        let currentGrade = cleavage_grade || morula_grade || blastocyst_grade;
        
        if (assessment_day >= 5 && blastocyst_grade) {
            currentStage = 'blastocyst';
        } else if (assessment_day === 4) {
            currentStage = 'morula';
        } else if (assessment_day >= 2) {
            currentStage = 'cleavage';
        }

        const isArrested = development_status === 'arrested';

        await client.query(
            `UPDATE lab_embryos SET 
                current_day = $1,
                current_stage = $2,
                current_grade = $3,
                is_arrested = $4,
                arrest_day = CASE WHEN $4 THEN $1 ELSE NULL END,
                updated_at = NOW()
             WHERE id = $5`,
            [assessment_day, currentStage, currentGrade, isArrested, embryoId]
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Assessment added successfully',
            data: assessmentResult.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error adding embryo assessment:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    } finally {
        client.release();
    }
};

// Update embryo outcome
exports.updateEmbryoOutcome = async (req, res) => {
    try {
        const { id } = req.params;
        const clinicId = req.user.clinic_id;
        const { outcome, outcome_date, transfer_id, freeze_id, notes } = req.body;

        const result = await pool.query(
            `UPDATE lab_embryos SET 
                outcome = $1,
                outcome_date = $2,
                transfer_id = $3,
                transfer_date = CASE WHEN $1 = 'transferred' THEN $2 ELSE NULL END,
                freeze_id = $4,
                freeze_date = CASE WHEN $1 = 'frozen' THEN $2 ELSE NULL END,
                notes = COALESCE($5, notes),
                updated_at = NOW()
             WHERE id = $6 AND clinic_id = $7
             RETURNING *`,
            [outcome, outcome_date, transfer_id, freeze_id, notes, id, clinicId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Embryo not found' });
        }

        res.json({
            success: true,
            message: 'Embryo outcome updated',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error updating embryo outcome:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// ============================================
// CRYOPRESERVATION
// ============================================

// Get cryo tanks
exports.getCryoTanks = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;

        const result = await pool.query(
            `SELECT t.*,
                    (SELECT COUNT(*) FROM cryo_canisters WHERE tank_id = t.id) as canister_count,
                    (SELECT COUNT(*) FROM cryo_preservation WHERE tank_id = t.id AND status = 'stored') as stored_specimens
             FROM cryo_tanks t
             WHERE t.clinic_id = $1 AND t.status = 'active'
             ORDER BY t.tank_name`,
            [clinicId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching cryo tanks:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Create cryo tank
exports.createCryoTank = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const { tank_name, tank_code, tank_type, location, capacity_liters, notes } = req.body;

        const result = await pool.query(
            `INSERT INTO cryo_tanks (clinic_id, tank_name, tank_code, tank_type, location, capacity_liters, notes)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [clinicId, tank_name, tank_code, tank_type, location, capacity_liters, notes]
        );

        res.status(201).json({
            success: true,
            message: 'Cryo tank created',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating cryo tank:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get tank structure (canisters and canes)
exports.getTankStructure = async (req, res) => {
    try {
        const { tankId } = req.params;
        const clinicId = req.user.clinic_id;

        const tankResult = await pool.query(
            `SELECT * FROM cryo_tanks WHERE id = $1 AND clinic_id = $2`,
            [tankId, clinicId]
        );

        if (tankResult.rows.length === 0) {
            return res.status(404).json({ success: false, message: 'Tank not found' });
        }

        const canistersResult = await pool.query(
            `SELECT c.*,
                    (SELECT json_agg(cane ORDER BY cane.cane_code) 
                     FROM cryo_canes cane WHERE cane.canister_id = c.id) as canes
             FROM cryo_canisters c
             WHERE c.tank_id = $1
             ORDER BY c.canister_code`,
            [tankId]
        );

        res.json({
            success: true,
            data: {
                tank: tankResult.rows[0],
                canisters: canistersResult.rows
            }
        });
    } catch (error) {
        console.error('Error fetching tank structure:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Create canister
exports.createCanister = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const { tank_id, canister_name, canister_code, position_in_tank, total_canes } = req.body;

        const result = await pool.query(
            `INSERT INTO cryo_canisters (clinic_id, tank_id, canister_name, canister_code, position_in_tank, total_canes)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [clinicId, tank_id, canister_name, canister_code, position_in_tank, total_canes || 0]
        );

        res.status(201).json({
            success: true,
            message: 'Canister created',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating canister:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Create cane
exports.createCane = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const { canister_id, cane_code, cane_color, position_in_canister, total_goblets } = req.body;

        const result = await pool.query(
            `INSERT INTO cryo_canes (clinic_id, canister_id, cane_code, cane_color, position_in_canister, total_goblets)
             VALUES ($1, $2, $3, $4, $5, $6)
             RETURNING *`,
            [clinicId, canister_id, cane_code, cane_color, position_in_canister, total_goblets || 0]
        );

        res.status(201).json({
            success: true,
            message: 'Cane created',
            data: result.rows[0]
        });
    } catch (error) {
        console.error('Error creating cane:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Generate freeze code
const generateFreezeCode = async (clinicId, type) => {
    const typePrefix = type === 'embryo' ? 'FE' : type === 'oocyte' ? 'FO' : 'FS';
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    const result = await pool.query(
        `SELECT COUNT(*) as count FROM cryo_preservation 
         WHERE clinic_id = $1 AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())`,
        [clinicId]
    );
    
    const sequence = (parseInt(result.rows[0].count) + 1).toString().padStart(4, '0');
    return `${typePrefix}-${year}${month}-${sequence}`;
};

// Create freeze record
exports.createFreezeRecord = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const clinicId = req.user.clinic_id;
        
        const {
            patient_id, cycle_id, freeze_date, freeze_time, specimen_type,
            total_specimens, specimens_per_device, total_devices,
            freeze_method, device_type, media_used,
            tank_id, canister_id, cane_id, goblet_position,
            quality_at_freeze, grade_at_freeze,
            embryo_ids, embryo_day, embryo_stages,
            oocyte_ids, maturity_at_freeze,
            semen_sample_id, post_thaw_expected_motility,
            consent_signed, consent_expiry_date, storage_duration_years,
            witnessed_by, notes
        } = req.body;

        const freezeCode = await generateFreezeCode(clinicId, specimen_type);
        
        // Build location string
        const locationParts = [];
        if (tank_id) {
            const tankResult = await client.query(`SELECT tank_name FROM cryo_tanks WHERE id = $1`, [tank_id]);
            if (tankResult.rows.length) locationParts.push(`Tank: ${tankResult.rows[0].tank_name}`);
        }
        if (canister_id) {
            const canisterResult = await client.query(`SELECT canister_name FROM cryo_canisters WHERE id = $1`, [canister_id]);
            if (canisterResult.rows.length) locationParts.push(`Canister: ${canisterResult.rows[0].canister_name}`);
        }
        if (cane_id) {
            const caneResult = await client.query(`SELECT cane_code, cane_color FROM cryo_canes WHERE id = $1`, [cane_id]);
            if (caneResult.rows.length) locationParts.push(`Cane: ${caneResult.rows[0].cane_code} (${caneResult.rows[0].cane_color})`);
        }
        if (goblet_position) locationParts.push(`Goblet: ${goblet_position}`);
        
        const specific_location = locationParts.join(' > ');

        const result = await client.query(
            `INSERT INTO cryo_preservation (
                clinic_id, patient_id, cycle_id, freeze_code, freeze_date, freeze_time,
                specimen_type, total_specimens, specimens_per_device, total_devices,
                freeze_method, device_type, media_used,
                tank_id, canister_id, cane_id, goblet_position, specific_location,
                quality_at_freeze, grade_at_freeze,
                embryo_ids, embryo_day, embryo_stages,
                oocyte_ids, maturity_at_freeze,
                semen_sample_id, post_thaw_expected_motility,
                consent_signed, consent_expiry_date, storage_duration_years,
                frozen_by, witnessed_by, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33)
            RETURNING *`,
            [
                clinicId, patient_id, cycle_id, freezeCode, freeze_date, freeze_time,
                specimen_type, total_specimens, specimens_per_device, total_devices,
                freeze_method, device_type, media_used,
                tank_id, canister_id, cane_id, goblet_position, specific_location,
                quality_at_freeze, grade_at_freeze,
                embryo_ids, embryo_day, embryo_stages,
                oocyte_ids, maturity_at_freeze,
                semen_sample_id, post_thaw_expected_motility,
                consent_signed, consent_expiry_date, storage_duration_years,
                req.user.id, witnessed_by, notes
            ]
        );

        // Update embryo records if freezing embryos
        if (embryo_ids && embryo_ids.length > 0) {
            await client.query(
                `UPDATE lab_embryos SET 
                    outcome = 'frozen', 
                    outcome_date = $1, 
                    freeze_id = $2,
                    freeze_date = $1
                 WHERE id = ANY($3)`,
                [freeze_date, result.rows[0].id, embryo_ids]
            );
        }

        // Update oocyte records if freezing oocytes
        if (oocyte_ids && oocyte_ids.length > 0) {
            await client.query(
                `UPDATE oocytes SET status = 'frozen' WHERE id = ANY($1)`,
                [oocyte_ids]
            );
        }

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Freeze record created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating freeze record:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    } finally {
        client.release();
    }
};

// Get freeze records
exports.getFreezeRecords = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const { patient_id, specimen_type, status } = req.query;

        let query = `
            SELECT cp.*,
                   p.full_name as patient_name,
                   p.mrn,
                   t.tank_name,
                   u1.name as frozen_by_name,
                   u2.name as witnessed_by_name
            FROM cryo_preservation cp
            JOIN patients p ON cp.patient_id = p.id
            LEFT JOIN cryo_tanks t ON cp.tank_id = t.id
            LEFT JOIN users u1 ON cp.frozen_by = u1.id
            LEFT JOIN users u2 ON cp.witnessed_by = u2.id
            WHERE cp.clinic_id = $1
        `;
        const params = [clinicId];
        let paramIndex = 2;

        if (patient_id) {
            query += ` AND cp.patient_id = $${paramIndex++}`;
            params.push(patient_id);
        }

        if (specimen_type) {
            query += ` AND cp.specimen_type = $${paramIndex++}`;
            params.push(specimen_type);
        }

        if (status) {
            query += ` AND cp.status = $${paramIndex++}`;
            params.push(status);
        }

        query += ` ORDER BY cp.freeze_date DESC`;

        const result = await pool.query(query, params);

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching freeze records:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Generate thaw code
const generateThawCode = async (clinicId) => {
    const year = new Date().getFullYear().toString().slice(-2);
    const month = (new Date().getMonth() + 1).toString().padStart(2, '0');
    
    const result = await pool.query(
        `SELECT COUNT(*) as count FROM cryo_thaw 
         WHERE clinic_id = $1 AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW())`,
        [clinicId]
    );
    
    const sequence = (parseInt(result.rows[0].count) + 1).toString().padStart(4, '0');
    return `TH-${year}${month}-${sequence}`;
};

// Create thaw record
exports.createThawRecord = async (req, res) => {
    const client = await pool.connect();
    
    try {
        await client.query('BEGIN');
        
        const clinicId = req.user.clinic_id;
        
        const {
            freeze_id, thaw_date, thaw_time,
            specimens_thawed, devices_thawed,
            specimens_survived, quality_post_thaw, grade_post_thaw,
            post_thaw_motility, post_thaw_concentration,
            expansion_post_thaw, re_expansion_time_hours,
            used_for, transfer_id, witnessed_by, notes
        } = req.body;

        const thawCode = await generateThawCode(clinicId);
        const survivalRate = specimens_thawed > 0 ? (specimens_survived / specimens_thawed * 100).toFixed(2) : 0;

        const result = await client.query(
            `INSERT INTO cryo_thaw (
                clinic_id, freeze_id, thaw_code, thaw_date, thaw_time,
                specimens_thawed, devices_thawed, specimens_survived, survival_rate_percent,
                quality_post_thaw, grade_post_thaw,
                post_thaw_motility, post_thaw_concentration,
                expansion_post_thaw, re_expansion_time_hours,
                used_for, transfer_id, thawed_by, witnessed_by, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
            RETURNING *`,
            [
                clinicId, freeze_id, thawCode, thaw_date, thaw_time,
                specimens_thawed, devices_thawed, specimens_survived, survivalRate,
                quality_post_thaw, grade_post_thaw,
                post_thaw_motility, post_thaw_concentration,
                expansion_post_thaw, re_expansion_time_hours,
                used_for, transfer_id, req.user.id, witnessed_by, notes
            ]
        );

        // Update freeze record status
        await client.query(
            `UPDATE cryo_preservation SET 
                status = 'thawed',
                updated_at = NOW()
             WHERE id = $1`,
            [freeze_id]
        );

        await client.query('COMMIT');

        res.status(201).json({
            success: true,
            message: 'Thaw record created successfully',
            data: result.rows[0]
        });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error creating thaw record:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    } finally {
        client.release();
    }
};

// ============================================
// LAB DASHBOARD & STATISTICS
// ============================================

exports.getLabDashboard = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;
        const today = new Date().toISOString().split('T')[0];

        // Today's retrievals
        const retrievalsToday = await pool.query(
            `SELECT COUNT(*) as count FROM oocyte_retrievals 
             WHERE clinic_id = $1 AND retrieval_date = $2`,
            [clinicId, today]
        );

        // Active embryos (not yet frozen/transferred/discarded)
        const activeEmbryos = await pool.query(
            `SELECT COUNT(*) as count FROM lab_embryos 
             WHERE clinic_id = $1 AND outcome IS NULL AND is_arrested = false`,
            [clinicId]
        );

        // Embryos by day
        const embryosByDay = await pool.query(
            `SELECT current_day, COUNT(*) as count FROM lab_embryos 
             WHERE clinic_id = $1 AND outcome IS NULL AND is_arrested = false
             GROUP BY current_day ORDER BY current_day`,
            [clinicId]
        );

        // Frozen specimens count
        const frozenSpecimens = await pool.query(
            `SELECT specimen_type, COUNT(*) as count, SUM(total_specimens) as total
             FROM cryo_preservation 
             WHERE clinic_id = $1 AND status = 'stored'
             GROUP BY specimen_type`,
            [clinicId]
        );

        // Recent semen samples
        const recentSamples = await pool.query(
            `SELECT ss.*, p.full_name as patient_name
             FROM semen_samples ss
             JOIN patients p ON ss.patient_id = p.id
             WHERE ss.clinic_id = $1
             ORDER BY ss.collection_date DESC LIMIT 5`,
            [clinicId]
        );

        // Pending fertilization checks
        const pendingFertChecks = await pool.query(
            `SELECT o.*, opr.retrieval_date, p.full_name as patient_name
             FROM oocytes o
             JOIN oocyte_retrievals opr ON o.retrieval_id = opr.id
             JOIN patients p ON opr.patient_id = p.id
             WHERE o.clinic_id = $1 
               AND o.maturity = 'MII' 
               AND o.fertilization_checked = false
               AND opr.retrieval_date >= CURRENT_DATE - INTERVAL '2 days'
             ORDER BY opr.retrieval_date`,
            [clinicId]
        );

        res.json({
            success: true,
            data: {
                retrievals_today: parseInt(retrievalsToday.rows[0].count),
                active_embryos: parseInt(activeEmbryos.rows[0].count),
                embryos_by_day: embryosByDay.rows,
                frozen_specimens: frozenSpecimens.rows,
                recent_samples: recentSamples.rows,
                pending_fert_checks: pendingFertChecks.rows
            }
        });
    } catch (error) {
        console.error('Error fetching lab dashboard:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get embryos needing assessment today
exports.getTodaysAssessments = async (req, res) => {
    try {
        const clinicId = req.user.clinic_id;

        const result = await pool.query(
            `SELECT e.*, 
                    p.full_name as patient_name,
                    p.mrn,
                    e.fertilization_date + (e.current_day || ' days')::interval as expected_assessment_date,
                    (SELECT MAX(assessment_day) FROM embryo_assessments WHERE embryo_id = e.id) as last_assessment_day
             FROM lab_embryos e
             JOIN patients p ON e.patient_id = p.id
             WHERE e.clinic_id = $1 
               AND e.outcome IS NULL 
               AND e.is_arrested = false
               AND e.fertilization_date + (e.current_day || ' days')::interval <= CURRENT_DATE
             ORDER BY e.current_day ASC, e.created_at ASC`,
            [clinicId]
        );

        res.json({
            success: true,
            data: result.rows
        });
    } catch (error) {
        console.error('Error fetching today\'s assessments:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};
