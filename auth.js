/* TechVault — Auth Module */

// Global state for authentication mode and current user
var authMode = 'login'; // Default mode is login
var currentUser = null; // Will hold the logged-in user object

// Assuming API is a global variable defined in config.js
// Assuming cart is a global variable defined in cart.js
// Assuming fetchCart and cartUI are global functions defined in cart.js or ui.js

function showAuth() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.style.display = 'flex';
    } else {
        console.error('[SmartOps] Error: auth-modal element not found for showAuth.');
    }
}

function hideAuth() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.style.display = 'none';
    } else {
        console.error('[SmartOps] Error: auth-modal element not found for hideAuth.');
    }
}

function toggleAuth(e) {
    if (e) e.preventDefault();

    const elements = {
        errEl: document.getElementById('auth-error'),
        authTitle: document.getElementById('auth-title'),
        authSub: document.getElementById('auth-sub'),
        signupField: document.getElementById('signup-field'),
        authBtn: document.getElementById('auth-btn'),
        authToggleText: document.getElementById('auth-toggle-text'),
        authToggle: document.getElementById('auth-toggle')
    };

    // Check if all critical elements exist
    for (const key in elements) {
        if (!elements[key]) {
            console.error(`[SmartOps] Error: Missing UI element '${key}' in toggleAuth.`);
            // If errEl exists, try to show an error there
            if (elements.errEl) {
                elements.errEl.textContent = 'System error: Missing UI elements for authentication.';
                elements.errEl.style.display = 'block';
            }
            return; // Stop execution if critical elements are missing
        }
    }

    elements.errEl.style.display = 'none';

    if (authMode === 'login') {
        authMode = 'signup';
        elements.authTitle.textContent = 'Create Account';
        elements.authSub.textContent = 'Join TechVault';
        elements.signupField.style.display = 'block';
        elements.authBtn.textContent = 'Sign Up';
        elements.authToggleText.textContent = 'Already have an account?';
        elements.authToggle.textContent = 'Sign In';
    } else {
        authMode = 'login';
        elements.authTitle.textContent = 'Sign In';
        elements.authSub.textContent = 'Welcome to TechVault';
        elements.signupField.style.display = 'none';
        elements.authBtn.textContent = 'Sign In';
        elements.authToggleText.textContent = "Don't have an account?";
        elements.authToggle.textContent = 'Sign Up';
    }
}

