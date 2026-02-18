// IVF Platform - Lab Module JavaScript
// WHO 6th Edition Semen Analysis Criteria

const API_BASE = '/lab';

// WHO 6th Edition Reference Values (2021)
const WHO_CRITERIA = {
    volume: { min: 1.5, unit: 'mL' },
    ph: { min: 7.2, max: 8.0 },
    liquefaction: { max: 60, unit: 'min' },
    concentration: { min: 16, unit: 'M/mL' },
    totalCount: { min: 39, unit: 'M' },
    progressiveMotility: { min: 30, unit: '%' },
    totalMotility: { min: 42, unit: '%' },
    morphology: { min: 4, unit: '%' },
    vitality: { min: 54, unit: '%' },
    roundCells: { max: 5, unit: 'M/mL' },
    wbc: { max: 1, unit: 'M/mL' }
};

document.addEventListener('DOMContentLoaded', function() {
    requireAuth();
    loadUserInfo();
    loadLabDashboard();
    loadMalePatients();
    setupTabNavigation();
    setupSemenAutoCalculations();
    
    document.getElementById('semenCollectionDate').valueAsDate = new Date();
    document.getElementById('retrievalDate').valueAsDate = new Date();
    document.getElementById('freezeDate').valueAsDate = new Date();
});

function setupTabNavigation() {
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            switchTab(this.getAttribute('data-tab'));
        });
    });
}

function switchTab(tabId) {
    document.querySelectorAll('.settings-tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.settings-tab-content').forEach(content => content.classList.remove('active'));
    
    document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
    document.getElementById(`${tabId}Tab`).classList.add('active');
    
    if (tabId === 'semen') loadSemenSamples();
    if (tabId === 'oocytes') loadRetrievals();
    if (tabId === 'embryos') loadEmbryos();
    if (tabId === 'cryo') loadCryoData();
}

// ============================================
// LOAD MALE PATIENTS ONLY (for Semen Analysis)
// ============================================
async function loadMalePatients() {
    try {
        const data = await apiCall('/patients');
        if (data && data.patients) {
            // Filter only male patients
            const malePatients = data.patients.filter(p => 
                p.gender && p.gender.toLowerCase() === 'male'
            );
            
            const options = '<option value="">Select Male Patient</option>' + 
                malePatients.map(p => `<option value="${p.id}">${p.full_name} (${p.mrn || p.patient_code})</option>`).join('');
            
            const semenSelect = document.getElementById('semenPatientId');
            if (semenSelect) semenSelect.innerHTML = options;
        }
    } catch (error) {
        console.error('Error loading male patients:', error);
    }
}

// Load all patients (for other forms)
async function loadAllPatients() {
    try {
        const data = await apiCall('/patients');
        if (data && data.patients) {
            const options = '<option value="">Select Patient</option>' + 
                data.patients.map(p => `<option value="${p.id}">${p.full_name} (${p.mrn || p.patient_code})</option>`).join('');
            
            ['retrievalPatientId', 'freezePatientId'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.innerHTML = options;
            });
        }
    } catch (error) {
        console.error('Error loading patients:', error);
    }
}

// ============================================
// SEMEN ANALYSIS - WHO CRITERIA & AUTO-DIAGNOSIS
// ============================================

function setupSemenAutoCalculations() {
    // Auto-calculate total motility
    const prField = document.getElementById('semenProgressiveMotility');
    const npField = document.getElementById('semenNonProgressiveMotility');
    const imField = document.getElementById('semenImmotile');
    
    [prField, npField].forEach(field => {
        if (field) {
            field.addEventListener('input', () => {
                calculateTotalMotility();
                highlightAbnormalValues();
                suggestDiagnosis();
            });
        }
    });
    
    // Add listeners to all semen fields for highlighting and diagnosis
    const semenFields = [
        'semenVolume', 'semenPH', 'semenLiquefaction', 'semenConcentration',
        'semenTotalCount', 'semenNormalMorphology', 'semenVitality',
        'semenRoundCells', 'semenWBC', 'semenImmotile'
    ];
    
    semenFields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) {
            field.addEventListener('input', () => {
                highlightAbnormalValues();
                suggestDiagnosis();
            });
        }
    });
}

