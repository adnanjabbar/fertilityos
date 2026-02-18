// ============================================
// IVF Platform - Auth & Utilities
// ============================================

// API Base URL - Use relative path for flexibility
const API_URL = '/api';

// Get auth token from localStorage
function getAuthToken() {
    return localStorage.getItem('authToken');
}

// Get user data from localStorage
function getUserData() {
    const userData = localStorage.getItem('userData');
    return userData ? JSON.parse(userData) : null;
}

// Save auth data
function saveAuthData(token, user) {
    localStorage.setItem('authToken', token);
    localStorage.setItem('userData', JSON.stringify(user));
}

// Clear auth data
function clearAuthData() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
}

// Check if user is authenticated
function isAuthenticated() {
    return !!getAuthToken();
}

// Redirect to login if not authenticated
function requireAuth() {
    if (!isAuthenticated()) {
        window.location.href = '/login.html';
        return false;
    }
    return true;
}

// Logout function
function logout() {
    clearAuthData();
    window.location.href = '/login.html';
}

// API call helper with auth
async function apiCall(endpoint, options = {}) {
    const token = getAuthToken();
    
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers
    };
    
    if (token) {
        headers['Authorization'] = 'Bearer ' + token;
    }
    
    try {
        const response = await fetch(API_URL + endpoint, {
            ...options,
            headers
        });
        
        // Handle non-JSON responses
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = { message: await response.text() };
        }
        
        if (response.status === 401) {
            logout();
            return null;
        }
        
        if (!response.ok) {
            console.error('API Error:', data);
            throw new Error(data.error || data.message || 'Request failed');
        }
        
        return data;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

// Load user info into sidebar
function loadUserInfo() {
    const user = getUserData();
    if (user) {
        const userNameEl = document.getElementById('userName');
        const userRoleEl = document.getElementById('userRole');
        const clinicNameEl = document.getElementById('clinicName');
        
        if (userNameEl) userNameEl.textContent = user.name || user.full_name || 'User';
        if (userRoleEl) userRoleEl.textContent = formatRole(user.role);
        if (clinicNameEl) clinicNameEl.textContent = user.clinic?.name || 'IVF Clinic';
    }
}

// Format role for display
function formatRole(role) {
    if (!role) return 'User';
    return role.charAt(0).toUpperCase() + role.slice(1).replace(/_/g, ' ');
}

// Format date helper
function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
}

// Format datetime helper
function formatDateTime(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '-';
    return date.toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Format currency helper
function formatCurrency(amount, currency = 'PKR') {
    const num = parseFloat(amount) || 0;
    return currency + ' ' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// Calculate age from date of birth
function calculateAge(dob) {
    if (!dob) return '-';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
}

// Show toast notification
function showToast(message, type = 'info') {
    const existingToast = document.querySelector('.toast-notification');
    if (existingToast) existingToast.remove();
    
    const toast = document.createElement('div');
    toast.className = 'toast-notification toast-' + type;
    toast.innerHTML = '<span class="toast-icon">' + (type === 'success' ? '✓' : type === 'error' ? '✗' : 'ℹ') + '</span><span class="toast-message">' + message + '</span>';
    
    if (!document.getElementById('toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = '.toast-notification{position:fixed;top:20px;right:20px;padding:15px 25px;border-radius:8px;display:flex;align-items:center;gap:10px;z-index:10000;animation:slideIn .3s ease;box-shadow:0 4px 15px rgba(0,0,0,.2);font-weight:500}.toast-success{background:#10b981;color:#fff}.toast-error{background:#ef4444;color:#fff}.toast-info{background:#3b82f6;color:#fff}.toast-warning{background:#f59e0b;color:#fff}@keyframes slideIn{from{transform:translateX(100%);opacity:0}to{transform:translateX(0);opacity:1}}';
        document.head.appendChild(style);
    }
    
    document.body.appendChild(toast);
    setTimeout(() => { toast.style.animation = 'slideIn .3s ease reverse'; setTimeout(() => toast.remove(), 300); }, 3000);
}

// Show/Hide error message
function showError(elementId, message) {
    const el = document.getElementById(elementId);
    if (el) { el.textContent = message; el.style.display = 'block'; }
}

function hideError(elementId) {
    const el = document.getElementById(elementId);
    if (el) { el.style.display = 'none'; }
}

// Modal helpers
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) { modal.style.display = 'block'; document.body.style.overflow = 'hidden'; }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) { modal.style.display = 'none'; document.body.style.overflow = 'auto'; }
}

// Close modal when clicking outside
window.addEventListener('click', function(e) {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
        document.body.style.overflow = 'auto';
    }
});

// Debounce helper
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => { clearTimeout(timeout); func(...args); };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}
