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
    currentUser = JSON.parse(localStorage.getItem('techvault_user') || 'null');
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

function initApp() {
    if (currentUser) {
        console.log('%c[SmartOps] User restored: ' + currentUser.name + ' (' + currentUser.email + ')', 'color: #22c55e');
        hideAuth();
        showUser();
        fetchCart();
    } else {
        console.log('%c[SmartOps] No user session — showing login', 'color: #fbbf24');
        showAuth();
    }

    renderProducts();
    startPolling();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
} else {
    initApp();
}

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
    var email = document.getElementById('auth-email');
    var password = document.getElementById('auth-pass');
    var name = document.getElementById('auth-name');
    var errEl = document.getElementById('auth-error');
    var btn = document.getElementById('auth-btn');
    
    var emailVal = email ? email.value.trim() : '';
    var passwordVal = password ? password.value : '';
    var nameVal = name ? name.value.trim() : '';

    if (!emailVal || !passwordVal) { 
        if (errEl) {
            errEl.textContent = 'Email and password required'; 
            errEl.style.display = 'block'; 
        }
        return; 
    }
    if (authMode === 'signup' && !nameVal) { 
        if (errEl) {
            errEl.textContent = 'Name is required'; 
            errEl.style.display = 'block'; 
        }
        return; 
    }

    if (errEl) errEl.style.display = 'none';
    if (btn) {
        btn.disabled = true;
        btn.textContent = authMode === 'login' ? 'Signing in...' : 'Creating account...';
    }

    var payload = authMode === 'signup'
        ? { action: 'signup', email: emailVal, password: passwordVal, name: nameVal }
        : { action: 'login', email: emailVal, password: passwordVal };

    console.log('%c[SmartOps] Auth: ' + authMode + ' for ' + emailVal, 'color: #fbbf24');

    fetch(API + '/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (!data.success) {
                if (errEl) {
                    errEl.textContent = data.error || 'Authentication failed';
                    errEl.style.display = 'block';
                }
                if (btn) {
                    btn.disabled = false;
                    btn.textContent = authMode === 'login' ? 'Sign In' : 'Sign Up';
                }
                return;
            }

            currentUser = data.user;
            localStorage.setItem('techvault_user', JSON.stringify(currentUser));
            console.log('%c[SmartOps] ✅ Logged in as: ' + currentUser.name + ' (' + currentUser.email + ')', 'color: #22c55e; font-weight: bold');

            hideAuth();
            showUser();
            fetchCart();
            if (btn) {
                btn.disabled = false;
                btn.textContent = authMode === 'login' ? 'Sign In' : 'Sign Up';
            }
        })
        .catch(function (e) {
            if (errEl) {
                errEl.textContent = 'Network error: ' + (e && e.message ? e.message : 'Unknown error');
                errEl.style.display = 'block';
            }
            if (btn) {
                btn.disabled = false;
                btn.textContent = authMode === 'login' ? 'Sign In' : 'Sign Up';
            }
        });
}

function logout() {
    if (currentUser && currentUser.email) {
        console.log('%c[SmartOps] User logged out: ' + currentUser.email, 'color: #fbbf24');
    }
    currentUser = null;
    cart = [];
    localStorage.removeItem('techvault_user');
    cartUI();
    var userBadge = document.getElementById('user-badge');
    var logoutBtn = document.getElementById('logout-btn');
    if (userBadge) userBadge.style.display = 'none';
    if (logoutBtn) logoutBtn.style.display = 'none';
    showAuth();
}

function showUser() {
    if (!currentUser) return;
    var badge = document.getElementById('user-badge');
    var logoutBtn = document.getElementById('logout-btn');
    var userEmail = document.getElementById('user-email');
    if (badge) {
        badge.textContent = currentUser.name || 'User';
        badge.style.display = 'inline-block';
    }
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    if (userEmail) userEmail.textContent = currentUser.email || '';
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
            if (data.success && data.items) {
                cart = data.items || [];
                cartUI();
                console.log('%c[SmartOps] Cart loaded: ' + cart.length + ' items from DynamoDB', 'color: #22c55e');
            }
        })
        .catch(function (e) {
            console.error('[SmartOps] Cart fetch error:', e && e.message ? e.message : e);
        });
}

