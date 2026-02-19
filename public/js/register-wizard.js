/**
 * Register Wizard JavaScript
 * Multi-step registration wizard with validation and Stripe integration
 */

// Global state
let currentStep = 1;
const totalSteps = 5;
let formData = {};
let stripe = null;
let cardElement = null;
let subdomainValid = false;
let subdomainTimeout = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Stripe (will check for publishable key)
    initializeStripe();
    
    // Load saved form data
    loadFormData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Initialize first step
    updateProgress();
});

/**
 * Initialize Stripe
 */
async function initializeStripe() {
    try {
        // Get Stripe publishable key from backend or environment
        const stripeKey = 'pk_test_51234567890'; // Replace with actual key or fetch from backend
        
        // For now, we'll skip Stripe initialization if key is not available
        // In production, fetch this from the backend
        console.log('Stripe initialization skipped - configure STRIPE_PUBLISHABLE_KEY');
        
        // Uncomment when Stripe is configured:
        // stripe = Stripe(stripeKey);
        // const elements = stripe.elements();
        // cardElement = elements.create('card', {
        //     style: {
        //         base: {
        //             fontSize: '16px',
        //             color: '#1f2937',
        //             '::placeholder': { color: '#9ca3af' }
        //         }
        //     }
        // });
    } catch (error) {
        console.error('Stripe initialization error:', error);
    }
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Navigation buttons
    document.getElementById('nextBtn').addEventListener('click', nextStep);
    document.getElementById('prevBtn').addEventListener('click', prevStep);
    document.getElementById('submitBtn').addEventListener('click', submitForm);
    
    // Subdomain checking
    document.getElementById('subdomain').addEventListener('input', checkSubdomain);
    
    // Password strength
    document.getElementById('adminPassword').addEventListener('input', checkPasswordStrength);
    document.getElementById('confirmPassword').addEventListener('input', validatePasswordMatch);
    
    // Toggle password visibility
    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', togglePasswordVisibility);
    });
    
    // Billing cycle selection
    document.querySelectorAll('.cycle-btn').forEach(btn => {
        btn.addEventListener('click', selectBillingCycle);
    });
    
    // Plan selection
    document.querySelectorAll('.select-plan-btn').forEach(btn => {
        btn.addEventListener('click', selectPlan);
    });
    
    // Coupon code
    document.querySelector('.apply-coupon-btn')?.addEventListener('click', applyCoupon);
    
    // Resend verification
    document.getElementById('resendVerification')?.addEventListener('click', resendVerification);
    
    // Form field changes - save to localStorage
    document.getElementById('wizardForm').addEventListener('input', saveFormData);
}

/**
 * Update progress bar and step indicators
 */
function updateProgress() {
    const progressFill = document.getElementById('progressFill');
    const progressSteps = document.querySelectorAll('.progress-step');
    
    // Update progress bar
    const progressPercent = ((currentStep - 1) / (totalSteps - 1)) * 100;
    progressFill.style.width = progressPercent + '%';
    
    // Update step indicators
    progressSteps.forEach((step, index) => {
        const stepNum = index + 1;
        step.classList.remove('active', 'completed');
        
        if (stepNum < currentStep) {
            step.classList.add('completed');
        } else if (stepNum === currentStep) {
            step.classList.add('active');
        }
    });
    
    // Show/hide navigation buttons
    updateNavigationButtons();
}

/**
 * Update navigation button visibility
 */
function updateNavigationButtons() {
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    const submitBtn = document.getElementById('submitBtn');
    
    prevBtn.style.display = currentStep > 1 ? 'block' : 'none';
    
    if (currentStep < totalSteps - 1) {
        nextBtn.style.display = 'block';
        submitBtn.style.display = 'none';
    } else if (currentStep === totalSteps - 1) {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'block';
    } else {
        nextBtn.style.display = 'none';
        submitBtn.style.display = 'none';
    }
}

/**
 * Navigate to next step
 */