function calculateTotalMotility() {
    const pr = parseFloat(document.getElementById('semenProgressiveMotility')?.value) || 0;
    const np = parseFloat(document.getElementById('semenNonProgressiveMotility')?.value) || 0;
    const total = pr + np;
    
    const totalField = document.getElementById('semenTotalMotility');
    if (totalField) {
        totalField.value = total.toFixed(1);
    }
    
    // Auto-calculate immotile
    const immotileField = document.getElementById('semenImmotile');
    if (immotileField && total > 0) {
        immotileField.value = (100 - total).toFixed(1);
    }
}

function highlightAbnormalValues() {
    const fields = {
        'semenVolume': { min: WHO_CRITERIA.volume.min },
        'semenPH': { min: WHO_CRITERIA.ph.min, max: WHO_CRITERIA.ph.max },
        'semenLiquefaction': { max: WHO_CRITERIA.liquefaction.max },
        'semenConcentration': { min: WHO_CRITERIA.concentration.min },
        'semenTotalCount': { min: WHO_CRITERIA.totalCount.min },
        'semenProgressiveMotility': { min: WHO_CRITERIA.progressiveMotility.min },
        'semenTotalMotility': { min: WHO_CRITERIA.totalMotility.min },
        'semenNormalMorphology': { min: WHO_CRITERIA.morphology.min },
        'semenVitality': { min: WHO_CRITERIA.vitality.min },
        'semenRoundCells': { max: WHO_CRITERIA.roundCells.max },
        'semenWBC': { max: WHO_CRITERIA.wbc.max }
    };
    
    Object.entries(fields).forEach(([fieldId, criteria]) => {
        const field = document.getElementById(fieldId);
        if (!field) return;
        
        const value = parseFloat(field.value);
        if (isNaN(value) || value === '') {
            field.style.backgroundColor = '';
            field.style.color = '';
            return;
        }
        
        let isAbnormal = false;
        if (criteria.min !== undefined && value < criteria.min) isAbnormal = true;
        if (criteria.max !== undefined && value > criteria.max) isAbnormal = true;
        
        if (isAbnormal) {
            field.style.backgroundColor = '#fee2e2';
            field.style.color = '#dc2626';
            field.style.fontWeight = 'bold';
        } else {
            field.style.backgroundColor = '#dcfce7';
            field.style.color = '#16a34a';
            field.style.fontWeight = 'bold';
        }
    });
}

