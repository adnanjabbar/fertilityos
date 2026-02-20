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
const SUBDOMAIN_CHECK_DEBOUNCE_MS = 400;

// Geographic selector state
let selectedCountry = null;
let selectedState = null;
let selectedCity = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Stripe (will check for publishable key)
    initializeStripe();
    
    // Initialize geographic selectors
    initializeGeographicSelectors();
    
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
        // Fetch Stripe publishable key from backend
        const response = await fetch('/api/payments/stripe/status');
        const data = await response.json();
        
        if (data.success && data.data.isConfigured && data.data.publishableKey) {
            stripe = Stripe(data.data.publishableKey);
            const elements = stripe.elements();
            cardElement = elements.create('card', {
                style: {
                    base: {
                        fontSize: '16px',
                        color: '#1f2937',
                        '::placeholder': { color: '#9ca3af' }
                    }
                }
            });
        } else {
            console.log('Stripe not configured - payment features disabled');
        }
    } catch (error) {
        console.error('Stripe initialization error:', error);
    }
}

/**
 * Initialize Geographic Selectors
 */
function initializeGeographicSelectors() {
    // Initialize country selector
    const countryWrapper = document.getElementById('countrySelectWrapper');
    const countryList = document.getElementById('countryList');
    const countrySearch = document.getElementById('countrySearch');
    
    // Populate countries
    populateCountries();
    
    // Country selector events
    countryWrapper.addEventListener('click', function(e) {
        if (!countryWrapper.hasAttribute('disabled')) {
            toggleDropdown('countrySelectWrapper');
        }
    });
    
    countrySearch.addEventListener('input', function(e) {
        e.stopPropagation();
        filterCountries(e.target.value);
    });
    
    countrySearch.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // State selector events
    const stateWrapper = document.getElementById('stateSelectWrapper');
    const stateSearch = document.getElementById('stateSearch');
    
    stateWrapper.addEventListener('click', function(e) {
        if (!stateWrapper.hasAttribute('disabled')) {
            toggleDropdown('stateSelectWrapper');
        }
    });
    
    stateSearch.addEventListener('input', function(e) {
        e.stopPropagation();
        filterStates(e.target.value);
    });
    
    stateSearch.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // City selector events
    const cityWrapper = document.getElementById('citySelectWrapper');
    const citySearch = document.getElementById('citySearch');
    
    cityWrapper.addEventListener('click', function(e) {
        if (!cityWrapper.hasAttribute('disabled')) {
            toggleDropdown('citySelectWrapper');
        }
    });
    
    citySearch.addEventListener('input', function(e) {
        e.stopPropagation();
        filterCities(e.target.value);
    });
    
    citySearch.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.custom-select')) {
            closeAllDropdowns();
        }
    });
}

/**
 * Populate countries list
 */
function populateCountries(searchTerm = '') {
    const countryList = document.getElementById('countryList');
    const countries = searchTerm 
        ? GeoDataHelper.searchCountries(searchTerm)
        : GeoDataHelper.getAllCountries();
    
    if (countries.length === 0) {
        countryList.innerHTML = '<div class="no-results">No countries found</div>';
        return;
    }
    
    countryList.innerHTML = countries.map(country => `
        <div class="option-item" data-code="${country.code}" data-name="${country.name}" data-phone="${country.phoneCode}">
            <span class="flag">${country.flag}</span>
            <div class="option-text">
                <span class="option-name">${country.name}</span>
                <span class="option-code">${country.phoneCode}</span>
            </div>
            ${country.popular ? '<span class="popular-badge">POPULAR</span>' : ''}
        </div>
    `).join('');
    
    // Add click listeners to options
    countryList.querySelectorAll('.option-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            selectCountry(this.dataset.code, this.dataset.name, this.dataset.phone);
        });
    });
}

/**
 * Filter countries by search term
 */
function filterCountries(searchTerm) {
    populateCountries(searchTerm);
}

/**
 * Select a country
 */
function selectCountry(code, name, phoneCode) {
    selectedCountry = { code, name, phoneCode };
    selectedState = null;
    selectedCity = null;
    
    // Update hidden fields
    document.getElementById('country').value = name;
    document.getElementById('countryCode').value = code;
    document.getElementById('phoneCode').value = phoneCode;
    
    // Update display
    const selectedOption = document.getElementById('countrySelected');
    const country = GeoDataHelper.getCountryByCode(code);
    selectedOption.innerHTML = `
        <span class="flag-text">
            <span class="flag">${country.flag}</span>
            <div class="country-info">
                <span class="country-name">${name}</span>
                <span class="phone-code">${phoneCode}</span>
            </div>
        </span>
    `;
    
    // Close dropdown
    closeAllDropdowns();
    
    // Reset and enable state selector
    resetStateSelector();
    populateStates(code);
    document.getElementById('stateSelectWrapper').removeAttribute('disabled');
    
    // Reset and disable city selector
    resetCitySelector();
    document.getElementById('citySelectWrapper').setAttribute('disabled', 'disabled');
    
    // Update summary
    updateGeographicSummary();
}

