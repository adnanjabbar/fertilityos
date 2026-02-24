document.addEventListener('DOMContentLoaded', function () {
    // If already logged in, redirect to dashboard
    if (isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return;
    }

    // Generate a nonce for CSRF-like protection
    const nonce = Math.random().toString(36).slice(2) + Date.now().toString(36);
    document.getElementById('loginNonce').value = nonce;
    sessionStorage.setItem('loginNonce', nonce);

    // Restore remembered email
    const remembered = localStorage.getItem('rememberedEmail');
    if (remembered) {
        document.getElementById('email').value = remembered;
        document.getElementById('rememberMe').checked = true;
    }

    // Password visibility toggle
    const passwordToggle = document.getElementById('passwordToggle');
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.getElementById('eyeIcon');
    const eyeOffIcon = document.getElementById('eyeOffIcon');

    passwordToggle.addEventListener('click', function () {
        const isVisible = passwordInput.type === 'text';
        passwordInput.type = isVisible ? 'password' : 'text';
        eyeIcon.style.display = isVisible ? '' : 'none';
        eyeOffIcon.style.display = isVisible ? 'none' : '';
    });

    // Inline field validation
    document.getElementById('email').addEventListener('blur', function () {
        validateEmail();
    });
    document.getElementById('password').addEventListener('blur', function () {
        validatePassword();
    });
    document.getElementById('subdomain').addEventListener('blur', function () {
        validateSubdomain();
    });

    // Forgot password modal
    document.getElementById('forgotPasswordBtn').addEventListener('click', function () {
        // Pre-fill from login form if available
        const email = document.getElementById('email').value;
        const subdomain = document.getElementById('subdomain').value;
        if (email) document.getElementById('resetEmail').value = email;
        if (subdomain) document.getElementById('resetSubdomain').value = subdomain;
        document.getElementById('forgotPasswordModal').style.display = 'flex';
    });

    document.getElementById('forgotForm').addEventListener('submit', function (e) {
        e.preventDefault();
        // Placeholder: show success message
        document.getElementById('forgotError').style.display = 'none';
        document.getElementById('forgotSuccess').textContent =
            'If that account exists, a reset link has been sent. Please check your email.';
        document.getElementById('forgotSuccess').style.display = 'flex';
    });

    // Login form submission
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const emailOk = validateEmail();
        const passwordOk = validatePassword();
        const subdomainOk = validateSubdomain();
        if (!emailOk || !passwordOk || !subdomainOk) return;

        hideError('errorMessage');

        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        const subdomain = document.getElementById('subdomain').value.trim();
        const rememberMe = document.getElementById('rememberMe').checked;

        setLoading(true);

        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, subdomain })
            });

            const data = await response.json();

            if (response.ok) {
                // Handle remember me
                if (rememberMe) {
                    localStorage.setItem('rememberedEmail', email);
                } else {
                    localStorage.removeItem('rememberedEmail');
                }

                saveAuthData(data.token, data.user);
                window.location.href = '/dashboard.html';
            } else if (response.status === 429) {
                const retryAfterRaw = response.headers.get('Retry-After');
                // Retry-After is in seconds; convert to whole minutes (minimum 1)
                const retryMinutes = retryAfterRaw
                    ? Math.max(1, Math.ceil(parseInt(retryAfterRaw, 10) / 60))
                    : 5;
                showError('errorMessage', `Too many login attempts. Please try again in ${retryMinutes} minute(s).`);
                setLoading(false);
            } else {
                // Generic message — don't reveal email vs password distinction
                showError('errorMessage', 'Invalid credentials. Please check your details and try again.');
                setLoading(false);
            }
        } catch (error) {
            showError('errorMessage', 'Connection error. Please check your internet and try again.');
            setLoading(false);
        }
    });

    function setLoading(loading) {
        const btn = document.getElementById('loginBtn');
        const btnText = document.getElementById('loginBtnText');
        const spinner = document.getElementById('loginSpinner');
        btn.disabled = loading;
        btnText.textContent = loading ? 'Signing in…' : 'Sign In';
        spinner.style.display = loading ? 'inline-block' : 'none';
    }

    function validateEmail() {
        const val = document.getElementById('email').value.trim();
        const err = document.getElementById('emailError');
        if (!val) {
            err.textContent = 'Email is required.';
            err.style.display = 'block';
            return false;
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
            err.textContent = 'Please enter a valid email address.';
            err.style.display = 'block';
            return false;
        }
        err.style.display = 'none';
        return true;
    }

    function validatePassword() {
        const val = document.getElementById('password').value;
        const err = document.getElementById('passwordError');
        if (!val) {
            err.textContent = 'Password is required.';
            err.style.display = 'block';
            return false;
        }
        err.style.display = 'none';
        return true;
    }

    function validateSubdomain() {
        const val = document.getElementById('subdomain').value.trim();
        const err = document.getElementById('subdomainError');
        if (!val) {
            err.textContent = 'Clinic subdomain is required.';
            err.style.display = 'block';
            return false;
        }
        err.style.display = 'none';
        return true;
    }
});

function closeForgotModal() {
    document.getElementById('forgotPasswordModal').style.display = 'none';
    document.getElementById('forgotForm').reset();
    document.getElementById('forgotError').style.display = 'none';
    document.getElementById('forgotSuccess').style.display = 'none';
}
