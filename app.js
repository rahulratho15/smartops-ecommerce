/* TechVault V2 — SmartOps Monitored — Auth + Server-Side Cart + Smart Ring Pro */
var API = 'https://kn6pfzv6b4.execute-api.us-east-1.amazonaws.com/prod';
var DASH_API = 'https://5imr89vtpi.execute-api.us-east-1.amazonaws.com/prod';
var VER = 'v2';

var PRODUCTS = [
    { id: 1, name: 'MacBook Pro 16"', price: 1299, img: 'https://picsum.photos/seed/mbp16/300/200', cat: 'Laptops' },
    { id: 2, name: 'iPhone 15 Pro', price: 799, img: 'https://picsum.photos/seed/ip15p/300/200', cat: 'Phones' },
    { id: 3, name: 'Sony WH-1000XM5', price: 199, img: 'https://picsum.photos/seed/sxm5h/300/200', cat: 'Audio' },
    { id: 4, name: 'Apple Watch Ultra', price: 299, img: 'https://picsum.photos/seed/awu2x/300/200', cat: 'Wearables' },
    { id: 5, name: 'iPad Air M2', price: 499, img: 'https://picsum.photos/seed/ipam2/300/200', cat: 'Tablets' },
    { id: 6, name: 'AirPods Pro 2', price: 179, img: 'https://picsum.photos/seed/airp2/300/200', cat: 'Audio' },
    { id: 7, name: 'Galaxy S24 Ultra', price: 699, img: 'https://picsum.photos/seed/gs24u/300/200', cat: 'Phones' },
    { id: 8, name: 'Bose QC Ultra', price: 249, img: 'https://picsum.photos/seed/bqcul/300/200', cat: 'Audio' },
    { id: 9, name: 'Gaming Keyboard RGB', price: 149, img: 'https://picsum.photos/seed/gkrgb/300/200', cat: 'Peripherals' },
    { id: 10, name: 'Smart Ring Pro', price: 199, img: 'https://picsum.photos/seed/sring/300/200', cat: 'Wearables' }
];

/* ── State ── */
var currentUser = null;
try {
    var stored = localStorage.getItem('techvault_user');
    currentUser = stored ? JSON.parse(stored) : null;
} catch (e) {
    currentUser = null;
    localStorage.removeItem('techvault_user');
}
var cart = [];
var authMode = 'login'; /* login or signup */
var lastDecisionCount = 0;

/* ── Init ── */
console.log('%c[SmartOps] TechVault V2 loaded', 'color: #a78bfa; font-weight: bold; font-size: 14px');
console.log('%c[SmartOps] 10 products (NEW: Smart Ring Pro #10)', 'color: #60a5fa');

document.addEventListener('DOMContentLoaded', function() {
    if (currentUser) {
        console.log('%c[SmartOps] User restored: ' + (currentUser.name || 'Unknown') + ' (' + (currentUser.email || 'Unknown') + ')', 'color: #22c55e');
        hideAuth();
        showUser();
        fetchCart();
    } else {
        console.log('%c[SmartOps] No user session — showing login', 'color: #fbbf24');
        showAuth();
    }

    renderProducts();
    startPolling();
});

/* ══════════════════ AUTH ══════════════════ */

function showAuth() {
    var modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'flex';
}

function hideAuth() {
    var modal = document.getElementById('auth-modal');
    if (modal) modal.style.display = 'none';
}

function toggleAuth(e) {
    if (e) e.preventDefault();
    var errEl = document.getElementById('auth-error');
    if (errEl) errEl.style.display = 'none';
    if (authMode === 'login') {
        authMode = 'signup';
        var title = document.getElementById('auth-title');
        var sub = document.getElementById('auth-sub');
        var signupField = document.getElementById('signup-field');
        var authBtn = document.getElementById('auth-btn');
        var authToggleText = document.getElementById('auth-toggle-text');
        var authToggle = document.getElementById('auth-toggle');
        if (title) title.textContent = 'Create Account';
        if (sub) sub.textContent = 'Join TechVault';
        if (signupField) signupField.style.display = 'block';
        if (authBtn) authBtn.textContent = 'Sign Up';
        if (authToggleText) authToggleText.textContent = 'Already have an account?';
        if (authToggle) authToggle.textContent = 'Sign In';
    } else {
        authMode = 'login';
        var title = document.getElementById('auth-title');
        var sub = document.getElementById('auth-sub');
        var signupField = document.getElementById('signup-field');
        var authBtn = document.getElementById('auth-btn');
        var authToggleText = document.getElementById('auth-toggle-text');
        var authToggle = document.getElementById('auth-toggle');
        if (title) title.textContent = 'Sign In';
        if (sub) sub.textContent = 'Welcome to TechVault';
        if (signupField) signupField.style.display = 'none';
        if (authBtn) authBtn.textContent = 'Sign In';
        if (authToggleText) authToggleText.textContent = "Don't have an account?";
        if (authToggle) authToggle.textContent = 'Sign Up';
    }
}

