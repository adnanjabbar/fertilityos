let currentPage = 1;
let currentFilter = 'all';

document.addEventListener('DOMContentLoaded', function() {
    if (!requireAuth()) return;
    loadUserInfo();
    loadCycles();
    loadPatientsForDropdown();
    setupStartCycleForm();
});

async function loadCycles(page = 1, filter = 'all') {
    currentPage = page;
    currentFilter = filter;
    
    try {
        let endpoint = `/cycles?page=${page}&limit=20`;
        
        if (filter === 'active') {
            endpoint += '&status=active';
        } else if (filter === 'completed') {
            endpoint += '&status=completed';
        }
        
        const data = await apiCall(endpoint);
        const tableBody = document.getElementById('cyclesTable');
        
        if (data && data.cycles.length > 0) {
            tableBody.innerHTML = data.cycles.map(cycle => {
                const stageColor = getStageColor(cycle.current_stage);
                const statusBadge = cycle.cycle_outcome 
                    ? `<span class="badge badge-${cycle.pregnancy_result ? 'success' : 'danger'}">${cycle.cycle_outcome}</span>`
                    : '<span class="badge badge-info">Ongoing</span>';
                
                return `
                    <tr>
                        <td><strong>${cycle.cycle_code}</strong></td>
                        <td>${cycle.patient_name}</td>
                        <td>${cycle.cycle_number}</td>
                        <td>${formatCycleType(cycle.cycle_type)}</td>
                        <td><span class="badge" style="background-color: ${stageColor}">${formatStage(cycle.current_stage)}</span></td>
                        <td>${formatDate(cycle.start_date)}</td>
                        <td>${statusBadge}</td>
                        <td>
                            <button class="btn btn-sm btn-secondary" onclick="viewCycle('${cycle.id}')">
                                View
                            </button>
                        </td>
                    </tr>
                `;
            }).join('');
            
            renderPagination(data.pagination);
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        ${filter !== 'all' ? `No ${filter} cycles found` : 'No cycles started yet'}
                    </td>
                </tr>
            `;
            document.getElementById('pagination').innerHTML = '';
        }
    } catch (error) {
        console.error('Error loading cycles:', error);
        document.getElementById('cyclesTable').innerHTML = `
            <tr><td colspan="8" class="text-center">Error loading cycles</td></tr>
        `;
    }
}

function getStageColor(stage) {
    const colors = {
        'consultation': '#6366f1',
        'stimulation': '#8b5cf6',
        'monitoring': '#a855f7',
        'egg_retrieval': '#ec4899',
        'fertilization': '#f43f5e',
        'embryo_culture': '#fb923c',
        'embryo_transfer': '#10b981',
        'waiting': '#fbbf24',
        'completed': '#22c55e',
        'cancelled': '#ef4444'
    };
    return colors[stage] || '#64748b';
}

function formatStage(stage) {
    return stage.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function formatCycleType(type) {
    return type.split('_').map(word => 
        word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
}

function filterCycles(filter) {
    // Update active tab
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    loadCycles(1, filter);
}

function renderPagination(pagination) {
    const paginationDiv = document.getElementById('pagination');
    
    if (pagination.totalPages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }
    
    let html = '';
    
    if (pagination.currentPage > 1) {
        html += `<button onclick="loadCycles(${pagination.currentPage - 1}, '${currentFilter}')">Previous</button>`;
    }
    
    for (let i = 1; i <= pagination.totalPages; i++) {
        if (i === pagination.currentPage) {
            html += `<button class="active">${i}</button>`;
        } else {
            html += `<button onclick="loadCycles(${i}, '${currentFilter}')">${i}</button>`;
        }
    }
    
    if (pagination.currentPage < pagination.totalPages) {
        html += `<button onclick="loadCycles(${pagination.currentPage + 1}, '${currentFilter}')">Next</button>`;
    }
    
    paginationDiv.innerHTML = html;
}

async function loadPatientsForDropdown() {
    try {
        const data = await apiCall('/patients?limit=1000');
        const select = document.getElementById('patientSelect');
        
        if (data && data.patients.length > 0) {
            select.innerHTML = '<option value="">Select a patient</option>' +
                data.patients.map(patient => 
                    `<option value="${patient.id}">${patient.full_name} (${patient.patient_code})</option>`
                ).join('');
        } else {
            select.innerHTML = '<option value="">No patients found</option>';
        }
    } catch (error) {
        console.error('Error loading patients:', error);
    }
}

function showStartCycleModal() {
    document.getElementById('startCycleModal').style.display = 'block';
    // Set default start date to today
    document.getElementById('startDate').valueAsDate = new Date();
}

function closeStartCycleModal() {
    document.getElementById('startCycleModal').style.display = 'none';
    document.getElementById('startCycleForm').reset();
    hideError('formError');
}

function setupStartCycleForm() {
    const form = document.getElementById('startCycleForm');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        hideError('formError');
        
        const formData = {
            patientId: document.getElementById('patientSelect').value,
            cycleType: document.getElementById('cycleType').value,
            protocol: document.getElementById('protocol').value || undefined,
            startDate: document.getElementById('startDate').value,
            expectedEggRetrieval: document.getElementById('expectedEggRetrieval').value || undefined,
            notes: document.getElementById('notes').value || undefined
        };
        
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Starting...';
        
        try {
            const data = await apiCall('/cycles', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            
            if (data) {
                closeStartCycleModal();
                loadCycles(currentPage, currentFilter);
                alert('IVF cycle started successfully!');
            }
        } catch (error) {
            showError('formError', error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Start Cycle';
        }
    });
}

function viewCycle(cycleId) {
    alert('Cycle details page - Coming in next phase! Cycle ID: ' + cycleId);
    // window.location.href = `cycle-details.html?id=${cycleId}`;
}

window.onclick = function(event) {
    const modal = document.getElementById('startCycleModal');
    if (event.target === modal) {
        closeStartCycleModal();
    }
}
