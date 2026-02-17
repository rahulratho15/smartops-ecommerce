/* TechVault E-Commerce - SmartOps Monitored */
var API = 'https://kn6pfzv6b4.execute-api.us-east-1.amazonaws.com/prod';
var DASH_API = 'https://5imr89vtpi.execute-api.us-east-1.amazonaws.com/prod';
var VER = 'v2';
var SID = localStorage.getItem('techvault_sid') || ('s-' + Math.random().toString(36).substr(2, 8));
localStorage.setItem('techvault_sid', SID);
var PRODUCTS = [
    { id: 1, name: 'MacBook Pro 16"', price: 1299, img: 'https://picsum.photos/seed/mbp16/300/200', cat: 'Laptops' },
    { id: 2, name: 'iPhone 15 Pro', price: 799, img: 'https://picsum.photos/seed/ip15p/300/200', cat: 'Phones' },
    { id: 3, name: 'Sony WH-1000XM5', price: 199, img: 'https://picsum.photos/seed/sxm5h/300/200', cat: 'Audio' },
    { id: 4, name: 'Apple Watch Ultra', price: 299, img: 'https://picsum.photos/seed/awu2x/300/200', cat: 'Wearables' },
    { id: 5, name: 'iPad Air M2', price: 499, img: 'https://picsum.photos/seed/ipam2/300/200', cat: 'Tablets' },
    { id: 6, name: 'AirPods Pro 2', price: 179, img: 'https://picsum.photos/seed/airp2/300/200', cat: 'Audio' },
    { id: 7, name: 'Galaxy S24 Ultra', price: 699, img: 'https://picsum.photos/seed/gs24u/300/200', cat: 'Phones' },
    { id: 8, name: 'Bose QC Ultra', price: 249, img: 'https://picsum.photos/seed/bqcul/300/200', cat: 'Audio' },
    { id: 9, name: 'Gaming Keyboard RGB', price: 149, img: 'https://picsum.photos/seed/gkrgb/300/200', cat: 'Peripherals' }
];

/* ── Cart persistence via localStorage ── */
var cart = JSON.parse(localStorage.getItem('techvault_cart') || '[]');
function saveCart() { localStorage.setItem('techvault_cart', JSON.stringify(cart)); }

document.getElementById('sid').textContent = SID;
document.getElementById('ver-badge').textContent = 'v2 New Product';
document.getElementById('ver-badge').style.background = '#1a1a2e';
document.getElementById('ver-badge').style.color = '#a78bfa';
document.getElementById('ver-badge').style.borderColor = '#2d2a4a';

console.log('%c[SmartOps] TechVault V2 loaded — Session: ' + SID, 'color: #a78bfa; font-weight: bold');
console.log('%c[SmartOps] 9 products loaded (NEW: Gaming Keyboard RGB)', 'color: #60a5fa');
console.log('%c[SmartOps] Cart restored from storage: ' + cart.length + ' items', 'color: #60a5fa');

function render() {
    document.getElementById('products').innerHTML = PRODUCTS.map(function (p) {
        return '<div class="card" data-id="' + p.id + '">' +
            '<img src="' + p.img + '" alt="' + p.name + '" loading="lazy">' +
            '<div class="info"><span class="cat">' + p.cat + (p.id === 9 ? ' • NEW' : '') + '</span>' +
            '<h3>' + p.name + '</h3><p class="price">$' + p.price + '</p>' +
            '<button class="btn' + (p.id === 9 ? ' new-product' : '') + '" id="btn-' + p.id + '" onclick="add(' + p.id + ')">Add to Cart</button>' +
            '</div></div>';
    }).join('');
}

function add(id) {
    var b = document.getElementById('btn-' + id);
    if (b.disabled) return;
    b.disabled = true;
    b.textContent = 'Adding...';
    b.className = b.className.replace(' done', '').replace(' fail', '');
    console.log('%c[SmartOps] Adding product ' + id + ' to cart...', 'color: #fbbf24');

    fetch(API + '/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: SID, productId: id, version: VER })
    })
        .then(function (r) { return r.json(); })
        .then(function (data) {
            /* Check for backend bug signal */
            if (data.bugSignal) {
                console.error('%c[SmartOps] ❌ BUG DETECTED: Backend returned PRODUCT_CONFIG_ERROR for product ' + id, 'color: #ef4444; font-weight: bold; font-size: 14px');
                console.error('%c[SmartOps] Error: ' + data.error + ' — ' + data.message, 'color: #ef4444');
                console.log('%c[SmartOps] 📝 Logging error to SmartOps monitoring...', 'color: #f97316');

                slog('CART_BUTTON_BROKEN', { productId: id, error: data.error, message: data.message });

                b.textContent = 'Error!';
                b.className = (id === 9 ? 'btn new-product fail' : 'btn fail');

                /* Show crash overlay after brief delay */
                setTimeout(function () {
                    showCrashOverlay(id, data.error);
                }, 600);
                return;
            }

            if (!data.success) {
                throw new Error(data.error || 'Unknown error');
            }

            /* Success — add to local cart */
            var c = cart.find(function (x) { return x.id === id; });
            if (c) c.qty++; else cart.push({ id: id, qty: 1 });
            saveCart();
            cartUI();
            b.textContent = 'Added ✓';
            b.className = (id === 9 ? 'btn new-product done' : 'btn done');
            console.log('%c[SmartOps] ✅ Product ' + id + ' added to cart successfully', 'color: #22c55e; font-weight: bold');
            slog('CART_ADD_SUCCESS', { productId: id });
            setTimeout(function () {
                b.textContent = 'Add to Cart';
                b.className = (id === 9 ? 'btn new-product' : 'btn');
                b.disabled = false;
            }, 700);
        })
        .catch(function (e) {
            console.error('%c[SmartOps] ❌ Cart API error: ' + e.message, 'color: #ef4444');
            b.textContent = 'Failed';
            b.className = (id === 9 ? 'btn new-product fail' : 'btn fail');
            slog('CART_ADD_ERROR', { productId: id, error: e.message });
            setTimeout(function () { b.textContent = 'Add to Cart'; b.className = (id === 9 ? 'btn new-product' : 'btn'); b.disabled = false; }, 1000);
        });
}