function add(id) {
    if (!currentUser) { showAuth(); return; }
    var b = document.getElementById('btn-' + id);
    if (!b) return;
    if (b.disabled) return;
    b.disabled = true;
    b.textContent = 'Adding...';
    b.className = b.className.replace(' done', '').replace(' fail', '');

    console.log('%c[SmartOps] Adding product #' + id + ' to cart for ' + currentUser.email, 'color: #fbbf24');
    fetch(API + '/cart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', userId: currentUser.email, productId: id, version: VER })
    })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (!data.success) throw new Error(data.error || 'Unknown error');

            /* Update local cart state */
            if (!cart) cart = [];
            var c = cart.find(function (x) { return x.productId === id; });
            if (c) c.qty++; else cart.push({ productId: id, qty: 1 });
            cartUI();
            b.textContent = 'Added ✓';
            b.className = (id === 9 || id === 10 ? 'btn new-product done' : 'btn done');
            console.log('%c[SmartOps] ✅ Product #' + id + ' added successfully (stored in DynamoDB)', 'color: #22c55e; font-weight: bold');

            slog('CART_ADD_SUCCESS', { productId: id, userId: currentUser.email });
            setTimeout(function () { b.textContent = 'Add to Cart'; b.className = (id === 9 || id === 10 ? 'btn new-product' : 'btn'); b.disabled = false; }, 700);
        })
        .catch(function (e) {
            console.error('%c[SmartOps] ❌ Cart error: ' + (e && e.message ? e.message : 'Unknown error'), 'color: #ef4444');
            b.textContent = 'Failed';
            b.className = (id === 9 || id === 10 ? 'btn new-product fail' : 'btn fail');
            slog('CART_ADD_ERROR', { productId: id, error: e && e.message ? e.message : 'Unknown error' });
            setTimeout(function () { b.textContent = 'Add to Cart'; b.className = (id === 9 || id === 10 ? 'btn new-product' : 'btn'); b.disabled = false; }, 1000);
        });
}

/* ══════════════════ UI ══════════════════ */

function renderProducts() {
    var productsEl = document.getElementById('products');
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
    var verBadge = document.getElementById('ver-badge');
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
    var count = cart.reduce(function (s, c) { return s + (c.qty || 0); }, 0);
    if (countEl) countEl.textContent = count;
    
    if (!cartItemsEl) return;
    if (!cart.length) { 
        cartItemsEl.innerHTML = '<p class="empty">Cart is empty</p>'; 
        if (totalEl) totalEl.textContent = ''; 
        return; 
    }
    cartItemsEl.innerHTML = cart.map(function (c) {
        var p = PRODUCTS.find(function (x) { return x.id === c.productId; });
        if (!p) return '';
        return '<div class="ci"><span>' + p.name + ' x' + (c.qty || 0) + '</span><span>$' + (p.price * (c.qty || 0)) + '</span><button onclick="rm(' + c.productId + ')">×</button></div>';
    }).join('');
    var total = cart.reduce(function (s, c) { 
        var p = PRODUCTS.find(function (x) { return x.id === c.productId; }); 
        return s + (p ? p.price * (c.qty || 0) : 0); 
    }, 0);
    if (totalEl) totalEl.textContent = 'Total: $' + total;
}

function rm(id) {
    if (!currentUser) return;
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
    }).catch(function (e) { console.error('Remove error:', e && e.message ? e.message : e); });
}

function tog() { 
    var sidebar = document.getElementById('sidebar');
    var overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.toggle('open'); 
    if (overlay) overlay.classList.toggle('open'); 
}

/* ══════════════════ LOGGING ══════════════════ */

function slog(t, d) {
    var payload = { 
        eventType: t, 
        sessionId: currentUser && currentUser.email ? currentUser.email : 'anon', 
        version: VER, 
        data: d || {}, 
        timestamp: Date.now() 
    };
    fetch(API + '/log', {
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    }).catch(function () { });
}

/* ══════════════════ DASHBOARD POLLING ══════════════════ */

function startPolling() {
    /* Get initial decision count */
    checkDashboard();
    setInterval(checkDashboard, 5000);
}