function doAuth() {
    const elements = {
        emailInput: document.getElementById('auth-email'),
        passwordInput: document.getElementById('auth-pass'),
        nameInput: document.getElementById('auth-name'),
        errEl: document.getElementById('auth-error'),
        btn: document.getElementById('auth-btn')
    };

    // Check if all required elements exist
    for (const key in elements) {
        if (!elements[key]) {
            console.error(`[SmartOps] Error: Missing UI element '${key}' in doAuth.`);
            if (elements.errEl) {
                elements.errEl.textContent = 'System error: Missing UI elements for authentication.';
                elements.errEl.style.display = 'block';
            }
            return;
        }
    }

    const email = elements.emailInput.value.trim();
    const password = elements.passwordInput.value;
    const name = elements.nameInput.value.trim();

    if (!email || !password) {
        elements.errEl.textContent = 'Email and password required';
        elements.errEl.style.display = 'block';
        return;
    }
    if (authMode === 'signup' && !name) {
        elements.errEl.textContent = 'Name is required';
        elements.errEl.style.display = 'block';
        return;
    }

    elements.errEl.style.display = 'none';
    elements.btn.disabled = true;
    elements.btn.textContent = authMode === 'login' ? 'Signing in...' : 'Creating account...';

    var payload = authMode === 'signup'
        ? { action: 'signup', email: email, password: password, name: name }
        : { action: 'login', email: email, password: password };

    console.log('%c[SmartOps] Auth: ' + authMode + ' for ' + email, 'color: #fbbf24');

    // BUG FIX: Check if API is defined to prevent ReferenceError crashes
    if (typeof API === 'undefined') {
        console.error('[SmartOps] Error: Global API variable is not defined. Check config.js.');
        elements.errEl.textContent = 'System error: API configuration missing.';
        elements.errEl.style.display = 'block';
        elements.btn.disabled = false;
        elements.btn.textContent = authMode === 'login' ? 'Sign In' : 'Sign Up';
        return;
    }

    fetch(API + '/auth', { // Assuming API is defined globally by config.js
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(function (r) {
            // Check for HTTP errors (e.g., 400, 500) before trying to parse JSON
            if (!r.ok) {
                return r.json().then(errorData => {
                    throw new Error(errorData.error || `Server error: ${r.status} ${r.statusText}`);
                }).catch(() => {
                    // Fallback if response is not JSON (e.g., HTML error page)
                    throw new Error(`Server error: ${r.status} ${r.statusText}`);
                });
            }
            return r.json();
        })
        .then(function (data) {
            if (!data.success) {
                elements.errEl.textContent = data.error || 'Authentication failed';
                elements.errEl.style.display = 'block';
                elements.btn.disabled = false;
                elements.btn.textContent = authMode === 'login' ? 'Sign In' : 'Sign Up';
                return;
            }

            currentUser = data.user;
            localStorage.setItem('techvault_user', JSON.stringify(currentUser));
            console.log('%c[SmartOps] ✅ Logged in as: ' + currentUser.name + ' (' + currentUser.email + ')', 'color: #22c55e; font-weight: bold');

            hideAuth();
            // Safely call showUser if it exists (likely from ui.js)
            if (typeof showUser === 'function') {
                showUser();
            } else {
                console.warn('[SmartOps] Warning: showUser function not found.');
            }
            // Safely call fetchCart if it exists (likely from cart.js)
            if (typeof fetchCart === 'function') {
                fetchCart();
            } else {
                console.warn('[SmartOps] Warning: fetchCart function not found.');
            }
            elements.btn.disabled = false;
            elements.btn.textContent = authMode === 'login' ? 'Sign In' : 'Sign Up';
        })
        .catch(function (e) {
            elements.errEl.textContent = 'Authentication error: ' + e.message;
            elements.errEl.style.display = 'block';
            elements.btn.disabled = false;
            elements.btn.textContent = authMode === 'login' ? 'Sign In' : 'Sign Up';
        });
}

function logout() {
    // BUG FIX: Check if currentUser exists before accessing its properties for logging
    if (currentUser) {
        console.log('%c[SmartOps] User logged out: ' + currentUser.email, 'color: #fbbf24');
    } else {
        console.log('%c[SmartOps] User logged out (no current user found).', 'color: #fbbf24');
    }

    currentUser = null;
    // Safely reset cart if it exists (likely from cart.js)
    if (typeof cart !== 'undefined') {
        cart = [];
    }
    localStorage.removeItem('techvault_user');
    // Safely call cartUI if it exists (likely from ui.js or cart.js)
    if (typeof cartUI === 'function') {
        cartUI();
    } else {
        console.warn('[SmartOps] Warning: cartUI function not found.');
    }

    const userBadge = document.getElementById('user-badge');
    const logoutBtn = document.getElementById('logout-btn');

    if (userBadge) userBadge.style.display = 'none';
    else console.warn('[SmartOps] Warning: user-badge element not found for logout.');

    if (logoutBtn) logoutBtn.style.display = 'none';
    else console.warn('[SmartOps] Warning: logout-btn element not found for logout.');

    showAuth();
}

function showUser() {
    const elements = {
        userBadge: document.getElementById('user-badge'),
        logoutBtn: document.getElementById('logout-btn'),
        userEmail: document.getElementById('user-email')
    };

    // Check if all required elements exist
    for (const key in elements) {
        if (!elements[key]) {
            console.error(`[SmartOps] Error: Missing UI element '${key}' in showUser.`);
            return; // Prevent further crashes
        }
    }

    // BUG FIX: Check if currentUser is null before attempting to access its properties.
    // This prevents crashes if showUser is called when no user is logged in (e.g., on page load).
    if (!currentUser) {
        elements.userBadge.style.display = 'none';
        elements.logoutBtn.style.display = 'none';
        elements.userEmail.textContent = ''; // Clear any previous email
        return;
    }

    elements.userBadge.textContent = currentUser.name;
    elements.userBadge.style.display = 'inline-block';
    elements.logoutBtn.style.display = 'inline-block';
    elements.userEmail.textContent = currentUser.email;
}