/* ── Crash Overlay ── */
function showCrashOverlay(productId, errorCode) {
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
    console.log('%c[SmartOps] 🔍 SmartOps Monitor will detect this in ~60 seconds...', 'color: #f97316');
}

function cartUI() {
    document.getElementById('count').textContent = cart.reduce(function (s, c) { return s + c.qty; }, 0);
    var el = document.getElementById('cart-items');
    if (!cart.length) { el.innerHTML = '<p class="empty">Cart is empty</p>'; document.getElementById('total').textContent = ''; return; }
    el.innerHTML = cart.map(function (c) {
        var p = PRODUCTS.find(function (x) { return x.id === c.id; });
        return '<div class="ci"><span>' + p.name + ' x' + c.qty + '</span><span>$' + (p.price * c.qty) + '</span><button onclick="rm(' + c.id + ')">x</button></div>';
    }).join('');
    var total = cart.reduce(function (s, c) { return s + PRODUCTS.find(function (x) { return x.id === c.id; }).price * c.qty; }, 0);
    document.getElementById('total').textContent = 'Total: $' + total;
}

function rm(id) { cart = cart.filter(function (c) { return c.id !== id; }); saveCart(); cartUI(); }
function tog() { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('overlay').classList.toggle('open'); }

function slog(t, d) {
    fetch(API + '/log', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: t, sessionId: SID, version: VER, data: d, timestamp: Date.now() })
    }).catch(function () { });
}

/* ── Poll Dashboard for AI Decisions ── */
var lastDecisionCount = 0;
var pollInterval = null;

function pollDashboard() {
    fetch(DASH_API + '/dashboard/decisions')
        .then(function (r) { return r.json(); })
        .then(function (data) {
            var total = data.stats ? data.stats.total : 0;
            if (total > lastDecisionCount && data.decisions && data.decisions.length > 0) {
                var latest = data.decisions[0];
                console.log('%c[SmartOps] ═══════════════════════════════════════', 'color: #667eea; font-weight: bold');
                console.log('%c[SmartOps] 🤖 AI DECISION DETECTED', 'color: #667eea; font-weight: bold; font-size: 16px');
                console.log('%c[SmartOps] Action: ' + latest.action, 'color: #22c55e; font-weight: bold; font-size: 14px');
                console.log('%c[SmartOps] Scenario: ' + latest.scenario, 'color: #60a5fa');
                console.log('%c[SmartOps] Reasoning: ' + (latest.reasoning || 'N/A'), 'color: #d4d4d4');
                console.log('%c[SmartOps] Confidence: ' + ((latest.confidence || 0) * 100).toFixed(0) + '%', 'color: #fbbf24');
                if (latest.executionDetails) {
                    console.log('%c[SmartOps] Result: ' + latest.executionDetails, 'color: #22c55e; font-weight: bold');
                }
                if (latest.thinkingChain) {
                    console.log('%c[SmartOps] AI Thinking:', 'color: #a78bfa; font-weight: bold');
                    console.log('%c  Observations: ' + (latest.thinkingChain.observations || ''), 'color: #a78bfa');
                    console.log('%c  Analysis: ' + (latest.thinkingChain.analysis || ''), 'color: #a78bfa');
                    console.log('%c  Hypothesis: ' + (latest.thinkingChain.hypothesis || ''), 'color: #a78bfa');
                }
                console.log('%c[SmartOps] ═══════════════════════════════════════', 'color: #667eea; font-weight: bold');

                if (latest.action === 'SELF_HEAL' && latest.executionStatus === 'EXECUTED') {
                    console.log('%c[SmartOps] ✅ BUG FIXED! Try adding the product again.', 'color: #22c55e; font-weight: bold; font-size: 16px');
                    /* Remove crash overlay if present */
                    var co = document.getElementById('crash-overlay');
                    if (co) co.remove();
                }

                lastDecisionCount = total;
            }
        })
        .catch(function () { /* silent */ });
}

/* Start polling every 5 seconds */
pollInterval = setInterval(pollDashboard, 5000);
/* Get initial count */
pollDashboard();

window.onerror = function (m, u, l) { slog('CRASH_ERROR', { message: m, url: u, line: l }); };
window.addEventListener('unhandledrejection', function (e) { slog('CRASH_ERROR', { message: e.reason && e.reason.message || 'Promise rejected' }); });

slog('SESSION_START', { userAgent: navigator.userAgent });
render();
cartUI();