async function nextStep() {
    // Validate current step before proceeding
    if (!await validateStep(currentStep)) {
        return;
    }
    
    if (currentStep < totalSteps) {
        // Hide current step
        document.querySelector(`.wizard-step[data-step="${currentStep}"]`).classList.remove('active');
        
        // Move to next step
        currentStep++;
        
        // Show next step
        document.querySelector(`.wizard-step[data-step="${currentStep}"]`).classList.add('active');
        
        // Update progress
        updateProgress();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * Navigate to previous step
 */
function prevStep() {
    if (currentStep > 1) {
        // Hide current step
        document.querySelector(`.wizard-step[data-step="${currentStep}"]`).classList.remove('active');
        
        // Move to previous step
        currentStep--;
        
        // Show previous step
        document.querySelector(`.wizard-step[data-step="${currentStep}"]`).classList.add('active');
        
        // Update progress
        updateProgress();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
}

/**
 * Validate current step
 */
async function validateStep(step) {
    let isValid = true;
    
    switch(step) {
        case 1:
            isValid = validateStep1();
            break;
        case 2:
            isValid = validateStep2();
            break;
        case 3:
            isValid = validateStep3();
            break;
        case 4:
            isValid = await validateStep4();
            break;
    }
    
    return isValid;
}

/**
 * Validate Step 1: Clinic Basics
 */
function validateStep1() {
    let isValid = true;
    
    const clinicName = document.getElementById('clinicName').value.trim();
    const subdomain = document.getElementById('subdomain').value.trim();
    const country = document.getElementById('country').value;
    const city = document.getElementById('city').value.trim();
    
    if (!clinicName) {
        showError('clinicNameError', 'Clinic name is required');
        isValid = false;
    }
    
    if (!subdomain) {
        showError('subdomainError', 'Subdomain is required');
        isValid = false;
    } else if (!subdomainValid) {
        showError('subdomainError', 'Please choose a valid, available subdomain');
        isValid = false;
    }
    
    if (!country) {
        alert('Please select a country');
        isValid = false;
    }
    
    if (!city) {
        alert('City is required');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Validate Step 2: Admin Credentials
 */
function validateStep2() {
    let isValid = true;
    
    const adminName = document.getElementById('adminName').value.trim();
    const adminEmail = document.getElementById('adminEmail').value.trim();
    const adminPassword = document.getElementById('adminPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const termsAccepted = document.getElementById('termsAccepted').checked;
    
    if (!adminName) {
        alert('Admin name is required');
        isValid = false;
    }
    
    if (!adminEmail || !isValidEmail(adminEmail)) {
        showError('adminEmailError', 'Valid email is required');
        isValid = false;
    }
    
    if (!adminPassword || !isStrongPassword(adminPassword)) {
        alert('Please create a strong password meeting all requirements');
        isValid = false;
    }
    
    if (adminPassword !== confirmPassword) {
        showError('confirmPasswordError', 'Passwords do not match');
        isValid = false;
    }
    
    if (!termsAccepted) {
        showError('termsError', 'You must accept the terms and conditions');
        isValid = false;
    }
    
    return isValid;
}

/**
 * Validate Step 3: Clinic Details
 */
function validateStep3() {
    // All fields in step 3 are optional
    return true;
}

/**
 * Validate Step 4: Subscription & Payment
 */
async function validateStep4() {
    const selectedPlan = document.getElementById('selectedPlan').value;
    
    if (!selectedPlan) {
        alert('Please select a subscription plan');
        return false;
    }
    
    // For Enterprise plan, skip payment (contact sales)
    if (selectedPlan === 'Enterprise') {
        alert('Thank you for your interest in Enterprise! Our sales team will contact you.');
        return true;
    }
    
    // For Starter and Growth, we would validate Stripe payment here
    // For now, allowing without payment (trial mode)
    
    return true;
}

/**
 * Check subdomain availability
 */
async function checkSubdomain() {
    const input = document.getElementById('subdomain');
    const status = document.getElementById('subdomainStatus');
    const value = input.value.toLowerCase().trim();
    
    subdomainValid = false;
    status.textContent = '';
    status.className = 'subdomain-status';
    clearError('subdomainError');
    
    if (value.length < 3) {
        status.textContent = 'Subdomain must be at least 3 characters';
        status.classList.add('unavailable');
        return;
    }
    
    if (!value.match(/^[a-z0-9-]+$/)) {
        status.textContent = 'Only lowercase letters, numbers, and hyphens allowed';
        status.classList.add('unavailable');
        return;
    }
    
    clearTimeout(subdomainTimeout);
    
    status.textContent = 'Checking availability...';
    status.classList.add('checking');
    
    subdomainTimeout = setTimeout(async () => {
        try {
            const response = await fetch(`/api/auth/check-subdomain/${value}`);
            const data = await response.json();
            
            if (data.available) {
                status.textContent = '✓ Available';
                status.classList.remove('checking');
                status.classList.add('available');
                subdomainValid = true;
            } else {
                status.textContent = '✗ ' + data.message;
                status.classList.remove('checking');
                status.classList.add('unavailable');
            }
        } catch (error) {
            status.textContent = 'Error checking availability';
            status.classList.remove('checking');
            status.classList.add('unavailable');
        }
    }, 400);
}

/**
 * Check password strength
 */
function checkPasswordStrength() {
    const password = document.getElementById('adminPassword').value;
    const strengthFill = document.getElementById('strengthFill');
    const strengthText = document.getElementById('strengthText');
    
    // Check requirements
    const hasLength = password.length >= 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    
    // Update requirement indicators
    document.getElementById('req-length').classList.toggle('valid', hasLength);
    document.getElementById('req-uppercase').classList.toggle('valid', hasUppercase);
    document.getElementById('req-lowercase').classList.toggle('valid', hasLowercase);
    document.getElementById('req-number').classList.toggle('valid', hasNumber);
    
    // Calculate strength
    let strength = 0;
    if (hasLength) strength++;
    if (hasUppercase) strength++;
    if (hasLowercase) strength++;
    if (hasNumber) strength++;
    
    // Update UI
    strengthFill.className = 'strength-fill';
    if (strength <= 2) {
        strengthFill.classList.add('weak');
        strengthText.textContent = 'Weak password';
    } else if (strength === 3) {
        strengthFill.classList.add('medium');
        strengthText.textContent = 'Medium password';
    } else {
        strengthFill.classList.add('strong');
        strengthText.textContent = 'Strong password';
    }
}

/**
 * Validate password match
 */
function validatePasswordMatch() {
    const password = document.getElementById('adminPassword').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    
    if (confirmPassword && password !== confirmPassword) {
        showError('confirmPasswordError', 'Passwords do not match');
    } else {
        clearError('confirmPasswordError');
    }
}

/**
 * Toggle password visibility
 */
function togglePasswordVisibility(e) {
    const targetId = e.currentTarget.dataset.target;
    const input = document.getElementById(targetId);
    
    if (input.type === 'password') {
        input.type = 'text';
        e.currentTarget.querySelector('.eye-icon').textContent = '👁️‍🗨️';
    } else {
        input.type = 'password';
        e.currentTarget.querySelector('.eye-icon').textContent = '👁️';
    }
}

/**
 * Select billing cycle
 */
function selectBillingCycle(e) {
    const cycle = e.currentTarget.dataset.cycle;
    
    // Update button states
    document.querySelectorAll('.cycle-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    e.currentTarget.classList.add('active');
    
    // Update prices
    document.querySelectorAll('.plan-card .amount').forEach(amount => {
        const price = amount.dataset[cycle];
        if (price) {
            amount.textContent = price;
        }
    });
    
    // Update hidden field
    document.getElementById('selectedBillingCycle').value = cycle;
    
    // Update summary if plan is selected
    updatePlanSummary();
}

/**
 * Select plan
 */
function selectPlan(e) {
    const card = e.currentTarget.closest('.plan-card');
    const plan = card.dataset.plan;
    
    // Remove previous selection
    document.querySelectorAll('.plan-card').forEach(c => {
        c.classList.remove('selected');
    });
    
    // Select new plan
    card.classList.add('selected');
    document.getElementById('selectedPlan').value = plan;
    
    // Show plan summary
    updatePlanSummary();
    
    // Show/hide payment form based on plan
    const paymentForm = document.getElementById('paymentForm');
    if (plan === 'Enterprise') {
        paymentForm.style.display = 'none';
    } else {
        // Mount Stripe card element if not already mounted
        if (cardElement && !cardElement._mounted) {
            cardElement.mount('#card-element');
            cardElement._mounted = true;
        }
        paymentForm.style.display = 'block';
    }
}

/**
 * Update plan summary
 */
function updatePlanSummary() {
    const plan = document.getElementById('selectedPlan').value;
    const cycle = document.getElementById('selectedBillingCycle').value;
    
    if (!plan) return;
    
    const summary = document.getElementById('selectedPlanSummary');
    const planCard = document.querySelector(`.plan-card[data-plan="${plan}"]`);
    const amount = planCard?.querySelector('.amount');
    
    document.getElementById('summaryPlan').textContent = plan;
    document.getElementById('summaryBilling').textContent = cycle.charAt(0).toUpperCase() + cycle.slice(1);
    
    if (plan === 'Enterprise') {
        document.getElementById('summaryAmount').textContent = 'Custom pricing';
    } else if (amount) {
        const price = amount.dataset[cycle];
        document.getElementById('summaryAmount').textContent = `$${price}/${cycle === 'yearly' ? 'year' : cycle === 'quarterly' ? 'quarter' : 'month'}`;
    }
    
    summary.style.display = 'block';
}

/**
 * Apply coupon code
 */
async function applyCoupon() {
    const couponCode = document.getElementById('couponCode').value.trim();
    const message = document.getElementById('couponMessage');
    
    if (!couponCode) {
        message.textContent = 'Please enter a coupon code';
        message.className = 'coupon-message error';
        return;
    }
    
    // In a real implementation, validate with backend
    message.textContent = 'Validating coupon...';
    message.className = 'coupon-message';
    
    // Simulate API call
    setTimeout(() => {
        message.textContent = 'Invalid coupon code';
        message.className = 'coupon-message error';
    }, 500);
}

/**
 * Submit form
 */
async function submitForm(e) {
    e.preventDefault();
    
    // Validate step 4
    if (!await validateStep(4)) {
        return;
    }
    
    // Show loading
    showLoading();
    
    try {
        // Collect form data
        const formData = {
            // Step 1
            clinicName: document.getElementById('clinicName').value.trim(),
            subdomain: document.getElementById('subdomain').value.trim(),
            clinicCode: document.getElementById('clinicCode').value.trim() || null,
            country: document.getElementById('country').value,
            city: document.getElementById('city').value.trim(),
            logoUrl: document.getElementById('logoUrl').value.trim() || null,
            
            // Step 2
            adminName: document.getElementById('adminName').value.trim(),
            adminEmail: document.getElementById('adminEmail').value.trim(),
            adminPassword: document.getElementById('adminPassword').value,
            
            // Step 3
            address: document.getElementById('address').value.trim() || null,
            phone: document.getElementById('phone').value.trim() || null,
            email: document.getElementById('email').value.trim() || null,
            licenseNumber: document.getElementById('licenseNumber').value.trim() || null,
            regulatoryAuthority: document.getElementById('regulatoryAuthority').value || null,
            phcRegistration: document.getElementById('phcRegistration').value.trim() || null,
            practiceType: document.getElementById('practiceType').value || null,
            yearsInOperation: document.getElementById('yearsInOperation').value || null,
            
            // Step 4
            planName: document.getElementById('selectedPlan').value,
            billingCycle: document.getElementById('selectedBillingCycle').value
        };
        
        // Register clinic
        const response = await fetch('/api/auth/register-clinic', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        
        const data = await response.json();
        
        if (data.success || response.ok) {
            // Clear saved form data
            localStorage.removeItem('wizardFormData');
            
            // Update confirmation page
            document.getElementById('confirmClinicName').textContent = formData.clinicName;
            document.getElementById('confirmSubdomain').textContent = formData.subdomain + '.fertilityos.com';
            document.getElementById('confirmEmail').textContent = formData.adminEmail;
            document.getElementById('confirmPlan').textContent = formData.planName;
            document.getElementById('confirmBilling').textContent = formData.billingCycle;
            document.getElementById('verificationEmail').textContent = formData.adminEmail;
            
            // Move to confirmation step
            document.querySelector(`.wizard-step[data-step="${currentStep}"]`).classList.remove('active');
            currentStep = 5;
            document.querySelector(`.wizard-step[data-step="${currentStep}"]`).classList.add('active');
            updateProgress();
            
            hideLoading();
        } else {
            hideLoading();
            alert(data.error || 'Registration failed. Please try again.');
        }
        
    } catch (error) {
        hideLoading();
        console.error('Registration error:', error);
        alert('An error occurred during registration. Please try again.');
    }
}

/**
 * Resend verification email
 */
async function resendVerification() {
    const email = document.getElementById('confirmEmail').textContent;
    
    try {
        const response = await fetch('/api/email/send-verification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
        
        const data = await response.json();
        
        if (data.success) {
            alert('Verification email sent! Please check your inbox.');
        } else {
            alert(data.error || 'Failed to send verification email.');
        }
    } catch (error) {
        console.error('Resend verification error:', error);
        alert('Error sending verification email.');
    }
}

/**
 * Save form data to localStorage
 */
function saveFormData() {
    const data = {
        clinicName: document.getElementById('clinicName').value,
        subdomain: document.getElementById('subdomain').value,
        clinicCode: document.getElementById('clinicCode').value,
        country: document.getElementById('country').value,
        city: document.getElementById('city').value,
        logoUrl: document.getElementById('logoUrl').value,
        adminName: document.getElementById('adminName').value,
        adminEmail: document.getElementById('adminEmail').value,
        address: document.getElementById('address').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        licenseNumber: document.getElementById('licenseNumber').value,
        regulatoryAuthority: document.getElementById('regulatoryAuthority').value,
        phcRegistration: document.getElementById('phcRegistration').value,
        practiceType: document.getElementById('practiceType').value,
        yearsInOperation: document.getElementById('yearsInOperation').value
    };
    
    localStorage.setItem('wizardFormData', JSON.stringify(data));
}

/**
 * Load form data from localStorage
 */
function loadFormData() {
    const savedData = localStorage.getItem('wizardFormData');
    
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            
            Object.keys(data).forEach(key => {
                const element = document.getElementById(key);
                if (element && data[key]) {
                    element.value = data[key];
                }
            });
        } catch (error) {
            console.error('Error loading saved form data:', error);
        }
    }
}

/**
 * Utility functions
 */
function showError(elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.add('show');
    }
}

function clearError(elementId) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = '';
        errorElement.classList.remove('show');
    }
}

function showLoading() {
    document.getElementById('loadingOverlay').classList.add('show');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.remove('show');
}

function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isStrongPassword(password) {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /[0-9]/.test(password);
}
