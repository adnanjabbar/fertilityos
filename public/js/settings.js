document.addEventListener('DOMContentLoaded', function() {
    if (!requireAuth()) return;
    loadUserInfo();
    loadProfileData();
    checkAdminAccess();
    setupForms();
});

function checkAdminAccess() {
    const user = getUserData();
    console.log('Current user:', user);
    console.log('User role:', user.role);
    
    // Hide admin-only tabs for non-admins
    if (user.role !== 'admin' && user.role !== 'lab_director') {
        console.log('Not admin - hiding tabs');
        document.getElementById('usersTabBtn').style.display = 'none';
        document.getElementById('clinicTabBtn').style.display = 'none';
    } else {
        console.log('Is admin - loading data');
        loadUsers();
        loadClinicSettings();
    }
}

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.settings-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.settings-tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    event.target.classList.add('active');
}

async function loadProfileData() {
    try {
        const data = await apiCall('/auth/profile');
        
        if (data && data.user) {
            document.getElementById('profileFullName').value = data.user.full_name;
            document.getElementById('profileEmail').value = data.user.email;
            document.getElementById('profilePhone').value = data.user.phone || '';
            document.getElementById('profileRole').value = formatRole(data.user.role);
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

async function loadUsers() {
    try {
        const data = await apiCall('/users');
        const tableBody = document.getElementById('usersTable');
        
        if (data && data.users.length > 0) {
            tableBody.innerHTML = data.users.map(user => {
                const statusBadge = user.is_active 
                    ? '<span class="badge badge-success">Active</span>'
                    : '<span class="badge badge-danger">Inactive</span>';
                
                const currentUser = getUserData();
                const canEdit = currentUser.id !== user.id; // Can't edit yourself
                
                return `
                    <tr>
                        <td><strong>${user.full_name}</strong></td>
                        <td>${user.email}</td>
                        <td>${formatRole(user.role)}</td>
                        <td>${user.phone || 'N/A'}</td>
                        <td>${statusBadge}</td>
                        <td>${user.last_login ? formatDate(user.last_login) : 'Never'}</td>
                        <td>
                            ${canEdit ? `
                                <button class="btn btn-sm btn-secondary" onclick="editUser('${user.id}')">
                                    Edit
                                </button>
                                ${user.is_active ? `
                                    <button class="btn btn-sm btn-danger" onclick="deactivateUser('${user.id}', '${user.full_name}')">
                                        Deactivate
                                    </button>
                                ` : ''}
                            ` : '<span class="text-muted">You</span>'}
                        </td>
                    </tr>
                `;
            }).join('');
        } else {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

async function loadClinicSettings() {
    try {
        const data = await apiCall('/users/clinic/settings');
        
        if (data && data.clinic) {
            document.getElementById('clinicNameInput').value = data.clinic.clinic_name;
            document.getElementById('clinicSubdomain').value = data.clinic.subdomain;
            document.getElementById('clinicEmail').value = data.clinic.email;
            document.getElementById('clinicPhone').value = data.clinic.phone || '';
            document.getElementById('clinicAddress').value = data.clinic.address || '';
            document.getElementById('clinicCity').value = data.clinic.city || '';
            document.getElementById('clinicLicense').value = data.clinic.license_number || '';
            document.getElementById('clinicPHC').value = data.clinic.regulatory_body_name || data.clinic.phc_registration || '';
        }
    } catch (error) {
        console.error('Error loading clinic settings:', error);
    }
}

function setupForms() {
    // Profile form
    document.getElementById('profileForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        hideError('profileError');
        hideError('profileSuccess');
        
        const formData = {
            fullName: document.getElementById('profileFullName').value,
            phone: document.getElementById('profilePhone').value,
            currentPassword: document.getElementById('currentPassword').value || undefined,
            newPassword: document.getElementById('newPassword').value || undefined
        };
        
        // Validate password change
        if (formData.newPassword && !formData.currentPassword) {
            showError('profileError', 'Current password required to change password');
            return;
        }
        
        try {
            const data = await apiCall('/users/profile/me', {
                method: 'PUT',
                body: JSON.stringify(formData)
            });
            
            if (data) {
                // Update stored user data
                const userData = getUserData();
                userData.name = data.user.full_name;
                saveAuthData(getAuthToken(), userData);
                
                // Show success
                document.getElementById('profileSuccess').textContent = 'Profile updated successfully!';
                document.getElementById('profileSuccess').style.display = 'block';
                
                // Clear password fields
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                
                // Reload user info in sidebar
                loadUserInfo();
            }
        } catch (error) {
            showError('profileError', error.message);
        }
    });
    
    // Clinic form
    const clinicForm = document.getElementById('clinicForm');
    if (clinicForm) {
        clinicForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            hideError('clinicError');
            hideError('clinicSuccess');
            
            const formData = {
                clinicName: document.getElementById('clinicNameInput').value,
                email: document.getElementById('clinicEmail').value,
                phone: document.getElementById('clinicPhone').value,
                address: document.getElementById('clinicAddress').value,
                city: document.getElementById('clinicCity').value,
                licenseNumber: document.getElementById('clinicLicense').value,
                regulatoryBodyName: document.getElementById('clinicPHC').value
            };
            
            try {
                const data = await apiCall('/users/clinic/settings', {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
                
                if (data) {
                    document.getElementById('clinicSuccess').textContent = 'Clinic settings updated successfully!';
                    document.getElementById('clinicSuccess').style.display = 'block';
                    
                    // Update clinic name in sidebar
                    document.getElementById('clinicName').textContent = data.clinic.clinic_name;
                }
            } catch (error) {
                showError('clinicError', error.message);
            }
        });
    }
}

function showAddUserModal() {
    document.getElementById('addUserModal').style.display = 'block';
}

function closeAddUserModal() {
    document.getElementById('addUserModal').style.display = 'none';
    document.getElementById('addUserForm').reset();
    hideError('addUserError');
}

// Setup add user form
document.getElementById('addUserForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    hideError('addUserError');
    
    const formData = {
        fullName: document.getElementById('userFullName').value,
        email: document.getElementById('userEmail').value,
        password: document.getElementById('userPassword').value,
        phone: document.getElementById('userPhone').value || undefined,
        role: document.getElementById('userRole').value
    };
    
    const submitButton = this.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = 'Adding...';
    
    try {
        const data = await apiCall('/users', {
            method: 'POST',
            body: JSON.stringify(formData)
        });
        
        if (data) {
            closeAddUserModal();
            loadUsers();
            alert('User added successfully!');
        }
    } catch (error) {
        showError('addUserError', error.message);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Add User';
    }
});

function editUser(userId) {
    alert('Edit user functionality coming soon! User ID: ' + userId);
    // TODO: Implement edit user modal
}

async function deactivateUser(userId, userName) {
    if (!confirm(`Are you sure you want to deactivate ${userName}?`)) {
        return;
    }
    
    try {
        await apiCall(`/users/${userId}`, {
            method: 'DELETE'
        });
        
        loadUsers();
        alert('User deactivated successfully');
    } catch (error) {
        alert('Error deactivating user: ' + error.message);
    }
}

function formatRole(role) {
    const roleNames = {
        'admin': 'Administrator',
        'doctor': 'Doctor',
        'embryologist': 'Embryologist',
        'ivf_consultant': 'IVF Consultant',
        'lab_director': 'Lab Director',
        'lab_tech': 'Lab Technician',
        'nurse': 'Nurse',
        'quality_manager': 'Quality Manager',
        'receptionist': 'Receptionist'
    };
    
    return roleNames[role] || role;
}

window.onclick = function(event) {
    const modal = document.getElementById('addUserModal');
    if (event.target === modal) {
        closeAddUserModal();
    }
}