function suggestDiagnosis() {
    const concentration = parseFloat(document.getElementById('semenConcentration')?.value) || null;
    const totalMotility = parseFloat(document.getElementById('semenTotalMotility')?.value) || null;
    const progressiveMotility = parseFloat(document.getElementById('semenProgressiveMotility')?.value) || null;
    const morphology = parseFloat(document.getElementById('semenNormalMorphology')?.value) || null;
    
    const diagnosisSelect = document.getElementById('semenDiagnosis');
    if (!diagnosisSelect) return;
    
    // Check for Azoospermia first
    if (concentration === 0) {
        diagnosisSelect.value = 'azoospermia';
        updateDiagnosisDisplay('Azoospermia', 'No sperm detected in the ejaculate', 'danger');
        return;
    }
    
    // Check for Cryptozoospermia
    if (concentration !== null && concentration > 0 && concentration < 1) {
        diagnosisSelect.value = 'cryptozoospermia';
        updateDiagnosisDisplay('Cryptozoospermia', 'Very few sperm detected (< 1 M/mL)', 'danger');
        return;
    }
    
    // Determine abnormalities
    const isOligo = concentration !== null && concentration < WHO_CRITERIA.concentration.min;
    const isAstheno = (progressiveMotility !== null && progressiveMotility < WHO_CRITERIA.progressiveMotility.min) ||
                      (totalMotility !== null && totalMotility < WHO_CRITERIA.totalMotility.min);
    const isTerato = morphology !== null && morphology < WHO_CRITERIA.morphology.min;
    
    let diagnosis = '';
    let description = '';
    let severity = 'success';
    
    if (isOligo && isAstheno && isTerato) {
        diagnosis = 'oligoasthenoteratozoospermia';
        description = 'OAT Syndrome - Reduced concentration, motility, and morphology';
        severity = 'danger';
    } else if (isOligo && isAstheno) {
        diagnosis = 'oligoasthenozoospermia';
        description = 'Reduced sperm concentration and motility';
        severity = 'danger';
    } else if (isOligo && isTerato) {
        diagnosis = 'oligoteratozoospermia';
        description = 'Reduced sperm concentration and morphology';
        severity = 'warning';
    } else if (isAstheno && isTerato) {
        diagnosis = 'asthenoteratozoospermia';
        description = 'Reduced sperm motility and morphology';
        severity = 'warning';
    } else if (isOligo) {
        diagnosis = 'oligozoospermia';
        description = 'Reduced sperm concentration (< 16 M/mL)';
        severity = 'warning';
    } else if (isAstheno) {
        diagnosis = 'asthenozoospermia';
        description = 'Reduced sperm motility (PR < 30% or Total < 42%)';
        severity = 'warning';
    } else if (isTerato) {
        diagnosis = 'teratozoospermia';
        description = 'Reduced normal morphology (< 4%)';
        severity = 'warning';
    } else if (concentration !== null && progressiveMotility !== null) {
        diagnosis = 'normozoospermia';
        description = 'All parameters within normal WHO reference ranges';
        severity = 'success';
    }
    
    if (diagnosis) {
        diagnosisSelect.value = diagnosis;
        updateDiagnosisDisplay(formatDiagnosis(diagnosis), description, severity);
    }
}

function updateDiagnosisDisplay(title, description, severity) {
    let display = document.getElementById('diagnosisSuggestion');
    if (!display) {
        // Create diagnosis display element
        const diagnosisSection = document.querySelector('#semenDiagnosis')?.closest('.form-row');
        if (diagnosisSection) {
            display = document.createElement('div');
            display.id = 'diagnosisSuggestion';
            display.style.cssText = 'grid-column: 1 / -1; padding: 10px; border-radius: 5px; margin-top: 10px;';
            diagnosisSection.after(display);
        }
    }
    
    if (display) {
        const colors = {
            success: { bg: '#dcfce7', border: '#16a34a', text: '#166534' },
            warning: { bg: '#fef3c7', border: '#f59e0b', text: '#92400e' },
            danger: { bg: '#fee2e2', border: '#dc2626', text: '#991b1b' }
        };
        const color = colors[severity] || colors.warning;
        
        display.style.backgroundColor = color.bg;
        display.style.border = `2px solid ${color.border}`;
        display.style.color = color.text;
        display.innerHTML = `<strong>📋 Suggested Diagnosis: ${title}</strong><br><small>${description}</small>`;
    }
}

function formatDiagnosis(diagnosis) {
    const names = {
        'normozoospermia': 'Normozoospermia',
        'oligozoospermia': 'Oligozoospermia',
        'asthenozoospermia': 'Asthenozoospermia',
        'teratozoospermia': 'Teratozoospermia',
        'oligoasthenozoospermia': 'Oligoasthenozoospermia',
        'oligoasthenoteratozoospermia': 'Oligoasthenoteratozoospermia (OAT)',
        'oligoteratozoospermia': 'Oligoteratozoospermia',
        'asthenoteratozoospermia': 'Asthenoteratozoospermia',
        'azoospermia': 'Azoospermia',
        'cryptozoospermia': 'Cryptozoospermia',
        'necrozoospermia': 'Necrozoospermia'
    };
    return names[diagnosis] || diagnosis;
}

