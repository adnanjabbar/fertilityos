document.addEventListener('DOMContentLoaded', function() {
    if (!requireAuth()) return;
    loadUserInfo();
    loadProfileData();
    checkAdminAccess();
    setupForms();
    loadGeneralSettings();
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

function showTab(tabName, btn) {
    // Hide all tabs
    document.querySelectorAll('.settings-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Remove active class from all buttons
    document.querySelectorAll('.settings-tab-btn').forEach(b => {
        b.classList.remove('active');
    });
    
    // Show selected tab
    document.getElementById(tabName + 'Tab').classList.add('active');
    if (btn) {
        btn.classList.add('active');
    }
}

async function loadProfileData() {
    try {
        const data = await apiCall('/auth/profile');
        
        if (data && data.user) {
            document.getElementById('profileFullName').value = data.user.full_name;
            document.getElementById('profileEmail').value = data.user.email;
            document.getElementById('profilePhone').value = data.user.phone || '';
            document.getElementById('profileRole').value = formatRole(data.user.role);

            // Avatar initials
            const name = data.user.full_name || data.user.email || '?';
            const initials = name.split(' ').filter(w => w.length > 0).map(w => w[0]).slice(0, 2).join('').toUpperCase();
            document.getElementById('profileAvatar').textContent = initials;
            document.getElementById('profileDisplayName').textContent = data.user.full_name || data.user.email;
            document.getElementById('profileDisplayRole').textContent = formatRole(data.user.role);

            // Session info
            const sessionInfo = document.getElementById('currentSessionInfo');
            if (sessionInfo) {
                sessionInfo.textContent = `${navigator.platform || 'This device'} · Logged in`;
            }
        }
    } catch (error) {
        console.error('Error loading profile:', error);
    }
}

// Role badge helper
function getRoleBadgeClass(role) {
    const map = {
        owner: 'badge-role-owner',
        admin: 'badge-role-admin',
        doctor: 'badge-role-doctor',
        nurse: 'badge-role-nurse',
        embryologist: 'badge-role-lab',
        lab_director: 'badge-role-lab',
        lab_tech: 'badge-role-lab',
        ivf_consultant: 'badge-role-admin',
        quality_manager: 'badge-role-default',
        receptionist: 'badge-role-default'
    };
    return map[role] || 'badge-role-default';
}

// All loaded users (for client-side filter)
let allUsers = [];

async function loadUsers() {
    try {
        const data = await apiCall('/users');
        const tableBody = document.getElementById('usersTable');
        
        if (data && data.users) {
            allUsers = data.users;
            renderUsersTable(allUsers);

            // Update count badge
            const badge = document.getElementById('userCountBadge');
            if (badge) badge.textContent = `${allUsers.length} user${allUsers.length !== 1 ? 's' : ''}`;
        } else {
            tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
        }
    } catch (error) {
        console.error('Error loading users:', error);
    }
}

function renderUsersTable(users) {
    const tableBody = document.getElementById('usersTable');
    if (!users || users.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="7" class="text-center">No users found</td></tr>';
        return;
    }

    const currentUser = getUserData();
    tableBody.innerHTML = users.map(user => {
        const statusBadge = user.is_active
            ? '<span class="badge badge-success">Active</span>'
            : '<span class="badge badge-danger">Inactive</span>';

        const roleBadgeClass = getRoleBadgeClass(user.role);
        const roleBadge = `<span class="badge ${roleBadgeClass}">${formatRoleLabel(user.role)}</span>`;

        const canEdit = currentUser.id !== user.id;

        return `
            <tr>
                <td><strong>${user.full_name}</strong></td>
                <td>${user.email}</td>
                <td>${roleBadge}</td>
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
}

function filterUsers() {
    const query = document.getElementById('usersSearch').value.toLowerCase();
    const filtered = allUsers.filter(u =>
        (u.full_name || '').toLowerCase().includes(query) ||
        (u.email || '').toLowerCase().includes(query) ||
        (u.role || '').toLowerCase().includes(query)
    );
    renderUsersTable(filtered);
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
            document.getElementById('clinicCountry').value = data.clinic.country || '';
            document.getElementById('clinicLicense').value = data.clinic.license_number || '';
            document.getElementById('clinicRegBody').value = data.clinic.regulatory_body_name || data.clinic.phc_registration || '';

            if (data.clinic.timezone) {
                document.getElementById('clinicTimezone').value = data.clinic.timezone;
            }
            if (data.clinic.currency) {
                document.getElementById('clinicCurrency').value = data.clinic.currency;
            }

            // Subscription info
            if (data.clinic.subscription_plan) {
                const badge = document.getElementById('subscriptionPlanBadge');
                if (badge) {
                    const planLabel = data.clinic.subscription_plan.charAt(0).toUpperCase() + data.clinic.subscription_plan.slice(1);
                    badge.textContent = `⭐ ${planLabel} Plan`;
                }
            }
            if (data.clinic.subscription_expires_at) {
                const expiry = document.getElementById('subscriptionExpiry');
                if (expiry) expiry.textContent = `Renews: ${formatDate(data.clinic.subscription_expires_at)}`;
            }
        }
    } catch (error) {
        console.error('Error loading clinic settings:', error);
    }
}

function handleLogoUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
        showToast('Logo file must be under 2 MB', 'error');
        return;
    }
    const reader = new FileReader();
    reader.onload = function (e) {
        const preview = document.getElementById('logoPreview');
        preview.innerHTML = `<img src="${e.target.result}" alt="Clinic logo">`;
    };
    reader.readAsDataURL(file);
}

function loadGeneralSettings() {
    const settings = JSON.parse(localStorage.getItem('generalSettings') || '{}');
    if (settings.dateFormat) document.getElementById('dateFormat').value = settings.dateFormat;
    if (settings.defaultCurrency) document.getElementById('defaultCurrency').value = settings.defaultCurrency;
    if (settings.language) document.getElementById('language').value = settings.language;
    if (settings.emailNotifications !== undefined) {
        document.getElementById('emailNotifications').checked = settings.emailNotifications;
    }
}

function setupForms() {
    // Profile form
    document.getElementById('profileForm').addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const formData = {
            fullName: document.getElementById('profileFullName').value,
            phone: document.getElementById('profilePhone').value,
            currentPassword: document.getElementById('currentPassword').value || undefined,
            newPassword: document.getElementById('newPassword').value || undefined
        };
        
        // Validate password change
        if (formData.newPassword && !formData.currentPassword) {
            showToast('Current password is required to set a new password', 'error');
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
                
                // Update avatar
                const name = data.user.full_name || '';
                const initials = name.split(' ').filter(w => w.length > 0).map(w => w[0]).slice(0, 2).join('').toUpperCase();
                document.getElementById('profileAvatar').textContent = initials;
                document.getElementById('profileDisplayName').textContent = data.user.full_name;

                showToast('Profile updated successfully!', 'success');
                
                // Clear password fields
                document.getElementById('currentPassword').value = '';
                document.getElementById('newPassword').value = '';
                
                // Reload user info in sidebar
                loadUserInfo();
            }
        } catch (error) {
            showToast(error.message, 'error');
        }
    });
    
    // Clinic form
    const clinicForm = document.getElementById('clinicForm');
    if (clinicForm) {
        clinicForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const formData = {
                clinicName: document.getElementById('clinicNameInput').value,
                email: document.getElementById('clinicEmail').value,
                phone: document.getElementById('clinicPhone').value,
                address: document.getElementById('clinicAddress').value,
                city: document.getElementById('clinicCity').value,
                country: document.getElementById('clinicCountry').value,
                timezone: document.getElementById('clinicTimezone').value,
                currency: document.getElementById('clinicCurrency').value,
                licenseNumber: document.getElementById('clinicLicense').value,
                regulatoryBodyName: document.getElementById('clinicRegBody').value
            };
            
            try {
                const data = await apiCall('/users/clinic/settings', {
                    method: 'PUT',
                    body: JSON.stringify(formData)
                });
                
                if (data) {
                    showToast('Clinic settings updated successfully!', 'success');
                    // Update clinic name in sidebar
                    document.getElementById('clinicName').textContent = data.clinic.clinic_name;
                }
            } catch (error) {
                showToast(error.message, 'error');
            }
        });
    }

    // General settings form
    const generalForm = document.getElementById('generalForm');
    if (generalForm) {
        generalForm.addEventListener('submit', function(e) {
            e.preventDefault();
            const settings = {
                dateFormat: document.getElementById('dateFormat').value,
                defaultCurrency: document.getElementById('defaultCurrency').value,
                language: document.getElementById('language').value,
                emailNotifications: document.getElementById('emailNotifications').checked
            };
            localStorage.setItem('generalSettings', JSON.stringify(settings));
            showToast('General settings saved!', 'success');
        });
    }
}

function showAddUserModal() {
    document.getElementById('addUserModal').style.display = 'flex';
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
            showToast('User added successfully!', 'success');
        }
    } catch (error) {
        showError('addUserError', error.message);
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = 'Add User';
    }
});

function editUser(userId) {
    showToast('Edit user functionality coming soon!', 'info');
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
        showToast('User deactivated successfully', 'success');
    } catch (error) {
        showToast('Error deactivating user: ' + error.message, 'error');
    }
}

function formatRoleLabel(role) {
    const roleNames = {
        'owner': 'Owner',
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

// Keep backward-compatible formatRole (used by auth.js loadUserInfo)
function formatRole(role) {
    return formatRoleLabel(role) || (role ? role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ') : 'User');
}

window.onclick = function(event) {
    const modal = document.getElementById('addUserModal');
    if (event.target === modal) {
        closeAddUserModal();
    }
}
