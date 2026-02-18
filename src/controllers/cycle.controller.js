const db = require('../config/database');

// Start new IVF cycle for a patient
const startCycle = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const {
      patientId,
      cycleType,
      protocol,
      startDate,
      expectedEggRetrieval,
      primaryDoctorId,
      embryologistId,
      notes
    } = req.body;

    const clinicId = req.user.clinic_id;

    // Validation
    if (!patientId || !cycleType || !startDate) {
      return res.status(400).json({ 
        error: 'Missing required fields: patientId, cycleType, startDate' 
      });
    }

    // Verify patient belongs to this clinic
    const patientCheck = await db.query(
      'SELECT id, full_name, patient_code FROM patients WHERE id = $1 AND clinic_id = $2',
      [patientId, clinicId]
    );

    if (patientCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    const patient = patientCheck.rows[0];

    await client.query('BEGIN');

    // Get cycle number for this patient
    const cycleCountResult = await client.query(
      'SELECT COUNT(*) as count FROM ivf_cycles WHERE patient_id = $1',
      [patientId]
    );
    const cycleNumber = parseInt(cycleCountResult.rows[0].count) + 1;

    // Generate cycle code
    const cycleCode = `${patient.patient_code}-C${String(cycleNumber).padStart(2, '0')}`;

    // Insert cycle
    const cycleResult = await client.query(
      `INSERT INTO ivf_cycles (
        clinic_id, patient_id, cycle_number, cycle_code, cycle_type, protocol,
        start_date, expected_egg_retrieval, current_stage,
        primary_doctor_id, embryologist_id, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *`,
      [
        clinicId, patientId, cycleNumber, cycleCode, cycleType, protocol,
        startDate, expectedEggRetrieval, 'consultation',
        primaryDoctorId, embryologistId, notes
      ]
    );

    const cycle = cycleResult.rows[0];

    // Log audit
    await client.query(
      `INSERT INTO audit_logs (clinic_id, user_id, user_type, action, table_name, record_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [clinicId, req.user.id, 'clinic_staff', 'CYCLE_STARTED', 'ivf_cycles', cycle.id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'IVF cycle started successfully',
      cycle: {
        id: cycle.id,
        cycleCode: cycle.cycle_code,
        cycleNumber: cycle.cycle_number,
        cycleType: cycle.cycle_type,
        currentStage: cycle.current_stage,
        startDate: cycle.start_date,
        patient: {
          id: patient.id,
          name: patient.full_name,
          code: patient.patient_code
        }
      }
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Start cycle error:', error);
    res.status(500).json({ error: 'Error starting IVF cycle' });
  } finally {
    client.release();
  }
};

// Get all cycles (with filters)
const getCycles = async (req, res) => {
  try {
    const clinicId = req.user.clinic_id;
    const { 
      page = 1, 
      limit = 20, 
      status = '', 
      patientId = '',
      stage = ''
    } = req.query;
    
    const offset = (page - 1) * limit;

    let whereConditions = ['c.clinic_id = $1'];
    const params = [clinicId];

    if (patientId) {
     whereConditions.push(`c.patient_id = $${params.length + 1}`);
      params.push(patientId);
    }

    if (stage) {
     whereConditions.push(`c.current_stage = $${params.length + 1}`);
      params.push(stage);
    }

    if (status === 'active') {
      whereConditions.push('c.is_active = true AND c.cycle_outcome IS NULL');
    } else if (status === 'completed') {
      whereConditions.push('c.cycle_outcome IS NOT NULL');
    }

    const whereClause = whereConditions.join(' AND ');

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as count
      FROM ivf_cycles c
      WHERE ${whereClause}
    `;
    const countResult = await db.query(countQuery, params);
    const totalCycles = parseInt(countResult.rows[0].count);

    // Get cycles
    const dataQuery = `
      SELECT c.*, p.full_name as patient_name, p.patient_code,
             u1.full_name as doctor_name, u2.full_name as embryologist_name
      FROM ivf_cycles c
      JOIN patients p ON c.patient_id = p.id
      LEFT JOIN users u1 ON c.primary_doctor_id = u1.id
      LEFT JOIN users u2 ON c.embryologist_id = u2.id
      WHERE ${whereClause}
      ORDER BY c.start_date DESC 
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    
    const dataParams = [...params, limit, offset];
    const result = await db.query(dataQuery, dataParams);

    res.json({
      cycles: result.rows,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCycles / limit),
        totalCycles,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    console.error('Get cycles error:', error);
    res.status(500).json({ error: 'Error fetching cycles' });
  }
};

// Get single cycle details
const getCycleById = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const clinicId = req.user.clinic_id;

    const result = await db.query(
      `SELECT c.*, 
              p.full_name as patient_name, p.patient_code, p.age, p.phone,
              u1.full_name as doctor_name, u2.full_name as embryologist_name
       FROM ivf_cycles c
       JOIN patients p ON c.patient_id = p.id
       LEFT JOIN users u1 ON c.primary_doctor_id = u1.id
       LEFT JOIN users u2 ON c.embryologist_id = u2.id
       WHERE c.id = $1 AND c.clinic_id = $2`,
      [cycleId, clinicId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cycle not found' });
    }

    const cycle = result.rows[0];

    // Get related data
    const [monitoring, eggRetrieval, embryos, transfer, outcome] = await Promise.all([
      db.query('SELECT * FROM stimulation_monitoring WHERE cycle_id = $1 ORDER BY monitoring_date', [cycleId]),
      db.query('SELECT * FROM egg_retrievals WHERE cycle_id = $1', [cycleId]),
      db.query('SELECT * FROM embryos WHERE cycle_id = $1 ORDER BY embryo_number', [cycleId]),
      db.query('SELECT * FROM embryo_transfers WHERE cycle_id = $1', [cycleId]),
      db.query('SELECT * FROM pregnancy_outcomes WHERE cycle_id = $1', [cycleId])
    ]);

    res.json({
      cycle,
      monitoring: monitoring.rows,
      eggRetrieval: eggRetrieval.rows[0] || null,
      embryos: embryos.rows,
      transfer: transfer.rows[0] || null,
      outcome: outcome.rows[0] || null
    });

  } catch (error) {
    console.error('Get cycle error:', error);
    res.status(500).json({ error: 'Error fetching cycle details' });
  }
};

// Update cycle stage
const updateCycleStage = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const { stage, notes } = req.body;
    const clinicId = req.user.clinic_id;

    const validStages = [
      'consultation', 'stimulation', 'monitoring', 'egg_retrieval',
      'fertilization', 'embryo_culture', 'embryo_transfer', 'waiting',
      'completed', 'cancelled'
    ];

    if (!validStages.includes(stage)) {
      return res.status(400).json({ error: 'Invalid stage' });
    }

    const result = await db.query(
      `UPDATE ivf_cycles 
       SET current_stage = $1, 
           notes = COALESCE($2, notes),
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $3 AND clinic_id = $4
       RETURNING *`,
      [stage, notes, cycleId, clinicId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cycle not found' });
    }

    // Log audit
    await db.query(
      `INSERT INTO audit_logs (clinic_id, user_id, user_type, action, table_name, record_id, changes)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [clinicId, req.user.id, 'clinic_staff', 'CYCLE_STAGE_UPDATED', 'ivf_cycles', cycleId, 
       JSON.stringify({ newStage: stage })]
    );

    res.json({
      message: 'Cycle stage updated',
      cycle: result.rows[0]
    });

  } catch (error) {
    console.error('Update cycle stage error:', error);
    res.status(500).json({ error: 'Error updating cycle stage' });
  }
};

