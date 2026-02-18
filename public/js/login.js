document.addEventListener('DOMContentLoaded', function() {
    // If already logged in, redirect to dashboard
    if (isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return;
    }
    
    // Handle login form submission
    const loginForm = document.getElementById('loginForm');
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        hideError('errorMessage');
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const subdomain = document.getElementById('subdomain').value;
        
        const submitButton = loginForm.querySelector('button[type="submit"]');
        submitButton.disabled = true;
        submitButton.textContent = 'Logging in...';
        
        try {
            const response = await fetch(`${API_URL}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password, subdomain })
            });
            
            const data = await response.json();
            
            if (response.ok) {
                // Save auth data
                saveAuthData(data.token, data.user);
                
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                showError('errorMessage', data.error || 'Login failed');
                submitButton.disabled = false;
                submitButton.textContent = 'Login';
            }
        } catch (error) {
            showError('errorMessage', 'Connection error. Please try again.');
            submitButton.disabled = false;
            submitButton.textContent = 'Login';
        }
    });
});