function doAuth() {
    var emailEl = document.getElementById('auth-email');
    var passEl = document.getElementById('auth-pass');
    var nameEl = document.getElementById('auth-name');
    var errEl = document.getElementById('auth-error');
    var btn = document.getElementById('auth-btn');

    if (!emailEl || !passEl) {
        if (errEl) { errEl.textContent = 'Form elements not found'; errEl.style.display = 'block'; }
        return;
    }

    var email = emailEl.value.trim();
    var password = passEl.value;
    var name = nameEl ? nameEl.value.trim() : '';

    if (!email || !password) { if (errEl) { errEl.textContent = 'Email and password required'; errEl.style.display = 'block'; } return; }
    if (authMode === 'signup' && !name) { if (errEl) { errEl.textContent = 'Name is required'; errEl.style.display = 'block'; } return; }

    if (errEl) errEl.style.display = 'none';
    if (btn) { btn.disabled = true; btn.textContent = authMode === 'login' ? 'Signing in...' : 'Creating account...'; }

    var payload = authMode === 'signup'
        ? { action: 'signup', email: email, password: password, name: name }
        : { action: 'login', email: email, password: password };

    console.log('%c[SmartOps] Auth: ' + authMode + ' for ' + email, 'color: #fbbf24');

    fetch(API + '/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (!data.success) {
                if (errEl) { errEl.textContent = data.error || 'Authentication failed'; errEl.style.display = 'block'; }
                if (btn) { btn.disabled = false; btn.textContent = authMode === 'login' ? 'Sign In' : 'Sign Up'; }
                return;
            }

            currentUser = data.user;
            try {
                localStorage.setItem('techvault_user', JSON.stringify(currentUser));
            } catch (e) {
                console.error('[SmartOps] localStorage error:', e);
            }
            console.log('%c[SmartOps] ✅ Logged in as: ' + (currentUser.name || 'Unknown') + ' (' + (currentUser.email || 'Unknown') + ')', 'color: #22c55e; font-weight: bold');

            hideAuth();
            showUser();
            fetchCart();
            if (btn) { btn.disabled = false; btn.textContent = authMode === 'login' ? 'Sign In' : 'Sign Up'; }
        })
        .catch(function (e) {
            var msg = (e && e.message) ? e.message : 'Network error';
            if (errEl) { errEl.textContent = 'Network error: ' + msg; errEl.style.display = 'block'; }
            if (btn) { btn.disabled = false; btn.textContent = authMode === 'login' ? 'Sign In' : 'Sign Up'; }
        });
}

function logout() {
    console.log('%c[SmartOps] User logged out: ' + (currentUser ? currentUser.email : 'unknown'), 'color: #fbbf24');
    currentUser = null;
    cart = [];
    try {
        localStorage.removeItem('techvault_user');
    } catch (e) {}
    cartUI();
    var userBadge = document.getElementById('user-badge');
    var logoutBtn = document.getElementById('logout-btn');
    if (userBadge) userBadge.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    showAuth();
}

function showUser() {
    var badge = document.getElementById('user-badge');
    var logoutBtn = document.getElementById('logout-btn');
    var userEmail = document.getElementById('user-email');
    if (badge) {
        badge.textContent = currentUser ? (currentUser.name || 'User') : 'User';
        badge.style.display = 'inline-block';
    }
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    if (userEmail) userEmail.textContent = currentUser ? (currentUser.email || '') : '';
}

/* ══════════════════ CART (Server-Side) ══════════════════ */

