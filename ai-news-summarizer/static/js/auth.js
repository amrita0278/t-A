// Authentication form validation and functionality

document.addEventListener('DOMContentLoaded', function() {
    const registerForm = document.getElementById('registerForm');
    const loginForm = document.querySelector('.auth-form');
    
    // Register form validation
    if (registerForm) {
        registerForm.addEventListener('submit', function(e) {
            const password = document.getElementById('password');
            const confirmPassword = document.getElementById('confirm_password');
            const email = document.getElementById('email');
            
            let isValid = true;
            let errorMessage = '';
            
            // Password confirmation check
            if (password.value !== confirmPassword.value) {
                isValid = false;
                errorMessage = 'Passwords do not match.';
                confirmPassword.style.borderColor = '#f44336';
            } else {
                confirmPassword.style.borderColor = '';
            }
            
            // Password length check
            if (password.value.length < 6) {
                isValid = false;
                errorMessage = 'Password must be at least 6 characters long.';
                password.style.borderColor = '#f44336';
            } else {
                password.style.borderColor = '';
            }
            
            // Email format validation
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email.value)) {
                isValid = false;
                errorMessage = 'Please enter a valid email address.';
                email.style.borderColor = '#f44336';
            } else {
                email.style.borderColor = '';
            }
            
            if (!isValid) {
                e.preventDefault();
                utils.showNotification(errorMessage, 'error');
            }
        });
    }
    
    // Real-time password confirmation validation
    const confirmPasswordInput = document.getElementById('confirm_password');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', function() {
            const password = document.getElementById('password');
            if (this.value !== password.value) {
                this.style.borderColor = '#f44336';
            } else {
                this.style.borderColor = '#4caf50';
            }
        });
    }
    
    // Real-time password strength indicator
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', function() {
            if (this.value.length < 6) {
                this.style.borderColor = '#f44336';
            } else {
                this.style.borderColor = '#4caf50';
            }
        });
    }
    
    // Email format validation in real-time
    const emailInput = document.getElementById('email');
    if (emailInput) {
        emailInput.addEventListener('blur', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (this.value && !emailRegex.test(this.value)) {
                this.style.borderColor = '#f44336';
            } else if (this.value) {
                this.style.borderColor = '#4caf50';
            } else {
                this.style.borderColor = '';
            }
        });
    }
    
    // Add loading state to forms
    const authForms = document.querySelectorAll('.auth-form');
    authForms.forEach(form => {
        form.addEventListener('submit', function() {
            const submitBtn = this.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<div class="spinner-small"></div> Processing...';
                
                // Re-enable button after 5 seconds (in case of error)
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = submitBtn.textContent.includes('Register') ? 'Create Account' : 'Sign In';
                }, 5000);
            }
        });
    });
});

// Add small spinner styles
const spinnerStyles = `
.spinner-small {
    width: 16px;
    height: 16px;
    border: 2px solid transparent;
    border-left: 2px solid currentColor;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    display: inline-block;
    margin-right: 0.5rem;
}
`;
const spinnerStyleSheet = document.createElement('style');
spinnerStyleSheet.textContent = spinnerStyles;
document.head.appendChild(spinnerStyleSheet);