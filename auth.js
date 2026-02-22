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
        console.warn('[SmartOps] Auth: Element "auth-modal" not found for showAuth.');
    }
}

function hideAuth() {
    const authModal = document.getElementById('auth-modal');
    if (authModal) {
        authModal.style.display = 'none';
    } else {
        console.warn('[SmartOps] Auth: Element "auth-modal" not found for hideAuth.');
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
    const authToggle = document.getElementById('auth-toggle');

    if (authMode === 'login') {
        authMode = 'signup';
        if (authTitle) authTitle.textContent = 'Create Account';
        if (authSub) authSub.textContent = 'Join TechVault';
        if (signupField) signupField.style.display = 'block';
        if (authBtn) authBtn.textContent = 'Sign Up';
        if (authToggleText) authToggleText.textContent = 'Already have an account?';
        if (authToggle) authToggle.textContent = 'Sign In';
    } else {
        authMode = 'login';
        if (authTitle) authTitle.textContent = 'Sign In';
        if (authSub) authSub.textContent = 'Welcome to TechVault';
        if (signupField) signupField.style.display = 'none';
        if (authBtn) authBtn.textContent = 'Sign In';
        if (authToggleText) authToggleText.textContent = "Don't have an account?";
        if (authToggle) authToggle.textContent = 'Sign Up';
    }
}

function doAuth() {
    const emailInput = document.getElementById('auth-email');
    const passwordInput = document.getElementById('auth-pass');
    const nameInput = document.getElementById('auth-name'); // Only relevant for signup
    const errEl = document.getElementById('auth-error');
    const btn = document.getElementById('auth-btn');

    // Validate critical DOM elements exist before proceeding
    if (!emailInput || !passwordInput || !errEl || !btn) {
        if (errEl) errEl.textContent = 'Missing critical form elements. Please refresh.';
        console.error('[SmartOps] Auth: Missing critical DOM elements for authentication form.');
        if (btn) {
            btn.disabled = false;
            btn.textContent = authMode === 'login' ? 'Sign In' : 'Sign Up';
        }
        return;
    }
    if (authMode === 'signup' && !nameInput) {
        errEl.textContent = 'Missing name field for signup. Please refresh.';
        console.error('[SmartOps] Auth: Missing name input element for signup.');
        btn.disabled = false;
        btn.textContent = 'Sign Up';
        return;
    }

    var email = emailInput.value.trim();
    var password = passwordInput.value;
    var name = nameInput ? nameInput.value.trim() : ''; // Get name only if element exists

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

    var payload = authMode === 'signup'
        ? { action: 'signup', email: email, password: password, name: name }
        : { action: 'login', email: email, password: password };

    console.log('%c[SmartOps] Auth: ' + authMode + ' for ' + email, 'color: #fbbf24');

    fetch(API + '/auth', { // Assuming API is defined globally by config.js
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(function (r) {
            if (!r.ok) {
                return r.json().then(errorData => {
                    throw new Error(errorData.error || `Server error: ${r.status} ${r.statusText}`);
                }).catch(() => {
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
            showUser(); // showUser is defined in this module, call directly.
            
            if (typeof fetchCart === 'function') {
                fetchCart();
            }
            btn.disabled = false;
            btn.textContent = authMode === 'login' ? 'Sign In' : 'Sign Up';
        })
        .catch(function (e) {
            if (errEl) {
                errEl.textContent = 'Authentication error: ' + e.message;
                errEl.style.display = 'block';
            } else {
                console.error('[SmartOps] Auth: Authentication error, but error element not found:', e.message);
            }
            if (btn) {
                btn.disabled = false;
                btn.textContent = authMode === 'login' ? 'Sign In' : 'Sign Up';
            }
        });
}

function logout() {
    if (currentUser) {
        console.log('%c[SmartOps] User logged out: ' + currentUser.email, 'color: #fbbf24');
    } else {
        console.log('%c[SmartOps] User logged out (no current user found).', 'color: #fbbf24');
    }

    currentUser = null;
    if (typeof cart !== 'undefined') {
        cart = [];
    }
    localStorage.removeItem('techvault_user');
    if (typeof cartUI === 'function') {
        cartUI();
    }

    const userBadge = document.getElementById('user-badge');
    const logoutBtn = document.getElementById('logout-btn');

    if (userBadge) userBadge.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    
    showAuth();
}

function showUser() {
    const userBadge = document.getElementById('user-badge');
    const logoutBtn = document.getElementById('logout-btn');
    const userEmail = document.getElementById('user-email');

    if (!currentUser) {
        if (userBadge) userBadge.style.display = 'none';
        if (logoutBtn) logoutBtn.style.display = 'none';
        if (userEmail) userEmail.textContent = '';
        return;
    }

    if (userBadge) {
        userBadge.textContent = currentUser.name;
        userBadge.style.display = 'inline-block';
    } else {
        console.warn('[SmartOps] Auth: Element "user-badge" not found for showing user.');
    }

    if (logoutBtn) {
        logoutBtn.style.display = 'inline-block';
    } else {
        console.warn('[SmartOps] Auth: Element "logout-btn" not found for showing user.');
    }

    if (userEmail) {
        userEmail.textContent = currentUser.email;
    } else {
        console.warn('[SmartOps] Auth: Element "user-email" not found for showing user.');
    }
}