function fetchCart() {
    if (!currentUser || !currentUser.email) return;
    console.log('%c[SmartOps] Fetching cart from DynamoDB for ' + currentUser.email + '...', 'color: #60a5fa');

    fetch(API + '/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getCart', userId: currentUser.email })
    })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (data.success && data.items && Array.isArray(data.items)) {
                cart = data.items;
                cartUI();
                console.log('%c[SmartOps] Cart loaded: ' + cart.length + ' items from DynamoDB', 'color: #22c55e');
            } else if (data.success) {
                cart = [];
                cartUI();
            }
        })
        .catch(function (e) {
            var msg = (e && e.message) ? e.message : 'Unknown error';
            console.error('[SmartOps] Cart fetch error:', msg);
        });
}

function add(id) {
    if (!currentUser || !currentUser.email) { showAuth(); return; }
    var userEmail = currentUser.email; // Capture email for async callbacks
    var b = document.getElementById('btn-' + id);
    if (!b) return;
    if (b.disabled) return;
    b.disabled = true;
    b.textContent = 'Adding...';
    b.className = (b.className || '').replace(' done', '').replace(' fail', '');

    console.log('%c[SmartOps] Adding product #' + id + ' to cart for ' + userEmail, 'color: #fbbf24');
    fetch(API + '/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', userId: userEmail, productId: id, version: VER })
    })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (!data.success) throw new Error(data.error || 'Unknown error');

            /* Update local cart state */
            if (!Array.isArray(cart)) cart = [];
            var c = cart.find(function (x) { return x.productId === id; });
            if (c) c.qty++; else cart.push({ productId: id, qty: 1 });
            cartUI();
            b.textContent = 'Added ✓';
            b.className = (id === 9 || id === 10 ? 'btn new-product done' : 'btn done');
            console.log('%c[SmartOps] ✅ Product #' + id + ' added successfully (stored in DynamoDB)', 'color: #22c55e; font-weight: bold');

            slog('CART_ADD_SUCCESS', { productId: id, userId: userEmail });
            setTimeout(function () { b.textContent = 'Add to Cart'; b.className = (id === 9 || id === 10 ? 'btn new-product' : 'btn'); b.disabled = false; }, 700);
        })
        .catch(function (e) {
            var msg = (e && e.message) ? e.message : 'Unknown error';
            console.error('%c[SmartOps] ❌ Cart error: ' + msg, 'color: #ef4444');
            b.textContent = 'Failed';
            b.className = (id === 9 || id === 10 ? 'btn new-product fail' : 'btn fail');
            slog('CART_ADD_ERROR', { productId: id, error: msg });
            setTimeout(function () { b.textContent = 'Add to Cart'; b.className = (id === 9 || id === 10 ? 'btn new-product' : 'btn'); b.disabled = false; }, 1000);
        });
}

/* ══════════════════ UI ══════════════════ */

function renderProducts() {
    var productsEl = document.getElementById('products');
    var verBadge = document.getElementById('ver-badge');
    if (!productsEl) return;
    productsEl.innerHTML = PRODUCTS.map(function (p) {
        var isNew = p.id === 9 || p.id === 10;
        return '<div class="card' + (isNew ? ' new-card' : '') + '" data-id="' + p.id + '">' +
            '<img src="' + p.img + '" alt="' + p.name + '" loading="lazy">' +
            (isNew ? '<span class="new-tag">NEW</span>' : '') +
            '<div class="info"><span class="cat">' + p.cat + '</span>' +
            '<h3>' + p.name + '</h3><p class="price">$' + p.price + '</p>' +
            '<button class="btn' + (isNew ? ' new-product' : '') + '" id="btn-' + p.id + '" onclick="add(' + p.id + ')">Add to Cart</button>' +
            '</div></div>';
    }).join('');
    if (verBadge) {
        verBadge.textContent = 'v2 New Product';
        verBadge.style.background = '#1a1a2e';
        verBadge.style.color = '#a78bfa';
        verBadge.style.borderColor = '#2d2a4a';
    }
}

