let currentPage = 1;
let searchQuery = '';

document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    if (!requireAuth()) return;
    
    // Load user info
    loadUserInfo();
    
    // Load patients
    loadPatients();
    
    // Setup add patient form
    setupAddPatientForm();
});

async function loadPatients(page = 1, search = '') {
    currentPage = page;
    searchQuery = search;
    
    try {
        const endpoint = `/patients?page=${page}&limit=20${search ? `&search=${encodeURIComponent(search)}` : ''}`;
        const data = await apiCall(endpoint);
        
        const tableBody = document.getElementById('patientsTable');
        
        if (data && data.patients.length > 0) {
            tableBody.innerHTML = data.patients.map(patient => `
                <tr>
                    <td><strong>${patient.patient_code}</strong></td>
                    <td>${patient.full_name}</td>
                    <td>${patient.age || 'N/A'}</td>
                    <td>${patient.gender || 'N/A'}</td>
                    <td>${patient.phone}</td>
                    <td>${patient.city || 'N/A'}</td>
                    <td>${formatDate(patient.created_at)}</td>
                    <td>
                        <button class="btn btn-sm btn-secondary" 
                                onclick="viewPatient('${patient.id}')">
                            View
                        </button>
                    </td>
                </tr>
            `).join('');
            
            // Render pagination
            renderPagination(data.pagination);
        } else {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="text-center">
                        ${search ? 'No patients found matching your search' : 'No patients registered yet'}
                    </td>
                </tr>
            `;
            document.getElementById('pagination').innerHTML = '';
        }
    } catch (error) {
        console.error('Error loading patients:', error);
        document.getElementById('patientsTable').innerHTML = `
            <tr>
                <td colspan="8" class="text-center">Error loading patients</td>
            </tr>
        `;
    }
}

function renderPagination(pagination) {
    const paginationDiv = document.getElementById('pagination');
    
    if (pagination.totalPages <= 1) {
        paginationDiv.innerHTML = '';
        return;
    }
    
    let html = '';
    
    // Previous button
    if (pagination.currentPage > 1) {
        html += `<button onclick="loadPatients(${pagination.currentPage - 1}, '${searchQuery}')">Previous</button>`;
    }
    
    // Page numbers
    for (let i = 1; i <= pagination.totalPages; i++) {
        if (i === pagination.currentPage) {
            html += `<button class="active">${i}</button>`;
        } else {
            html += `<button onclick="loadPatients(${i}, '${searchQuery}')">${i}</button>`;
        }
    }
    
    // Next button
    if (pagination.currentPage < pagination.totalPages) {
        html += `<button onclick="loadPatients(${pagination.currentPage + 1}, '${searchQuery}')">Next</button>`;
    }
    
    paginationDiv.innerHTML = html;
}

function searchPatients() {
    const searchInput = document.getElementById('searchInput').value;
    loadPatients(1, searchInput);
}

function showAddPatientModal() {
    document.getElementById('addPatientModal').style.display = 'block';
}

function closeAddPatientModal() {
    document.getElementById('addPatientModal').style.display = 'none';
    document.getElementById('addPatientForm').reset();
    hideError('formError');
}

function setupAddPatientForm() {
    const form = document.getElementById('addPatientForm');
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        hideError('formError');
        
        const formData = {
            fullName: document.getElementById('fullName').value,
            dateOfBirth: document.getElementById('dateOfBirth').value,
            gender: document.getElementById('gender').value,
            phone: document.getElementById('phone').value,
            email: document.getElementById('email').value || undefined,
            cnic: document.getElementById('cnic').value || undefined,
            address: document.getElementById('address').value || undefined,
            city: document.getElementById('city').value || undefined,
            bloodGroup: document.getElementById('bloodGroup').value || undefined,
            heightCm: parseFloat(document.getElementById('heightCm').value) || undefined,
            weightKg: parseFloat(document.getElementById('weightKg').value) || undefined,
            partnerName: document.getElementById('partnerName').value || undefined,
            partnerAge: parseInt(document.getElementById('partnerAge').value) || undefined,
            partnerPhone: document.getElementById('partnerPhone').value || undefined
        };
        
        const submitButton = form.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Adding...';
        
        try {
            const data = await apiCall('/patients', {
                method: 'POST',
                body: JSON.stringify(formData)
            });
            
            if (data) {
                closeAddPatientModal();
                loadPatients(currentPage, searchQuery);
                alert('Patient registered successfully!');
            }
        } catch (error) {
            showError('formError', error.message);
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Add Patient';
        }
    });
}

function viewPatient(patientId) {
    window.location.href = `patient-details.html?id=${patientId}`;
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('addPatientModal');
    if (event.target === modal) {
        closeAddPatientModal();
    }
}
