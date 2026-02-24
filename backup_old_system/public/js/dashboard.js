document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!requireAuth()) return;
    
    // Load user info
    loadUserInfo();
    
    // Load dashboard data
    loadDashboardStats();
    loadRecentPatients();
});

async function loadDashboardStats() {
    try {
        // Get total patients
        const patientsData = await apiCall('/patients?limit=1');
        if (patientsData) {
            document.getElementById('totalPatients').textContent = 
                patientsData.pagination.totalPatients;
        }
        
        // For now, set other stats to 0 (we'll add these features later)
        document.getElementById('activeCycles').textContent = '0';
        document.getElementById('pendingLab').textContent = '0';
        document.getElementById('completedCycles').textContent = '0';
        
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

async function loadRecentPatients() {
    try {
        const data = await apiCall('/patients?limit=5');
        
        const tableBody = document.getElementById('recentPatientsTable');
        
        if (data && data.patients.length > 0) {
            tableBody.innerHTML = data.patients.map(patient => `
                <tr>
                    <td>${patient.patient_code}</td>
                    <td>${patient.full_name}</td>
                    <td>${patient.age}</td>
                    <td>${patient.phone}</td>
                    <td>${formatDate(patient.created_at)}</td>
                    <td>
                        <button class="btn btn-sm btn-secondary" 
                                onclick="viewPatient('${patient.id}')">
                            View
                        </button>
                    </td>
                </tr>
            `).join('');
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center">No patients registered yet</td>
                </tr>
            `;
        }
    } catch (error) {
        console.error('Error loading patients:', error);
        document.getElementById('recentPatientsTable').innerHTML = `
            <tr>
                <td colspan="6" class="text-center">Error loading patients</td>
            </tr>
        `;
    }
}

function viewPatient(patientId) {
    window.location.href = `patient-details.html?id=${patientId}`;
}
