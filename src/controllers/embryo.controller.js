const db = require('../config/database');

// Update embryo development (Day 2, 3, 4, 5, 6)
const updateEmbryoDevelopment = async (req, res) => {
  try {
    const { embryoId } = req.params;
    const {
      day,
      cells,
      grade,
      fragmentation,
      symmetry,
      stage,
      icmGrade,
      teGrade,
      expansion,
      overallGrade,
      notes
    } = req.body;

    const clinicId = req.user.clinic_id;

    // Verify embryo belongs to clinic
    const embryoCheck = await db.query(
      `SELECT e.id, e.cycle_id, e.embryo_number
       FROM embryos e
       JOIN ivf_cycles c ON e.cycle_id = c.id
       WHERE e.id = $1 AND c.clinic_id = $2`,
      [embryoId, clinicId]
    );

    if (embryoCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Embryo not found' });
    }

    let updateFields = [];
    let values = [];
    let paramCount = 1;

    // Build dynamic update based on day
    if (day === 2) {
      if (cells !== undefined) {
        updateFields.push(`day2_cells = $${paramCount++}`);
        values.push(cells);
      }
      if (grade) {
        updateFields.push(`day2_grade = $${paramCount++}`);
        values.push(grade);
      }
      if (fragmentation) {
        updateFields.push(`day2_fragmentation = $${paramCount++}`);
        values.push(fragmentation);
      }
      if (symmetry) {
        updateFields.push(`day2_symmetry = $${paramCount++}`);
        values.push(symmetry);
      }
    } else if (day === 3) {
      if (cells !== undefined) {
        updateFields.push(`day3_cells = $${paramCount++}`);
        values.push(cells);
      }
      if (grade) {
        updateFields.push(`day3_grade = $${paramCount++}`);
        values.push(grade);
      }
      if (fragmentation) {
        updateFields.push(`day3_fragmentation = $${paramCount++}`);
        values.push(fragmentation);
      }
      if (symmetry) {
        updateFields.push(`day3_symmetry = $${paramCount++}`);
        values.push(symmetry);
      }
    } else if (day === 4) {
      if (stage) {
        updateFields.push(`day4_stage = $${paramCount++}`);
        values.push(stage);
      }
      if (grade) {
        updateFields.push(`day4_grade = $${paramCount++}`);
        values.push(grade);
      }
    } else if (day === 5) {
      if (stage) {
        updateFields.push(`day5_stage = $${paramCount++}`);
        values.push(stage);
      }
      if (icmGrade) {
        updateFields.push(`day5_icm_grade = $${paramCount++}`);
        values.push(icmGrade);
      }
      if (teGrade) {
        updateFields.push(`day5_te_grade = $${paramCount++}`);
        values.push(teGrade);
      }
      if (expansion) {
        updateFields.push(`day5_expansion = $${paramCount++}`);
        values.push(expansion);
      }
      if (overallGrade) {
        updateFields.push(`day5_overall_grade = $${paramCount++}`);
        values.push(overallGrade);
      }
    } else if (day === 6) {
      if (stage) {
        updateFields.push(`day6_stage = $${paramCount++}`);
        values.push(stage);
      }
      if (grade) {
        updateFields.push(`day6_grade = $${paramCount++}`);
        values.push(grade);
      }
    }

    if (notes) {
      updateFields.push(`notes = $${paramCount++}`);
      values.push(notes);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    values.push(embryoId);

    const result = await db.query(
      `UPDATE embryos SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`,
      values
    );

    // Log audit
    await db.query(
      `INSERT INTO audit_logs (clinic_id, user_id, user_type, action, table_name, record_id, changes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [clinicId, req.user.id, 'clinic_staff', 'EMBRYO_UPDATED', 'embryos', embryoId,
       JSON.stringify({ day, ...req.body })]
    );

    res.json({
      message: `Day ${day} embryo development updated`,
      embryo: result.rows[0]
    });

  } catch (error) {
    console.error('Update embryo error:', error);
    res.status(500).json({ error: 'Error updating embryo development' });
  }
};

// Get all embryos for a cycle
const getEmbryosByCycle = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const clinicId = req.user.clinic_id;

    // Verify cycle belongs to clinic
    const cycleCheck = await db.query(
      'SELECT id FROM ivf_cycles WHERE id = $1 AND clinic_id = $2',
      [cycleId, clinicId]
    );

    if (cycleCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Cycle not found' });
    }

    const result = await db.query(
      'SELECT * FROM embryos WHERE cycle_id = $1 ORDER BY embryo_number',
      [cycleId]
    );

    res.json({
      embryos: result.rows
    });

  } catch (error) {
    console.error('Get embryos error:', error);
    res.status(500).json({ error: 'Error fetching embryos' });
  }
};

// Update embryo status (transferred, frozen, arrested, discarded)
const updateEmbryoStatus = async (req, res) => {
  try {
    const { embryoId } = req.params;
    const { status, discardReason, notes } = req.body;
    const clinicId = req.user.clinic_id;

    const validStatuses = ['developing', 'transferred', 'frozen', 'arrested', 'discarded'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const updateData = {
      status,
      ...(status === 'discarded' && discardReason && { discard_reason: discardReason }),
      ...(notes && { notes })
    };

    const fields = Object.keys(updateData).map((key, i) => `${key} = $${i + 1}`);
    const values = Object.values(updateData);
    values.push(embryoId);

    // Add timestamp based on status
    if (status === 'transferred') {
      fields.push(`transfer_date = CURRENT_TIMESTAMP`);
    } else if (status === 'frozen') {
      fields.push(`freeze_date = CURRENT_TIMESTAMP`);
    } else if (status === 'discarded') {
      fields.push(`discard_date = CURRENT_TIMESTAMP`);
    }

    const result = await db.query(
      `UPDATE embryos SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${values.length}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Embryo not found' });
    }

    res.json({
      message: 'Embryo status updated',
      embryo: result.rows[0]
    });

  } catch (error) {
    console.error('Update embryo status error:', error);
    res.status(500).json({ error: 'Error updating embryo status' });
  }
};

// Record embryo transfer
const recordEmbryoTransfer = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { cycleId } = req.params;
    const {
      transferDate,
      transferType,
      embryoDay,
      embryoIds,
      endometrialThicknessMm,
      endometrialPattern,
      performedBy,
      catheterType,
      difficultyLevel,
      ultrasoundGuided,
      bloodOnCatheter,
      mucusOnCatheter,
      trialTransferDone,
      complications,
      notes
    } = req.body;

    const clinicId = req.user.clinic_id;

    if (!embryoIds || embryoIds.length === 0) {
      return res.status(400).json({ error: 'At least one embryo must be selected' });
    }

    await client.query('BEGIN');

    const result = await client.query(
      `INSERT INTO embryo_transfers (
        cycle_id, transfer_date, transfer_type, embryo_day, number_of_embryos,
        embryos_transferred, endometrial_thickness_mm, endometrial_pattern,
        performed_by, catheter_type, difficulty_level, ultrasound_guided,
        blood_on_catheter, mucus_on_catheter, trial_transfer_done,
        complications, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      RETURNING *`,
      [
        cycleId, transferDate, transferType, embryoDay, embryoIds.length,
        embryoIds, endometrialThicknessMm, endometrialPattern,
        performedBy, catheterType, difficultyLevel, ultrasoundGuided,
        bloodOnCatheter, mucusOnCatheter, trialTransferDone,
        complications, notes
      ]
    );

    // Update embryo statuses to transferred
    for (const embryoId of embryoIds) {
      await client.query(
        `UPDATE embryos SET status = 'transferred', transfer_date = $1 WHERE id = $2`,
        [transferDate, embryoId]
      );
    }

    // Update cycle stage and transfer date
    await client.query(
      `UPDATE ivf_cycles 
       SET current_stage = 'waiting',
           embryo_transfer_date = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [transferDate, cycleId]
    );

    // Log audit
    await client.query(
      `INSERT INTO audit_logs (clinic_id, user_id, user_type, action, table_name, record_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [clinicId, req.user.id, 'clinic_staff', 'EMBRYO_TRANSFER_RECORDED', 'embryo_transfers', result.rows[0].id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Embryo transfer recorded successfully',
      transfer: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Record transfer error:', error);
    res.status(500).json({ error: 'Error recording embryo transfer' });
  } finally {
    client.release();
  }
};

// Freeze embryos (cryopreservation)
const freezeEmbryos = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { cycleId } = req.params;
    const {
      embryoIds,
      freezeDate,
      tankNumber,
      canisterNumber,
      caneColor,
      positionNumber,
      storageLocation,
      embryoDay,
      storageExpiryDate,
      consentFormSigned,
      notes
    } = req.body;

    const clinicId = req.user.clinic_id;
    const patientId = req.body.patientId;

    if (!embryoIds || embryoIds.length === 0) {
      return res.status(400).json({ error: 'At least one embryo must be selected' });
    }

    await client.query('BEGIN');

    // Get embryo grades
    const embryoGrades = [];
    for (const embryoId of embryoIds) {
      const embryoResult = await client.query(
        'SELECT day5_overall_grade, day3_grade FROM embryos WHERE id = $1',
        [embryoId]
      );
      if (embryoResult.rows.length > 0) {
        embryoGrades.push(embryoResult.rows[0].day5_overall_grade || embryoResult.rows[0].day3_grade || 'N/A');
      }
    }

    const result = await client.query(
      `INSERT INTO cryopreservation (
        clinic_id, patient_id, cycle_id, specimen_type, freeze_date,
        tank_number, canister_number, cane_color, position_number, storage_location,
        number_of_specimens, specimen_ids, embryo_day, embryo_grades,
        storage_expiry_date, consent_form_signed, frozen_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        clinicId, patientId, cycleId, 'embryo', freezeDate,
        tankNumber, canisterNumber, caneColor, positionNumber, storageLocation,
        embryoIds.length, embryoIds, embryoDay, embryoGrades,
        storageExpiryDate, consentFormSigned, req.user.id, notes
      ]
    );

    // Update embryo statuses
    for (const embryoId of embryoIds) {
      await client.query(
        `UPDATE embryos SET status = 'frozen', freeze_date = $1 WHERE id = $2`,
        [freezeDate, embryoId]
      );
    }

    await client.query('COMMIT');

    res.status(201).json({
      message: `${embryoIds.length} embryo(s) frozen successfully`,
      cryopreservation: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Freeze embryos error:', error);
    res.status(500).json({ error: 'Error freezing embryos' });
  } finally {
    client.release();
  }
};

// Record pregnancy outcome
const recordPregnancyOutcome = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { cycleId } = req.params;
    const {
      firstBetaDate,
      firstBetaValue,
      secondBetaDate,
      secondBetaValue,
      clinicalPregnancy,
      ultrasoundDate,
      gestationalSacs,
      fetalHeartbeats,
      pregnancyType,
      outcome,
      outcomeDate,
      deliveryDate,
      gestationalAgeAtDelivery,
      birthWeightGrams,
      birthComplications,
      notes
    } = req.body;

    const clinicId = req.user.clinic_id;

    await client.query('BEGIN');

    // Calculate beta doubling time if both betas provided
    let betaDoublingTime = null;
    if (firstBetaValue && secondBetaValue && firstBetaDate && secondBetaDate) {
      const hoursDiff = (new Date(secondBetaDate) - new Date(firstBetaDate)) / (1000 * 60 * 60);
      betaDoublingTime = (hoursDiff * Math.log(2) / Math.log(secondBetaValue / firstBetaValue)).toFixed(2);
    }

    const result = await client.query(
      `INSERT INTO pregnancy_outcomes (
        cycle_id, first_beta_date, first_beta_value, second_beta_date, second_beta_value,
        beta_doubling_time_hours, clinical_pregnancy, ultrasound_date,
        gestational_sacs, fetal_heartbeats, pregnancy_type, outcome, outcome_date,
        delivery_date, gestational_age_at_delivery, birth_weight_grams,
        birth_complications, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
      RETURNING *`,
      [
        cycleId, firstBetaDate, firstBetaValue, secondBetaDate, secondBetaValue,
        betaDoublingTime, clinicalPregnancy, ultrasoundDate,
        gestationalSacs, fetalHeartbeats, pregnancyType, outcome, outcomeDate,
        deliveryDate, gestationalAgeAtDelivery, birthWeightGrams,
        birthComplications, notes
      ]
    );

    // Update cycle outcome
    const cycleOutcome = firstBetaValue > 5 ? 'positive' : 'negative';
    const pregnancyResult = firstBetaValue > 5;

    await client.query(
      `UPDATE ivf_cycles 
       SET current_stage = 'completed',
           cycle_outcome = $1,
           pregnancy_result = $2,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3`,
      [cycleOutcome, pregnancyResult, cycleId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Pregnancy outcome recorded',
      outcome: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Record outcome error:', error);
    res.status(500).json({ error: 'Error recording pregnancy outcome' });
  } finally {
    client.release();
  }
};

module.exports = {
  updateEmbryoDevelopment,
  getEmbryosByCycle,
  updateEmbryoStatus,
  recordEmbryoTransfer,
  freezeEmbryos,
  recordPregnancyOutcome
};