// Record stimulation monitoring
const addStimulationMonitoring = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const {
      monitoringDate,
      dayOfStimulation,
      estradiolPgMl,
      lhMiuMl,
      progesteroneNgMl,
      fshMiuMl,
      endometrialThicknessMm,
      rightOvaryFollicles,
      leftOvaryFollicles,
      medications,
      nextVisitDate,
      notes
    } = req.body;

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
      `INSERT INTO stimulation_monitoring (
        cycle_id, monitoring_date, day_of_stimulation, estradiol_pg_ml, lh_miu_ml,
        progesterone_ng_ml, fsh_miu_ml, endometrial_thickness_mm,
        right_ovary_follicles, left_ovary_follicles, medications,
        next_visit_date, notes, recorded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        cycleId, monitoringDate, dayOfStimulation, estradiolPgMl, lhMiuMl,
        progesteroneNgMl, fshMiuMl, endometrialThicknessMm,
        JSON.stringify(rightOvaryFollicles), JSON.stringify(leftOvaryFollicles),
        JSON.stringify(medications), nextVisitDate, notes, req.user.id
      ]
    );

    // Update cycle stage to monitoring if not already
    await db.query(
      `UPDATE ivf_cycles SET current_stage = 'monitoring' 
       WHERE id = $1 AND current_stage = 'stimulation'`,
      [cycleId]
    );

    res.status(201).json({
      message: 'Monitoring data recorded',
      monitoring: result.rows[0]
    });

  } catch (error) {
    console.error('Add monitoring error:', error);
    res.status(500).json({ error: 'Error recording monitoring data' });
  }
};

// Record egg retrieval
const recordEggRetrieval = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { cycleId } = req.params;
    const {
      retrievalDate,
      performedBy,
      anesthesiologist,
      procedureDurationMinutes,
      rightOvaryEggs,
      leftOvaryEggs,
      matureEggsMII,
      immatureEggsMI,
      immatureEggsGV,
      eggQualityGrade,
      complications,
      bloodInFollicularFluid,
      notes
    } = req.body;

    const clinicId = req.user.clinic_id;

    await client.query('BEGIN');

    const totalEggs = (rightOvaryEggs || 0) + (leftOvaryEggs || 0);

    const result = await client.query(
      `INSERT INTO egg_retrievals (
        cycle_id, retrieval_date, performed_by, anesthesiologist,
        procedure_duration_minutes, right_ovary_eggs, left_ovary_eggs,
        total_eggs_retrieved, mature_eggs_mii, immature_eggs_mi, immature_eggs_gv,
        egg_quality_grade, complications, blood_in_follicular_fluid, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *`,
      [
        cycleId, retrievalDate, performedBy, anesthesiologist,
        procedureDurationMinutes, rightOvaryEggs, leftOvaryEggs, totalEggs,
        matureEggsMII, immatureEggsMI, immatureEggsGV, eggQualityGrade,
        complications, bloodInFollicularFluid, notes
      ]
    );

    // Update cycle
    await client.query(
      `UPDATE ivf_cycles 
       SET current_stage = 'fertilization',
           actual_egg_retrieval = $1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2`,
      [retrievalDate, cycleId]
    );

    // Log audit
    await client.query(
      `INSERT INTO audit_logs (clinic_id, user_id, user_type, action, table_name, record_id)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [clinicId, req.user.id, 'clinic_staff', 'EGG_RETRIEVAL_RECORDED', 'egg_retrievals', result.rows[0].id]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Egg retrieval recorded successfully',
      eggRetrieval: result.rows[0]
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Record egg retrieval error:', error);
    res.status(500).json({ error: 'Error recording egg retrieval' });
  } finally {
    client.release();
  }
};

