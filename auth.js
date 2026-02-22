/* TechVault — Auth Module */

// Global state for authentication mode and current user
var authMode = 'login'; // Default mode is login
var currentUser = null; // Will hold the logged-in user object

// Assuming API is a global variable defined in config.js
// Assuming cart is a global variable defined in cart.js
// Assuming fetchCart and cartUI are global functions defined in cart.js or ui.js

function showAuth() {
    document.getElementById('auth-modal').style.display = 'flex';
}

function hideAuth() {
    document.getElementById('auth-modal').style.display = 'none';
}

function toggleAuth(e) {
    if (e) e.preventDefault();
    var errEl = document.getElementById('auth-error');
    errEl.style.display = 'none';
    if (authMode === 'login') {
        authMode = 'signup';
        document.getElementById('auth-title').textContent = 'Create Account';
        document.getElementById('auth-sub').textContent = 'Join TechVault';
        document.getElementById('signup-field').style.display = 'block';
        document.getElementById('auth-btn').textContent = 'Sign Up';
        document.getElementById('auth-toggle-text').textContent = 'Already have an account?';
        document.getElementById('auth-toggle').textContent = 'Sign In';
    } else {
        authMode = 'login';
        document.getElementById('auth-title').textContent = 'Sign In';
        document.getElementById('auth-sub').textContent = 'Welcome to TechVault';
        document.getElementById('signup-field').style.display = 'none';
        document.getElementById('auth-btn').textContent = 'Sign In';
        document.getElementById('auth-toggle-text').textContent = "Don't have an account?";
        document.getElementById('auth-toggle').textContent = 'Sign Up';
    }
}

function doAuth() {
    var email = document.getElementById('auth-email').value.trim();
    var password = document.getElementById('auth-pass').value;
    var name = document.getElementById('auth-name').value.trim();
    var errEl = document.getElementById('auth-error');
    var btn = document.getElementById('auth-btn');

    if (!email || !password) { errEl.textContent = 'Email and password required'; errEl.style.display = 'block'; return; }
    if (authMode === 'signup' && !name) { errEl.textContent = 'Name is required'; errEl.style.display = 'block'; return; }

    errEl.style.display = 'none';
    btn.disabled = true;
    btn.textContent = authMode === 'login' ? 'Signing in...' : 'Creating account...';

    var payload = authMode === 'signup'
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
    document.getElementById('user-badge').style.display = 'none';
    document.getElementById('logout-btn').style.display = 'none';
    showAuth();
}

function showUser() {
    // BUG FIX: Check if currentUser is null before attempting to access its properties.
    // This prevents crashes if showUser is called when no user is logged in (e.g., on page load).
    if (!currentUser) {
        document.getElementById('user-badge').style.display = 'none';
        document.getElementById('logout-btn').style.display = 'none';
        document.getElementById('user-email').textContent = ''; // Clear any previous email
        return;
    }

    var badge = document.getElementById('user-badge');
    badge.textContent = currentUser.name;
    badge.style.display = 'inline-block';
    document.getElementById('logout-btn').style.display = 'inline-block';
    document.getElementById('user-email').textContent = currentUser.email;
}