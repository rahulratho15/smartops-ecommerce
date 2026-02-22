/* TechVault — Auth Module */

// Global state for authentication mode and current user
var authMode = 'login'; // Default mode is login
var currentUser = null; // Will hold the logged-in user object

// Assuming API is a global variable defined in config.js
// Assuming cart is a global variable defined in cart.js
// Assuming fetchCart and cartUI are global functions defined in cart.js or ui.js
// Assuming monitor is a global object defined in monitor.js for error logging

function showAuth() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.style.display = 'flex';
    } else {
        console.error('[SmartOps] Auth modal element "auth-modal" not found.');
        if (typeof monitor !== 'undefined' && typeof monitor.logError === 'function') {
            monitor.logError('Auth modal element "auth-modal" not found.', 'auth.js');
        }
    }
}

function hideAuth() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.style.display = 'none';
    } else {
        console.error('[SmartOps] Auth modal element "auth-modal" not found.');
        if (typeof monitor !== 'undefined' && typeof monitor.logError === 'function') {
            monitor.logError('Auth modal element "auth-modal" not found.', 'auth.js');
        }
    }
}

function toggleAuth(e) {
    if (e) e.preventDefault();

    const errEl = document.getElementById('auth-error');
    if (errEl) errEl.style.display = 'none';

    const authTitle = document.getElementById('auth-title');
    const authSub = document.getElementById('auth-sub');
    const signupField = document.getElementById('signup-field');
    const authBtn = document.getElementById('auth-btn');
    const authToggleText = document.getElementById('auth-toggle-text');
    const authToggleLink = document.getElementById('auth-toggle'); // Renamed to avoid potential conflict

    if (authMode === 'login') {
        authMode = 'signup';
        if (authTitle) authTitle.textContent = 'Create Account';
        if (authSub) authSub.textContent = 'Join TechVault';
        if (signupField) signupField.style.display = 'block';
        if (authBtn) authBtn.textContent = 'Sign Up';
        if (authToggleText) authToggleText.textContent = 'Already have an account?';
        if (authToggleLink) authToggleLink.textContent = 'Sign In';
    } else {
        authMode = 'login';
        if (authTitle) authTitle.textContent = 'Sign In';
        if (authSub) authSub.textContent = 'Welcome to TechVault';
        if (signupField) signupField.style.display = 'none';
        if (authBtn) authBtn.textContent = 'Sign In';
        if (authToggleText) authToggleText.textContent = "Don't have an account?";
        if (authToggleLink) authToggleLink.textContent = 'Sign Up';
    }
}

function doAuth() {
    const emailInput = document.getElementById('auth-email');
    const passInput = document.getElementById('auth-pass');
    const nameInput = document.getElementById('auth-name'); // This might be null if not in signup mode
    const errEl = document.getElementById('auth-error');
    const btn = document.getElementById('auth-btn');

    // Critical elements check to prevent crashes if the form structure is incomplete
    if (!emailInput || !passInput || !errEl || !btn) {
        if (errEl) {
            errEl.textContent = 'Missing critical authentication form elements (email, password, error display, or button).';
            errEl.style.display = 'block';
        }
        console.error('[SmartOps] Missing critical auth form elements.');
        if (typeof monitor !== 'undefined' && typeof monitor.logError === 'function') {
            monitor.logError('Missing critical auth form elements.', 'auth.js');
        }
        return;
    }

    const email = emailInput.value.trim();
    const password = passInput.value;
    const name = nameInput ? nameInput.value.trim() : ''; // Only get name if nameInput exists

    if (!email || !password) {
        errEl.textContent = 'Email and password required';
        errEl.style.display = 'block';
        return;
    }
    if (authMode === 'signup' && !name) {
        errEl.textContent = 'Name is required';
        errEl.style.display = 'block';
        return;
    }

    errEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = authMode === 'login' ? 'Signing in...' : 'Creating account...';

    const payload = authMode === 'signup'
        ? { action: 'signup', email: email, password: password, name: name }
        : { action: 'login', email: email, password: password };

    console.log('%c[SmartOps] Auth: ' + authMode + ' for ' + email, 'color: #fbbf24');

    // BUG FIX: Changed API endpoint from '/cart/add' to '/auth' for authentication
    // The payload already contains 'action' to differentiate login/signup.
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
                errEl.textContent = data.error || 'Authentication failed';
                errEl.style.display = 'block';
                btn.disabled = false;
                btn.textContent = authMode === 'login' ? 'Sign In' : 'Sign Up';
                return;
            }

            currentUser = data.user;
            localStorage.setItem('techvault_user', JSON.stringify(currentUser));
            console.log('%c[SmartOps] ✅ Logged in as: ' + currentUser.name + ' (' + currentUser.email + ')', 'color: #22c55e; font-weight: bold');

            hideAuth();
            showUser(); // Assuming showUser is defined globally or in ui.js
            // Safely call fetchCart if it exists (likely from cart.js)
            if (typeof fetchCart === 'function') {
                fetchCart();
            }
            btn.disabled = false;
            btn.textContent = authMode === 'login' ? 'Sign In' : 'Sign Up';
        })
        .catch(function (e) {
            errEl.textContent = 'Authentication error: ' + e.message;
            errEl.style.display = 'block';
            btn.disabled = false;
            btn.textContent = authMode === 'login' ? 'Sign In' : 'Sign Up';
            console.error('[SmartOps] Authentication fetch error:', e);
            if (typeof monitor !== 'undefined' && typeof monitor.logError === 'function') {
                monitor.logError('Authentication fetch error: ' + e.message, 'auth.js', e);
            }
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
    }

    const userBadge = document.getElementById('user-badge');
    const logoutBtn = document.getElementById('logout-btn');
    const userEmail = document.getElementById('user-email');

    if (userBadge) userBadge.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (userEmail) userEmail.textContent = ''; // Clear user email display on logout

    showAuth(); // Show the auth modal after logout
}

function showUser() {
    // BUG FIX: Check if currentUser is null before attempting to access its properties.
    // This prevents crashes if showUser is called when no user is logged in (e.g., on page load).
    const userBadge = document.getElementById('user-badge');
    const logoutBtn = document.getElementById('logout-btn');
    const userEmail = document.getElementById('user-email');

    if (!currentUser) {
        // Ensure elements are hidden/cleared even if currentUser is null
        if (userBadge) userBadge.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (userEmail) userEmail.textContent = ''; // Clear any previous email
        return;
    }

    if (userBadge) {
        userBadge.textContent = currentUser.name;
        userBadge.style.display = 'inline-block';
    } else {
        console.warn('[SmartOps] User badge element "user-badge" not found.');
    }

    if (logoutBtn) {
        logoutBtn.style.display = 'inline-block';
    } else {
        console.warn('[SmartOps] Logout button element "logout-btn" not found.');
    }

    if (userEmail) {
        userEmail.textContent = currentUser.email;
    } else {
        console.warn('[SmartOps] User email element "user-email" not found.');
    }
}