/**
 * Populate states list
 */
function populateStates(countryCode, searchTerm = '') {
    const stateList = document.getElementById('stateList');
    const states = searchTerm
        ? GeoDataHelper.searchStates(countryCode, searchTerm)
        : GeoDataHelper.getStatesForCountry(countryCode);
    
    if (states.length === 0) {
        stateList.innerHTML = '<div class="no-results">No states/provinces found</div>';
        return;
    }
    
    stateList.innerHTML = states.map(state => `
        <div class="option-item" data-name="${state.name}" data-code="${state.code}">
            <div class="option-text">
                <span class="option-name">${state.name}</span>
                <span class="option-code">${state.code}</span>
            </div>
        </div>
    `).join('');
    
    // Add click listeners
    stateList.querySelectorAll('.option-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            selectState(this.dataset.name);
        });
    });
}

/**
 * Filter states by search term
 */
function filterStates(searchTerm) {
    if (selectedCountry) {
        populateStates(selectedCountry.code, searchTerm);
    }
}

/**
 * Select a state
 */
function selectState(name) {
    selectedState = { name };
    selectedCity = null;
    
    // Update hidden field
    document.getElementById('state').value = name;
    
    // Update display
    const selectedOption = document.getElementById('stateSelected');
    selectedOption.innerHTML = `<span class="flag-text">${name}</span>`;
    
    // Close dropdown
    closeAllDropdowns();
    
    // Reset and enable city selector
    resetCitySelector();
    populateCities(selectedCountry.code, name);
    document.getElementById('citySelectWrapper').removeAttribute('disabled');
    
    // Update summary
    updateGeographicSummary();
}

/**
 * Populate cities list
 */
function populateCities(countryCode, stateName, searchTerm = '') {
    const cityList = document.getElementById('cityList');
    const cities = searchTerm
        ? GeoDataHelper.searchCities(countryCode, stateName, searchTerm)
        : GeoDataHelper.getCitiesForState(countryCode, stateName);
    
    if (cities.length === 0) {
        cityList.innerHTML = '<div class="no-results">No cities found</div>';
        return;
    }
    
    cityList.innerHTML = cities.map(city => `
        <div class="option-item" data-name="${city}">
            <div class="option-text">
                <span class="option-name">${city}</span>
            </div>
        </div>
    `).join('');
    
    // Add click listeners
    cityList.querySelectorAll('.option-item').forEach(item => {
        item.addEventListener('click', function(e) {
            e.stopPropagation();
            selectCity(this.dataset.name);
        });
    });
}

/**
 * Filter cities by search term
 */
function filterCities(searchTerm) {
    if (selectedCountry && selectedState) {
        populateCities(selectedCountry.code, selectedState.name, searchTerm);
    }
}

/**
 * Select a city
 */
function selectCity(name) {
    selectedCity = { name };
    
    // Update hidden field
    document.getElementById('city').value = name;
    
    // Update display
    const selectedOption = document.getElementById('citySelected');
    selectedOption.innerHTML = `<span class="flag-text">${name}</span>`;
    
    // Close dropdown
    closeAllDropdowns();
    
    // Update summary
    updateGeographicSummary();
}

/**
 * Toggle dropdown open/close
 */
function toggleDropdown(wrapperId) {
    const wrapper = document.getElementById(wrapperId);
    const isOpen = wrapper.classList.contains('open');
    
    // Close all dropdowns first
    closeAllDropdowns();
    
    // Toggle this dropdown
    if (!isOpen) {
        wrapper.classList.add('open');
        
        // Show backdrop on mobile
        if (window.innerWidth <= 768) {
            const backdrop = document.getElementById('dropdownBackdrop');
            if (backdrop) {
                backdrop.classList.add('show');
                backdrop.onclick = closeAllDropdowns;
            }
        }
        
        // Focus search input
        const searchInput = wrapper.querySelector('.search-box input');
        setTimeout(() => searchInput.focus(), 100);
    }
}

/**
 * Close all dropdowns
 */
function closeAllDropdowns() {
    document.querySelectorAll('.custom-select').forEach(select => {
        select.classList.remove('open');
    });
    
    // Hide backdrop
    const backdrop = document.getElementById('dropdownBackdrop');
    if (backdrop) {
        backdrop.classList.remove('show');
        backdrop.onclick = null;
    }
    
    // Clear search inputs
    document.querySelectorAll('.search-box input').forEach(input => {
        input.value = '';
    });
}

/**
 * Reset state selector
 */
function resetStateSelector() {
    selectedState = null;
    document.getElementById('state').value = '';
    document.getElementById('stateSelected').innerHTML = '<span class="placeholder">Select State/Province</span>';
    document.getElementById('stateList').innerHTML = '';
    document.getElementById('stateSearch').value = '';
}

/**
 * Reset city selector
 */
