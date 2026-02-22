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
var currentUser = JSON.parse(localStorage.getItem('techvault_user') || 'null');
var cart = [];
var authMode = 'login'; /* login or signup */
var lastDecisionCount = 0;

/* ── Init ── */
console.log('%c[SmartOps] TechVault V2 loaded', 'color: #a78bfa; font-weight: bold; font-size: 14px');
console.log('%c[SmartOps] 10 products (NEW: Smart Ring Pro #10)', 'color: #60a5fa');

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

/* ══════════════════ AUTH ══════════════════ */

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

    fetch(API + '/cart/add', {
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
            showUser();
            fetchCart();
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
    console.log('%c[SmartOps] User logged out: ' + currentUser.email, 'color: #fbbf24');
    currentUser = null;
    cart = [];
    localStorage.removeItem('techvault_user');
    cartUI();
    document.getElementById('user-badge').style.display = 'none';
    document.getElementById('logout-btn').style.display = 'none';
    showAuth();
}

function showUser() {
    var badge = document.getElementById('user-badge');
    badge.textContent = currentUser.name;
    badge.style.display = 'inline-block';
    document.getElementById('logout-btn').style.display = 'inline-block';
    document.getElementById('user-email').textContent = currentUser.email;
}

/* ══════════════════ CART (Server-Side) ══════════════════ */

function fetchCart() {
    if (!currentUser) return;
    console.log('%c[SmartOps] Fetching cart from DynamoDB for ' + currentUser.email + '...', 'color: #60a5fa');

    fetch(API + '/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'getCart', userId: currentUser.email })
    })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (data.success && data.items) {
                cart = data.items;
                cartUI();
                console.log('%c[SmartOps] Cart loaded: ' + cart.length + ' items from DynamoDB', 'color: #22c55e');
            }
        })
        .catch(function (e) {
            console.error('[SmartOps] Cart fetch error:', e.message);
        });
}

function add(id) {
    if (!currentUser) { showAuth(); return; }
    var b = document.getElementById('btn-' + id);
    if (b.disabled) return;
    b.disabled = true;
    b.textContent = 'Adding...';
    b.className = b.className.replace(' done', '').replace(' fail', '');

    console.log('%c[SmartOps] Adding product #' + id + ' to cart for ' + currentUser.email, 'color: #fbbf24');
    fetch(API + '/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'add', userId: currentUser.email, productId: id, version: VER })
    })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            if (data.bugSignal) {
                console.error('%c[SmartOps] ❌ BUG DETECTED: Backend returned PRODUCT_CONFIG_ERROR for product #' + id, 'color: #ef4444; font-weight: bold; font-size: 14px');
                console.error('%c[SmartOps] Error: ' + data.error + ' — ' + data.message, 'color: #ef4444');
                console.log('%c[SmartOps] 📝 Logging error to SmartOps monitoring system...', 'color: #f97316');

                slog('CART_BUTTON_BROKEN', { productId: id, error: data.error, message: data.message, userId: currentUser.email });

                b.textContent = 'Error!';
                b.className = (id === 9 || id === 10 ? 'btn new-product fail' : 'btn fail');

                setTimeout(function () { showCrashOverlay(id, data.error); }, 500);
                return;
            }

            if (!data.success) throw new Error(data.error || 'Unknown error');

            /* Update local cart state */
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
            console.error('%c[SmartOps] ❌ Cart error: ' + e.message, 'color: #ef4444');
            b.textContent = 'Failed';
            b.className = (id === 9 || id === 10 ? 'btn new-product fail' : 'btn fail');
            slog('CART_ADD_ERROR', { productId: id, error: e.message });
            setTimeout(function () { b.textContent = 'Add to Cart'; b.className = (id === 9 || id === 10 ? 'btn new-product' : 'btn'); b.disabled = false; }, 1000);
        });
}

/* ══════════════════ CRASH OVERLAY ══════════════════ */

function showCrashOverlay(productId, errorCode) {
    var existing = document.getElementById('crash-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'crash-overlay';
    overlay.innerHTML = '<div class="crash-box">' +
        '<div class="crash-icon">⚠️</div>' +
        '<h2>Page Error</h2>' +
        '<p>Something went wrong while processing your request.</p>' +
        '<p class="crash-code">Error: ' + errorCode + ' (Product #' + productId + ')</p>' +
        '<p class="crash-sub">This error has been reported to SmartOps AI for analysis.</p>' +
        '<button onclick="location.reload()" class="crash-btn">Refresh Page</button>' +
        '</div>';
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.85);z-index:100;display:flex;align-items:center;justify-content:center;animation:fadeIn .3s';
    document.body.appendChild(overlay);

    console.log('%c[SmartOps] 🔴 Crash overlay shown — waiting for user to refresh', 'color: #ef4444; font-weight: bold');
    console.log('%c[SmartOps] 🔍 SmartOps Monitor will detect CART_BUTTON_BROKEN events and invoke AI Brain...', 'color: #f97316');
    console.log('%c[SmartOps] 💡 Your cart items are safe in DynamoDB — they will persist after refresh!', 'color: #60a5fa');
}

/* ══════════════════ UI ══════════════════ */