// Record sperm sample
const recordSpermSample = async (req, res) => {
  try {
    const { cycleId } = req.params;
    const {
      collectionDate,
      sourceType,
      partnerName,
      volumeMl,
      concentrationMillionMl,
      totalCountMillion,
      motilityPercent,
      progressiveMotilityPercent,
      morphologyPercent,
      postPrepConcentration,
      postPrepMotility,
      postPrepVolume,
      qualityGrade,
      notes
    } = req.body;

    const clinicId = req.user.clinic_id;

    const result = await db.query(
      `INSERT INTO sperm_samples (
        cycle_id, collection_date, source_type, partner_name,
        volume_ml, concentration_million_ml, total_count_million,
        motility_percent, progressive_motility_percent, morphology_percent,
        post_prep_concentration, post_prep_motility, post_prep_volume,
        quality_grade, processed_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        cycleId, collectionDate, sourceType, partnerName,
        volumeMl, concentrationMillionMl, totalCountMillion,
        motilityPercent, progressiveMotilityPercent, morphologyPercent,
        postPrepConcentration, postPrepMotility, postPrepVolume,
        qualityGrade, req.user.id, notes
      ]
    );

    res.status(201).json({
      message: 'Sperm sample recorded',
      spermSample: result.rows[0]
    });

  } catch (error) {
    console.error('Record sperm sample error:', error);
    res.status(500).json({ error: 'Error recording sperm sample' });
  }
};

// Record fertilization
const recordFertilization = async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    const { cycleId } = req.params;
    const {
      eggRetrievalId,
      spermSampleId,
      fertilizationDate,
      fertilizationMethod,
      eggsInseminated,
      icsiEggs,
      conventionalIvfEggs,
      checkTime,
      twoPnNormal,
      onePn,
      threePn,
      unfertilized,
      notes
    } = req.body;

    const clinicId = req.user.clinic_id;

    await client.query('BEGIN');

    const fertilizationRate = eggsInseminated > 0 
      ? ((twoPnNormal / eggsInseminated) * 100).toFixed(2)
      : 0;

    const result = await client.query(
      `INSERT INTO fertilizations (
        cycle_id, egg_retrieval_id, sperm_sample_id, fertilization_date,
        fertilization_method, eggs_inseminated, icsi_eggs, conventional_ivf_eggs,
        check_time, two_pn_normal, one_pn, three_pn, unfertilized,
        fertilization_rate, performed_by, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
      RETURNING *`,
      [
        cycleId, eggRetrievalId, spermSampleId, fertilizationDate,
        fertilizationMethod, eggsInseminated, icsiEggs, conventionalIvfEggs,
        checkTime, twoPnNormal, onePn, threePn, unfertilized,
        fertilizationRate, req.user.id, notes
      ]
    );

    const fertilizationId = result.rows[0].id;

    // Create embryo records for normally fertilized eggs
    for (let i = 1; i <= twoPnNormal; i++) {
      await client.query(
        `INSERT INTO embryos (cycle_id, fertilization_id, embryo_number, status)
         VALUES ($1, $2, $3, $4)`,
        [cycleId, fertilizationId, i, 'developing']
      );
    }

    // Update cycle stage
    await client.query(
      `UPDATE ivf_cycles SET current_stage = 'embryo_culture' WHERE id = $1`,
      [cycleId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Fertilization recorded successfully',
      fertilization: result.rows[0],
      embryosCreated: twoPnNormal
    });

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Record fertilization error:', error);
    res.status(500).json({ error: 'Error recording fertilization' });
  } finally {
    client.release();
  }
};

module.exports = {
  startCycle,
  getCycles,
  getCycleById,
  updateCycleStage,
  addStimulationMonitoring,
  recordEggRetrieval,
  recordSpermSample,
  recordFertilization
};