function resetCitySelector() {
    selectedCity = null;
    document.getElementById('city').value = '';
    document.getElementById('citySelected').innerHTML = '<span class="placeholder">Select City</span>';
    document.getElementById('cityList').innerHTML = '';
    document.getElementById('citySearch').value = '';
}

/**
 * Update geographic summary
 */
function updateGeographicSummary() {
    const summary = document.getElementById('geographicSummary');
    const summaryText = document.getElementById('geographicSummaryText');
    
    if (selectedCountry) {
        const parts = [];
        if (selectedCity) parts.push(selectedCity.name);
        if (selectedState) parts.push(selectedState.name);
        if (selectedCountry) {
            const country = GeoDataHelper.getCountryByCode(selectedCountry.code);
            parts.push(`${country.flag} ${selectedCountry.name}`);
        }
        
        summaryText.innerHTML = parts.join(' • ');
        summary.style.display = 'block';
    } else {
        summary.style.display = 'none';
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
    
    // Toggle regulatory body name field based on radio selection
    document.querySelectorAll('input[name="hasRegulatoryLicense"]').forEach(radio => {
        radio.addEventListener('change', function() {
            const group = document.getElementById('regulatoryBodyGroup');
            if (group) {
                group.style.display = this.value === 'yes' ? 'block' : 'none';
            }
        });
    });

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
    const state = document.getElementById('state').value;
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
    
    if (!state) {
        alert('Please select a state/province');
        isValid = false;
    }
    
    if (!city) {
        alert('Please select a city');
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
    }, SUBDOMAIN_CHECK_DEBOUNCE_MS);
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
    
    // Clear any previous submission error
    clearSubmitError();
    
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
            countryCode: document.getElementById('countryCode').value,
            phoneCode: document.getElementById('phoneCode').value,
            state: document.getElementById('state').value,
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
            hasRegulatoryLicense: document.querySelector('input[name="hasRegulatoryLicense"]:checked')?.value || 'no',
            regulatoryBodyName: document.getElementById('regulatoryBodyName').value.trim() || null,
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
            
            // Handle specific error codes with user-friendly messages
            if (response.status === 409) {
                const errorMsg = data.error || '';
                if (errorMsg.toLowerCase().includes('subdomain')) {
                    // Subdomain conflict — bring user back to step 1
                    subdomainValid = false;
                    document.querySelector(`.wizard-step[data-step="${currentStep}"]`).classList.remove('active');
                    currentStep = 1;
                    document.querySelector(`.wizard-step[data-step="1"]`).classList.add('active');
                    updateProgress();
                    showError('subdomainError', `The subdomain "${formData.subdomain}" is already taken. Please choose a different one.`);
                    document.getElementById('subdomain').focus();
                } else if (errorMsg.toLowerCase().includes('email')) {
                    // Email conflict — bring user back to step 2
                    document.querySelector(`.wizard-step[data-step="${currentStep}"]`).classList.remove('active');
                    currentStep = 2;
                    document.querySelector(`.wizard-step[data-step="2"]`).classList.add('active');
                    updateProgress();
                    showError('adminEmailError', 'This email address is already registered. Please use a different email or log in.');
                    document.getElementById('adminEmail').focus();
                } else {
                    showSubmitError(errorMsg || 'A conflict occurred. Please review your details and try again.');
                }
            } else {
                showSubmitError(data.error || 'Registration failed. Please try again.');
            }
        }
        
    } catch (error) {
        hideLoading();
        console.error('Registration error:', error);
        showSubmitError('An error occurred during registration. Please try again.');
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
        countryCode: document.getElementById('countryCode').value,
        phoneCode: document.getElementById('phoneCode').value,
        state: document.getElementById('state').value,
        city: document.getElementById('city').value,
        logoUrl: document.getElementById('logoUrl').value,
        adminName: document.getElementById('adminName').value,
        adminEmail: document.getElementById('adminEmail').value,
        address: document.getElementById('address').value,
        phone: document.getElementById('phone').value,
        email: document.getElementById('email').value,
        licenseNumber: document.getElementById('licenseNumber').value,
        hasRegulatoryLicense: document.querySelector('input[name="hasRegulatoryLicense"]:checked')?.value || 'no',
        regulatoryBodyName: document.getElementById('regulatoryBodyName').value,
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
            
            // Restore geographic selections if saved
            if (data.countryCode && data.country && data.phoneCode) {
                selectCountry(data.countryCode, data.country, data.phoneCode);
                
                if (data.state) {
                    // Use requestAnimationFrame to ensure DOM updates are complete
                    requestAnimationFrame(() => {
                        selectState(data.state);
                        
                        if (data.city) {
                            requestAnimationFrame(() => {
                                selectCity(data.city);
                            });
                        }
                    });
                }
            }
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

function showSubmitError(message) {
    const el = document.getElementById('submitError');
    if (el) {
        el.textContent = message;
        el.classList.add('show');
        el.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    }
}

function clearSubmitError() {
    const el = document.getElementById('submitError');
    if (el) {
        el.textContent = '';
        el.classList.remove('show');
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