// Load cycles when patient selected

async function saveSemenSample() {
    const patientId = document.getElementById('semenPatientId').value;
    const collectionDate = document.getElementById('semenCollectionDate').value;
    
    if (!patientId || !collectionDate) {
        alert('Please select patient and collection date');
        return;
    }
    
    try {
        const data = await apiCall('/lab/semen-samples', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                patient_id: patientId,
                cycle_id: document.getElementById('semenCycleId')?.value || null,
                collection_date: collectionDate,
                collection_time: document.getElementById('semenCollectionTime')?.value || null,
                abstinence_days: document.getElementById('semenAbstinence')?.value || null,
                collection_method: document.getElementById('semenCollectionMethod')?.value || 'masturbation',
                volume_ml: document.getElementById('semenVolume')?.value || null,
                ph: document.getElementById('semenPH')?.value || null,
                liquefaction_time_min: document.getElementById('semenLiquefaction')?.value || null,
                appearance: document.getElementById('semenAppearance')?.value || 'normal',
                viscosity: document.getElementById('semenViscosity')?.value || 'normal',
                concentration_million_per_ml: document.getElementById('semenConcentration')?.value || null,
                total_sperm_count_million: document.getElementById('semenTotalCount')?.value || null,
                progressive_motility_percent: document.getElementById('semenProgressiveMotility')?.value || null,
                non_progressive_motility_percent: document.getElementById('semenNonProgressiveMotility')?.value || null,
                immotile_percent: document.getElementById('semenImmotile')?.value || null,
                total_motility_percent: document.getElementById('semenTotalMotility')?.value || null,
                normal_morphology_percent: document.getElementById('semenNormalMorphology')?.value || null,
                head_defects_percent: document.getElementById('semenHeadDefects')?.value || null,
                midpiece_defects_percent: document.getElementById('semenMidpieceDefects')?.value || null,
                tail_defects_percent: document.getElementById('semenTailDefects')?.value || null,
                vitality_percent: document.getElementById('semenVitality')?.value || null,
                round_cells_million_per_ml: document.getElementById('semenRoundCells')?.value || null,
                wbc_million_per_ml: document.getElementById('semenWBC')?.value || null,
                processing_method: document.getElementById('semenProcessingMethod')?.value || null,
                post_wash_volume_ml: document.getElementById('semenPostWashVolume')?.value || null,
                post_wash_concentration: document.getElementById('semenPostWashConc')?.value || null,
                post_wash_motility_percent: document.getElementById('semenPostWashMotility')?.value || null,
                sample_quality: document.getElementById('semenQuality')?.value || null,
                diagnosis: document.getElementById('semenDiagnosis')?.value || null,
                used_for: document.getElementById('semenUsedFor')?.value || null,
                notes: document.getElementById('semenNotes')?.value || null
            })
        });
        
        if (data && data.success) {
            alert('✓ Semen analysis saved successfully!');
            closeModal('semenModal');
            loadSemenSamples();
            loadLabDashboard();
        } else {
            alert('Error: ' + (data?.message || 'Failed to save'));
        }
    } catch (error) {
        console.error('Error saving:', error);
        alert('Error saving semen analysis');
    }
}

function openSemenModal() {
    document.getElementById('semenForm').reset();
    document.getElementById('semenCollectionDate').valueAsDate = new Date();
    // Reset highlighting
    document.querySelectorAll('#semenForm input').forEach(input => {
        input.style.backgroundColor = '';
        input.style.color = '';
        input.style.fontWeight = '';
    });
    // Remove diagnosis suggestion
    const suggestion = document.getElementById('diagnosisSuggestion');
    if (suggestion) suggestion.remove();
    
    openModal('semenModal');
}