function cartUI() {
    var countEl = document.getElementById('count');
    var cartItemsEl = document.getElementById('cart-items');
    var totalEl = document.getElementById('total');
    if (!Array.isArray(cart)) cart = [];

    // Add defensive checks for malformed cart items before accessing properties
    var count = cart.reduce(function (s, c) {
        if (!c || typeof c.qty === 'undefined') return s; // Skip if cart item is null/undefined or missing qty
        return s + (c.qty || 0);
    }, 0);
    if (countEl) countEl.textContent = count;
    if (!cartItemsEl) return;
    if (!cart.length) { cartItemsEl.innerHTML = '<p class="empty">Cart is empty</p>'; if (totalEl) totalEl.textContent = ''; return; }

    cartItemsEl.innerHTML = cart.map(function (c) {
        // Add defensive checks for malformed cart items before accessing properties
        if (!c || typeof c.productId === 'undefined') return ''; // Skip if cart item is null/undefined or missing productId

        var p = PRODUCTS.find(function (x) { return x.id === c.productId; });
        if (!p) return '';
        return '<div class="ci"><span>' + p.name + ' x' + (c.qty || 0) + '</span><span>$' + (p.price * (c.qty || 0)) + '</span><button onclick="rm(' + c.productId + ')">×</button></div>';
    }).join('');

    var total = cart.reduce(function (s, c) {
        // Add defensive checks for malformed cart items before accessing properties
        if (!c || typeof c.productId === 'undefined' || typeof c.qty === 'undefined') return s; // Skip if cart item is null/undefined or missing productId/qty

        var p = PRODUCTS.find(function (x) { return x.id === c.productId; });
        return s + (p ? p.price * (c.qty || 0) : 0);
    }, 0);
    if (totalEl) totalEl.textContent = 'Total: $' + total;
}

function rm(id) {
    if (!currentUser || !currentUser.email) return;
    console.log('%c[SmartOps] Removing product #' + id + ' from cart...', 'color: #fbbf24');
    fetch(API + '/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', userId: currentUser.email, productId: id })
    }).then(function () {
        if (!Array.isArray(cart)) cart = [];
        cart = cart.filter(function (c) { return c.productId !== id; });
        cartUI();
        console.log('%c[SmartOps] ✅ Product #' + id + ' removed from DynamoDB cart', 'color: #22c55e');
    }).catch(function (e) { 
        var msg = (e && e.message) ? e.message : 'Unknown error';
        console.error('Remove error:', msg); 
    });
}

function tog() { 
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.toggle('open'); 
    if (overlay) overlay.classList.toggle('open'); 
}

/* ══════════════════ LOGGING ══════════════════ */

// Helper to serialize Error objects for JSON.stringify
function serializeError(err) {
    if (err instanceof Error) {
        const obj = {
            name: err.name,
            message: err.message,
            stack: err.stack,
        };
        // Copy any other enumerable properties that might be on the error object
        for (let key in err) {
            if (Object.prototype.hasOwnProperty.call(err, key) && typeof err[key] !== 'function') {
                obj[key] = err[key];
            }
        }
        return obj;
    }
    // If it's an object but not an Error, try to make a shallow copy
    if (typeof err === 'object' && err !== null) {
        return { ...err };
    }
    // For primitives, return as is
    return err;
}

function slog(t, d) {
    var sessionId = (currentUser && currentUser.email) ? currentUser.email : 'anon';
    fetch(API + '/log', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: t, sessionId: sessionId, version: VER, data: d, timestamp: Date.now() })
    }).catch(function () { });
}

/* ── Error handlers ── */
window.onerror = function (m, u, l, c, e) { 
    var errorData = {
        message: m,
        url: u,
        line: l,
        col: c
    };

    // Serialize the error object if it exists, otherwise use the message
    if (e) {
        errorData.error = serializeError(e);
    } else {
        errorData.error = String(m || 'Unknown error');
    }
    
    slog('CRASH_ERROR', errorData); 
    return true; 
};

window.addEventListener('unhandledrejection', function (ev) { 
    var reason = ev.reason;
    var errorData = {};

    if (reason) {
        var serializedReason = serializeError(reason);
        errorData.reason = serializedReason;
        // Also extract message and stack for top-level visibility in logs
        errorData.message = serializedReason.message || String(reason) || 'Promise rejected';
        errorData.stack = serializedReason.stack || 'No stack trace available';
    } else {
        errorData.message = 'Promise rejected with no reason';
        errorData.stack = 'No stack trace';
    }
    
    slog('CRASH_ERROR', errorData); 
});

/* Enter key support for auth */
document.addEventListener('keydown', function (e) {
    var authModal = document.getElementById('auth-modal');
    if (e.key === 'Enter' && authModal && authModal.style.display !== 'none') {
        doAuth();
    }
});