function checkDashboard() {
    fetch(DASH_API + '/dashboard/decisions')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (!data || typeof data !== 'object') return;
            var total = data.stats && data.stats.total ? data.stats.total : 0;
            if (total > lastDecisionCount && data.decisions && Array.isArray(data.decisions) && data.decisions.length > 0) {
                var latest = data.decisions[0];
                if (!latest || typeof latest !== 'object') return;
                console.log('%c[SmartOps] ══════════════════════════════════════════', 'color: #667eea; font-weight: bold');
                console.log('%c[SmartOps] 🤖 AI DECISION DETECTED', 'color: #667eea; font-weight: bold; font-size: 16px');
                console.log('%c[SmartOps] ──────────────────────────────────────────', 'color: #667eea');
                console.log('%c[SmartOps] Action: ' + (latest.action || 'N/A'), 'color: #22c55e; font-weight: bold; font-size: 14px');
                console.log('%c[SmartOps] Scenario: ' + (latest.scenario || 'N/A'), 'color: #60a5fa');
                console.log('%c[SmartOps] Reasoning: ' + (latest.reasoning || 'N/A'), 'color: #d4d4d4');
                console.log('%c[SmartOps] Confidence: ' + ((latest.confidence || 0) * 100).toFixed(0) + '%', 'color: #fbbf24');
                if (latest.executionDetails) {
                    console.log('%c[SmartOps] ✅ Result: ' + latest.executionDetails, 'color: #22c55e; font-weight: bold');
                }
                if (latest.thinkingChain && typeof latest.thinkingChain === 'object') {
                    console.log('%c[SmartOps] 🧠 AI Thinking Chain:', 'color: #a78bfa; font-weight: bold');
                    if (latest.thinkingChain.observations) console.log('%c  📋 Observations: ' + latest.thinkingChain.observations, 'color: #a78bfa');
                    if (latest.thinkingChain.analysis) console.log('%c  🔬 Analysis: ' + latest.thinkingChain.analysis, 'color: #a78bfa');
                    if (latest.thinkingChain.hypothesis) console.log('%c  💡 Hypothesis: ' + latest.thinkingChain.hypothesis, 'color: #a78bfa');
                    if (latest.thinkingChain.riskAssessment) console.log('%c  ⚠️ Risk: ' + latest.thinkingChain.riskAssessment, 'color: #f97316');
                }
                if (latest.actionPlan && latest.actionPlan.steps && Array.isArray(latest.actionPlan.steps)) {
                    console.log('%c[SmartOps] 📋 Action Plan:', 'color: #60a5fa; font-weight: bold');
                    latest.actionPlan.steps.forEach(function (s, i) { console.log('%c  ' + (i + 1) + '. ' + s, 'color: #60a5fa'); });
                }
                console.log('%c[SmartOps] ══════════════════════════════════════════', 'color: #667eea; font-weight: bold');

                if (latest.action === 'SELF_HEAL' && latest.executionStatus === 'EXECUTED') {
                    console.log('%c[SmartOps] 🎉 BUG FIXED! Refresh the page and try adding Smart Ring Pro again — it should work now!', 'color: #22c55e; font-weight: bold; font-size: 16px');
                    var co = document.getElementById('crash-overlay');
                    if (co) co.remove();
                }
                lastDecisionCount = total;
            }
        })
        .catch(function () { });
}

/* ── Error handlers ── */
window.onerror = function (m, u, l, c, e) { 
    var errorDetails = { 
        message: m || 'Unknown error', 
        url: u || '', 
        line: l || 0, 
        col: c || 0, 
        stack: (e && e.stack) ? e.stack : 'No stack trace' 
    };
    slog('CRASH_ERROR', errorDetails); 
    return true; 
};
window.addEventListener('unhandledrejection', function (ev) { 
    var reason = ev.reason || {};
    slog('CRASH_ERROR', { 
        message: reason.message || 'Promise rejected', 
        stack: reason.stack || 'No stack trace' 
    }); 
});

/* Enter key support for auth */
document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        var authModal = document.getElementById('auth-modal');
        if (authModal && authModal.style.display !== 'none') {
            doAuth();
        }
    }
});