function viewSample(id) {
    window.open(`semen-report.html?id=${id}`, '_blank');
}

async function loadSemenSamples() {
    try {
        const data = await apiCall('/lab/semen-samples');
        const tbody = document.getElementById('semenSamplesTable');
        if (!data || !data.success || !data.data || !data.data.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No samples found</td></tr>';
            return;
        }
        tbody.innerHTML = data.data.map(s => `
            <tr>
                <td><strong>${s.sample_number}</strong></td>
                <td>${s.patient_name || '-'}</td>
                <td>${formatDate(s.collection_date)}</td>
                <td>${s.volume_ml || '-'} mL</td>
                <td>${s.concentration_million_per_ml || '-'} M/mL</td>
                <td>${s.total_motility_percent || '-'}%</td>
                <td><span class="badge badge-${getDiagnosisBadge(s.diagnosis)}">${formatDiagnosis(s.diagnosis) || 'Pending'}</span></td>
                <td>
                    <button class="btn btn-sm btn-secondary" onclick="viewSample('${s.id}')">👁️ View</button> <button class="btn btn-sm btn-primary" onclick="printSample('${s.id}')">🖨️ Print</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
    }
}

function getDiagnosisBadge(diagnosis) {
    if (!diagnosis) return 'secondary';
    if (diagnosis === 'normozoospermia') return 'success';
    if (diagnosis === 'azoospermia' || diagnosis === 'oligoasthenoteratozoospermia') return 'danger';
    return 'warning';
}

// ============================================
// DASHBOARD
// ============================================

async function loadLabDashboard() {
    try {
        const data = await apiCall('/lab/dashboard');
        if (data && data.success) {
            document.getElementById('retrievalsToday').textContent = data.data.retrievals_today || 0;
            document.getElementById('activeEmbryos').textContent = data.data.active_embryos || 0;
            document.getElementById('pendingChecks').textContent = data.data.pending_fert_checks?.length || 0;
            let frozen = 0;
            (data.data.frozen_specimens || []).forEach(f => frozen += parseInt(f.total) || 0);
            document.getElementById('frozenSpecimens').textContent = frozen;
        }
    } catch (error) {
        console.error('Dashboard error:', error);
    }
}

// ============================================
// RETRIEVALS, EMBRYOS, CRYO (keeping existing functions)
// ============================================

async function loadRetrievals() {
    try {
        const data = await apiCall('/lab/retrievals');
        const tbody = document.getElementById('retrievalsTable');
        if (!data || !data.success || !data.data || !data.data.length) {
            tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No retrievals found</td></tr>';
            return;
        }
        tbody.innerHTML = data.data.map(r => `
            <tr>
                <td><strong>${r.retrieval_number}</strong></td>
                <td>${r.patient_name || '-'}</td>
                <td>${formatDate(r.retrieval_date)}</td>
                <td><strong>${r.total_oocytes_retrieved}</strong></td>
                <td><span class="badge badge-success">${r.mii_count || 0}</span></td>
                <td><span class="badge badge-warning">${r.mi_count || 0}</span></td>
                <td><span class="badge badge-secondary">${r.gv_count || 0}</span></td>
                <td><button class="btn btn-sm btn-secondary" onclick="viewRetrieval('${r.id}')">View</button></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
    }
}

async function loadEmbryos() {
    try {
        const data = await apiCall('/lab/embryos');
        const tbody = document.getElementById('embryosTable');
        if (!data || !data.success || !data.data || !data.data.length) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted">No embryos found</td></tr>';
            return;
        }
        tbody.innerHTML = data.data.map(e => `
            <tr>
                <td><strong>${e.embryo_code}</strong></td>
                <td>${e.patient_name || '-'}</td>
                <td><span class="badge badge-info">Day ${e.current_day}</span></td>
                <td>${e.current_stage || '-'}</td>
                <td><strong>${e.current_grade || '-'}</strong></td>
                <td><span class="badge badge-${e.outcome ? 'secondary' : 'success'}">${e.outcome || 'In Culture'}</span></td>
                <td><button class="btn btn-sm btn-secondary" onclick="viewEmbryo('${e.id}')">View</button></td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error:', error);
    }
}

async function loadCryoData() {
    loadAllPatients(); // Load all patients for freeze form
    try {
        const tanksData = await apiCall('/lab/cryo/tanks');
        if (tanksData && tanksData.success) {
            document.getElementById('cryoTanksCount').textContent = tanksData.data.length;
            const grid = document.getElementById('cryoTanksGrid');
            if (tanksData.data.length === 0) {
                grid.innerHTML = '<p class="text-muted">No tanks configured. Click "+ Add Tank" to create one.</p>';
            } else {
                grid.innerHTML = tanksData.data.map(t => `
                    <div class="stat-card">
                        <div class="stat-icon">🏪</div>
                        <div class="stat-details">
                            <h3>${t.tank_name}</h3>
                            <p>${t.tank_code} | ${t.location || 'No location'}</p>
                        </div>
                    </div>
                `).join('');
            }
            const tankSelect = document.getElementById('freezeTankId');
            if (tankSelect) {
                tankSelect.innerHTML = '<option value="">Select Tank</option>' +
                    tanksData.data.map(t => `<option value="${t.id}">${t.tank_name}</option>`).join('');
            }
        }
        
        const freezeData = await apiCall('/lab/cryo/freeze');
        if (freezeData && freezeData.success) {
            let embryos = 0, oocytes = 0, sperm = 0;
            freezeData.data.forEach(f => {
                if (f.status === 'stored') {
                    if (f.specimen_type === 'embryo') embryos += f.total_specimens || 0;
                    if (f.specimen_type === 'oocyte') oocytes += f.total_specimens || 0;
                    if (f.specimen_type === 'sperm') sperm += f.total_specimens || 0;
                }
            });
            document.getElementById('frozenEmbryos').textContent = embryos;
            document.getElementById('frozenOocytes').textContent = oocytes;
            document.getElementById('frozenSperm').textContent = sperm;
            
            const tbody = document.getElementById('freezeRecordsTable');
            if (freezeData.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" class="text-center text-muted">No freeze records</td></tr>';
            } else {
                tbody.innerHTML = freezeData.data.map(f => `
                    <tr>
                        <td><strong>${f.freeze_code}</strong></td>
                        <td>${f.patient_name || '-'}</td>
                        <td><span class="badge badge-info">${f.specimen_type}</span></td>
                        <td>${f.total_specimens}</td>
                        <td>${formatDate(f.freeze_date)}</td>
                        <td>${f.specific_location || '-'}</td>
                        <td><span class="badge badge-${f.status === 'stored' ? 'success' : 'secondary'}">${f.status}</span></td>
                        <td><button class="btn btn-sm btn-secondary">View</button></td>
                    </tr>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error:', error);
    }
}

async function saveRetrieval() {
    const patientId = document.getElementById('retrievalPatientId').value;
    const cycleId = document.getElementById('retrievalCycleId').value;
    const date = document.getElementById('retrievalDate').value;
    const total = document.getElementById('retrievalTotal').value;
    if (!patientId || !cycleId || !date || !total) {
        alert('Please fill required fields');
        return;
    }
    try {
        const data = await apiCall('/lab/retrievals', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                patient_id: patientId,
                cycle_id: cycleId,
                retrieval_date: date,
                total_oocytes_retrieved: total,
                mii_count: document.getElementById('retrievalMII').value || 0,
                mi_count: document.getElementById('retrievalMI').value || 0,
                gv_count: document.getElementById('retrievalGV').value || 0,
                insemination_method: document.getElementById('retrievalMethod').value || null,
                sperm_source: document.getElementById('retrievalSpermSource').value || 'fresh',
                notes: document.getElementById('retrievalNotes').value || null
            })
        });
        if (data && data.success) {
            alert('Retrieval saved!');
            closeModal('retrievalModal');
            loadRetrievals();
        } else {
            alert(data?.message || 'Error saving');
        }
    } catch (error) {
        alert('Error saving retrieval');
    }
}

