const db = require('../config/database');

// Get or create medical history for patient
const getMedicalHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const clinicId = req.user.clinic_id;

    // Verify patient belongs to clinic
    const patientCheck = await db.query(
      'SELECT id FROM patients WHERE id = $1 AND clinic_id = $2',
      [patientId, clinicId]
    );

    if (patientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const result = await db.query(
      `SELECT * FROM medical_history WHERE patient_id = $1 ORDER BY recorded_at DESC LIMIT 1`,
      [patientId]
    );

    if (result.rows.length > 0) {
      res.json({ medicalHistory: result.rows[0] });
    } else {
      // No history yet
      res.json({ medicalHistory: null });
    }

  } catch (error) {
    console.error('Get medical history error:', error);
    res.status(500).json({ error: 'Error fetching medical history' });
  }
};

// Add or update medical history
const updateMedicalHistory = async (req, res) => {
  try {
    const { patientId } = req.params;
    const {
      chiefComplaint,
      durationOfInfertility,
      presentIllness,
      menstrualHistory,
      obstetricHistory,
      medicalConditions,
      surgeries,
      allergies,
      familyHistory,
      lastMenstrualPeriod,
      cycleLengthDays,
      cycleRegularity,
      previousTreatments,
      smoking,
      alcohol,
      exercise
    } = req.body;

    const clinicId = req.user.clinic_id;

    // Check if history exists
    const existing = await db.query(
      'SELECT id FROM medical_history WHERE patient_id = $1',
      [patientId]
    );

    let result;

    if (existing.rows.length > 0) {
      // Update existing
      result = await db.query(
        `UPDATE medical_history SET
          chief_complaint = COALESCE($1, chief_complaint),
          duration_of_infertility = COALESCE($2, duration_of_infertility),
          present_illness = COALESCE($3, present_illness),
          menstrual_history = COALESCE($4, menstrual_history),
          obstetric_history = COALESCE($5, obstetric_history),
          medical_conditions = COALESCE($6, medical_conditions),
          surgeries = COALESCE($7, surgeries),
          allergies = COALESCE($8, allergies),
          family_history = COALESCE($9, family_history),
          last_menstrual_period = COALESCE($10, last_menstrual_period),
          cycle_length_days = COALESCE($11, cycle_length_days),
          cycle_regularity = COALESCE($12, cycle_regularity),
          previous_treatments = COALESCE($13, previous_treatments),
          smoking = COALESCE($14, smoking),
          alcohol = COALESCE($15, alcohol),
          exercise = COALESCE($16, exercise),
          recorded_by = $17,
          updated_at = CURRENT_TIMESTAMP
         WHERE patient_id = $18
         RETURNING *`,
        [
          chiefComplaint, durationOfInfertility, presentIllness, menstrualHistory,
          obstetricHistory, medicalConditions, surgeries, allergies, familyHistory,
          lastMenstrualPeriod, cycleLengthDays, cycleRegularity,
          JSON.stringify(previousTreatments), smoking, alcohol, exercise,
          req.user.id, patientId
        ]
      );
    } else {
      // Create new
      result = await db.query(
        `INSERT INTO medical_history (
          patient_id, clinic_id, chief_complaint, duration_of_infertility,
          present_illness, menstrual_history, obstetric_history,
          medical_conditions, surgeries, allergies, family_history,
          last_menstrual_period, cycle_length_days, cycle_regularity,
          previous_treatments, smoking, alcohol, exercise, recorded_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
        RETURNING *`,
        [
          patientId, clinicId, chiefComplaint, durationOfInfertility,
          presentIllness, menstrualHistory, obstetricHistory,
          medicalConditions, surgeries, allergies, familyHistory,
          lastMenstrualPeriod, cycleLengthDays, cycleRegularity,
          JSON.stringify(previousTreatments), smoking, alcohol, exercise,
          req.user.id
        ]
      );
    }

    res.json({
      message: 'Medical history updated successfully',
      medicalHistory: result.rows[0]
    });

  } catch (error) {
    console.error('Update medical history error:', error);
    res.status(500).json({ error: 'Error updating medical history' });
  }
};

module.exports = {
  getMedicalHistory,
  updateMedicalHistory
};
