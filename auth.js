/* TechVault — Auth Module */

var authMode = 'login'; // Initialize authMode for the modal state
var currentUser = null; // Initialize currentUser, will be populated from localStorage or API
var cart = []; // Initialize cart, will be populated by fetchCart or similar

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

    // BUG FIX: Changed endpoint from '/cart/add' to '/auth' for authentication requests.
    fetch(API + '/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(function (r) { return r.json(); })
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
            // Assuming showUser and fetchCart are defined globally or in other modules
            if (typeof showUser === 'function') showUser();
            if (typeof fetchCart === 'function') fetchCart();
            
            btn.disabled = false;
            btn.textContent = authMode === 'login' ? 'Sign In' : 'Sign Up';
        })
        .catch(function (e) {
            errEl.textContent = 'Network error: ' + e.message;
            errEl.style.display = 'block';
            btn.disabled = false;
            btn.textContent = authMode === 'login' ? 'Sign In' : 'Sign Up';
        });
}

function logout() {
    console.log('%c[SmartOps] User logged out: ' + (currentUser ? currentUser.email : 'N/A'), 'color: #fbbf24');
    currentUser = null;
    cart = [];
    localStorage.removeItem('techvault_user');
    // Assuming cartUI is defined globally or in another module
    if (typeof cartUI === 'function') cartUI();
    document.getElementById('user-badge').style.display = 'none';
    document.getElementById('logout-btn').style.display = 'none';
    showAuth();
}

function showUser() {
    var badge = document.getElementById('user-badge');
    if (currentUser && badge) { // Add null check for currentUser and badge
        badge.textContent = currentUser.name;
        badge.style.display = 'inline-block';
    }
    var logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.style.display = 'inline-block';
    }
    var userEmail = document.getElementById('user-email');
    if (currentUser && userEmail) { // Add null check for currentUser and userEmail
        userEmail.textContent = currentUser.email;
    }
}