async function saveTank() {
    const name = document.getElementById('tankName').value;
    const code = document.getElementById('tankCode').value;
    if (!name || !code) {
        alert('Please fill required fields');
        return;
    }
    try {
        const data = await apiCall('/lab/cryo/tanks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                tank_name: name,
                tank_code: code,
                tank_type: document.getElementById('tankType').value,
                location: document.getElementById('tankLocation').value || null
            })
        });
        if (data && data.success) {
            alert('Tank created!');
            closeModal('tankModal');
            loadCryoData();
        } else {
            alert(data?.message || 'Error');
        }
    } catch (error) {
        alert('Error creating tank');
    }
}

async function saveFreezeRecord() {
    const patientId = document.getElementById('freezePatientId').value;
    const type = document.getElementById('freezeType').value;
    const date = document.getElementById('freezeDate').value;
    const total = document.getElementById('freezeTotal').value;
    const tankId = document.getElementById('freezeTankId').value;
    if (!patientId || !type || !date || !total || !tankId) {
        alert('Please fill required fields');
        return;
    }
    try {
        const data = await apiCall('/lab/cryo/freeze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                patient_id: patientId,
                specimen_type: type,
                freeze_date: date,
                total_specimens: total,
                tank_id: tankId,
                quality_at_freeze: document.getElementById('freezeQuality').value || null
            })
        });
        if (data && data.success) {
            alert('Freeze record saved!');
            closeModal('freezeModal');
            loadCryoData();
        } else {
            alert(data?.message || 'Error');
        }
    } catch (error) {
        alert('Error saving freeze record');
    }
}