function renderProducts() {
    document.getElementById('products').innerHTML = PRODUCTS.map(function (p) {
        var isNew = p.id === 9 || p.id === 10;
        return '<div class="card' + (isNew ? ' new-card' : '') + '" data-id="' + p.id + '">' +
            '<img src="' + p.img + '" alt="' + p.name + '" loading="lazy">' +
            (isNew ? '<span class="new-tag">NEW</span>' : '') +
            '<div class="info"><span class="cat">' + p.cat + '</span>' +
            '<h3>' + p.name + '</h3><p class="price">$' + p.price + '</p>' +
            '<button class="btn' + (isNew ? ' new-product' : '') + '" id="btn-' + p.id + '" onclick="add(' + p.id + ')">Add to Cart</button>' +
            '</div></div>';
    }).join('');
    document.getElementById('ver-badge').textContent = 'v2 New Product';
    document.getElementById('ver-badge').style.background = '#1a1a2e';
    document.getElementById('ver-badge').style.color = '#a78bfa';
    document.getElementById('ver-badge').style.borderColor = '#2d2a4a';
}

function cartUI() {
    var count = cart.reduce(function (s, c) { return s + c.qty; }, 0);
    document.getElementById('count').textContent = count;
    var el = document.getElementById('cart-items');
    if (!cart.length) { el.innerHTML = '<p class="empty">Cart is empty</p>'; document.getElementById('total').textContent = ''; return; }
    el.innerHTML = cart.map(function (c) {
        var p = PRODUCTS.find(function (x) { return x.id === c.productId; });
        if (!p) return '';
        return '<div class="ci"><span>' + p.name + ' x' + c.qty + '</span><span>$' + (p.price * c.qty) + '</span><button onclick="rm(' + c.productId + ')">×</button></div>';
    }).join('');
    var total = cart.reduce(function (s, c) { var p = PRODUCTS.find(function (x) { return x.id === c.productId; }); return s + (p ? p.price * c.qty : 0); }, 0);
    document.getElementById('total').textContent = 'Total: $' + total;
}

function rm(id) {
    if (!currentUser) return;
    console.log('%c[SmartOps] Removing product #' + id + ' from cart...', 'color: #fbbf24');
    fetch(API + '/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', userId: currentUser.email, productId: id })
    }).then(function () {
        cart = cart.filter(function (c) { return c.productId !== id; });
        cartUI();
        console.log('%c[SmartOps] ✅ Product #' + id + ' removed from DynamoDB cart', 'color: #22c55e');
    }).catch(function (e) { console.error('Remove error:', e); });
}

function tog() { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('overlay').classList.toggle('open'); }

/* ══════════════════ LOGGING ══════════════════ */

function slog(t, d) {
    fetch(API + '/log', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: t, sessionId: currentUser ? currentUser.email : 'anon', version: VER, data: d, timestamp: Date.now() })
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
            var total = data.stats ? data.stats.total : 0;
            if (total > lastDecisionCount && data.decisions && data.decisions.length > 0) {
                var latest = data.decisions[0];
                console.log('%c[SmartOps] ══════════════════════════════════════════', 'color: #667eea; font-weight: bold');
                console.log('%c[SmartOps] 🤖 AI DECISION DETECTED', 'color: #667eea; font-weight: bold; font-size: 16px');
                console.log('%c[SmartOps] ──────────────────────────────────────────', 'color: #667eea');
                console.log('%c[SmartOps] Action: ' + latest.action, 'color: #22c55e; font-weight: bold; font-size: 14px');
                console.log('%c[SmartOps] Scenario: ' + latest.scenario, 'color: #60a5fa');
                console.log('%c[SmartOps] Reasoning: ' + (latest.reasoning || 'N/A'), 'color: #d4d4d4');
                console.log('%c[SmartOps] Confidence: ' + ((latest.confidence || 0) * 100).toFixed(0) + '%', 'color: #fbbf24');
                if (latest.executionDetails) {
                    console.log('%c[SmartOps] ✅ Result: ' + latest.executionDetails, 'color: #22c55e; font-weight: bold');
                }
                if (latest.thinkingChain) {
                    console.log('%c[SmartOps] 🧠 AI Thinking Chain:', 'color: #a78bfa; font-weight: bold');
                    if (latest.thinkingChain.observations) console.log('%c  📋 Observations: ' + latest.thinkingChain.observations, 'color: #a78bfa');
                    if (latest.thinkingChain.analysis) console.log('%c  🔬 Analysis: ' + latest.thinkingChain.analysis, 'color: #a78bfa');
                    if (latest.thinkingChain.hypothesis) console.log('%c  💡 Hypothesis: ' + latest.thinkingChain.hypothesis, 'color: #a78bfa');
                    if (latest.thinkingChain.riskAssessment) console.log('%c  ⚠️ Risk: ' + latest.thinkingChain.riskAssessment, 'color: #f97316');
                }
                if (latest.actionPlan && latest.actionPlan.steps) {
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
window.onerror = function (m, u, l) { slog('CRASH_ERROR', { message: m, url: u, line: l }); };
window.addEventListener('unhandledrejection', function (e) { slog('CRASH_ERROR', { message: e.reason && e.reason.message || 'Promise rejected' }); });

/* Enter key support for auth */
document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && document.getElementById('auth-modal').style.display !== 'none') {
        doAuth();
    }
});