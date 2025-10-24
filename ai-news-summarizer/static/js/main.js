// Main JavaScript functionality

// Utility functions
const utils = {
    // Format date to readable format
    formatDate: (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    // Escape HTML to prevent XSS
    escapeHtml: (text) => {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    // Debounce function for search
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Show notification
    showNotification: (message, type = 'info') => {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.custom-notification');
        existingNotifications.forEach(notification => notification.remove());

        const notification = document.createElement('div');
        notification.className = `custom-notification ${type}`;
        notification.innerHTML = `
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">×</button>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 1rem;
            animation: slideInRight 0.3s ease;
        `;

        notification.querySelector('button').style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 1.2rem;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
        `;

        document.body.appendChild(notification);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    },

    // Prevent caching for AJAX requests
    preventCaching: (url) => {
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}_=${Date.now()}`;
    },

    // Check if current page requires authentication
    requiresAuth: () => {
        const protectedPaths = ['/dashboard', '/news', '/search'];
        const currentPath = window.location.pathname;
        return protectedPaths.some(path => currentPath.startsWith(path));
    },

    // Redirect to login if not authenticated
    redirectToLogin: () => {
        window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
    }
};

// Session and Cache Management
const sessionManager = {
    init() {
        this.handleBrowserBackButton();
        this.setupCachePrevention();
        this.checkAuthentication();
    },

    // Handle browser back/forward button issues
    handleBrowserBackButton() {
        // Reload page when using back/forward buttons (for cached pages)
        window.addEventListener('pageshow', (event) => {
            if (event.persisted) {
                console.log('Page loaded from cache, reloading...');
                window.location.reload();
            }
        });

        // Clear form cache when leaving page
        window.addEventListener('beforeunload', () => {
            const forms = document.querySelectorAll('form');
            forms.forEach(form => {
                if (!form.classList.contains('preserve-state')) {
                    form.reset();
                }
            });
        });
    },

    // Prevent caching of AJAX requests
    setupCachePrevention() {
        // Override fetch to add cache-busting parameters
        const originalFetch = window.fetch;
        window.fetch = function(...args) {
            if (typeof args[0] === 'string') {
                // Skip cache-busting for external URLs
                if (!args[0].startsWith('http') || args[0].includes(window.location.host)) {
                    args[0] = utils.preventCaching(args[0]);
                }
            }
            return originalFetch.apply(this, args);
        };

        // Also override XMLHttpRequest for compatibility
        const originalOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(...args) {
            if (typeof args[1] === 'string') {
                if (!args[1].startsWith('http') || args[1].includes(window.location.host)) {
                    args[1] = utils.preventCaching(args[1]);
                }
            }
            return originalOpen.apply(this, args);
        };
    },

    // Check authentication status
    checkAuthentication() {
        if (utils.requiresAuth()) {
            // Check if we have a session (you might want to make an API call to verify)
            const hasSession = document.cookie.includes('session') || 
                             document.body.classList.contains('logged-in');
            
            if (!hasSession) {
                console.log('Authentication required, redirecting to login...');
                utils.redirectToLogin();
            }
        }
    },

    // Clear all client-side data
    clearClientData() {
        // Clear any client-side storage
        localStorage.removeItem('news_preferences');
        sessionStorage.clear();
        
        // Clear form data
        const forms = document.querySelectorAll('form');
        forms.forEach(form => form.reset());
    }
};

// Form Handling Utilities
const formHandler = {
    // Add loading state to forms
    addLoadingState(form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn && !submitBtn.classList.contains('loading')) {
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = `
                <div class="spinner-small"></div>
                Processing...
            `;
            submitBtn.disabled = true;
            submitBtn.classList.add('loading');
            submitBtn.dataset.originalText = originalText;
        }
    },

    // Remove loading state from forms
    removeLoadingState(form) {
        const submitBtn = form.querySelector('button[type="submit"].loading');
        if (submitBtn) {
            submitBtn.innerHTML = submitBtn.dataset.originalText;
            submitBtn.disabled = false;
            submitBtn.classList.remove('loading');
        }
    },

    // Initialize all forms
    initForms() {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => {
            form.addEventListener('submit', (e) => {
                this.addLoadingState(form);
                
                // Re-enable button after 10 seconds (safety net)
                setTimeout(() => {
                    this.removeLoadingState(form);
                }, 10000);
            });

            // Handle form reset
            form.addEventListener('reset', () => {
                this.removeLoadingState(form);
            });
        });
    }
};

// Add CSS for notifications and loading states
const notificationStyles = `
@keyframes slideInRight {
    from {
        transform: translateX(100%);
        opacity: 0;
    }
    to {
        transform: translateX(0);
        opacity: 1;
    }
}

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

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}
`;

// Inject styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);

// Simple cache prevention for protected pages
const initCachePrevention = () => {
    // Reload if page was restored from cache
    window.addEventListener('pageshow', (event) => {
        if (event.persisted) {
            console.log('Page loaded from cache, reloading for security...');
            window.location.reload();
        }
    });

    // Clear forms on logout pages
    if (window.location.pathname === '/login' || window.location.pathname === '/register') {
        const forms = document.querySelectorAll('form');
        forms.forEach(form => form.reset());
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('AI News Summarizer initialized');
    
    // Initialize cache prevention
    initCachePrevention();
    
    // Add global click handler for logout to clear client data
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('logout-btn') || 
            e.target.closest('.logout-btn')) {
            // Clear any client-side storage
            localStorage.removeItem('news_preferences');
            sessionStorage.clear();
        }
    });
});

// Make utilities globally available
window.appUtils = utils;