// Patient change for retrieval - load cycles
document.getElementById('retrievalPatientId')?.addEventListener('change', async function() {
    const patientId = this.value;
    if (!patientId) return;
    try {
        const data = await apiCall(`/cycles?patient_id=${patientId}`);
        const select = document.getElementById('retrievalCycleId');
        if (data && data.data) {
            select.innerHTML = '<option value="">Select Cycle</option>' +
                data.data.map(c => `<option value="${c.id}">${c.cycle_code} - ${c.cycle_type}</option>`).join('');
        }
    } catch (error) {
        console.error('Error loading cycles:', error);
    }
});

// ============================================
// UTILITY FUNCTIONS
// ============================================

function showQuickActions() { openModal('quickActionsModal'); }
function openRetrievalModal() { 
    document.getElementById('retrievalForm').reset(); 
    document.getElementById('retrievalDate').valueAsDate = new Date(); 
    loadAllPatients();
    openModal('retrievalModal'); 
}
function openTankModal() { document.getElementById('tankForm').reset(); openModal('tankModal'); }
function openFreezeModal() { 
    document.getElementById('freezeForm').reset(); 
    document.getElementById('freezeDate').valueAsDate = new Date(); 
    loadCryoData(); 
    openModal('freezeModal'); 
}

function openModal(id) { document.getElementById(id).style.display = 'block'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

function formatDate(d) { 
    if (!d) return '-'; 
    return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }); 
}

function getQualityBadge(q) { 
    return { excellent: 'success', good: 'info', fair: 'warning', poor: 'danger', very_poor: 'danger' }[q] || 'secondary'; 
}

window.onclick = function(e) { 
    if (e.target.classList.contains('modal')) e.target.style.display = 'none'; 
};

// Print semen sample directly
function printSample(id) {
    const printWindow = window.open(`semen-report.html?id=${id}`, '_blank');
    printWindow.onload = function() {
        setTimeout(() => {
            printWindow.print();
        }, 1000);
    };
}
