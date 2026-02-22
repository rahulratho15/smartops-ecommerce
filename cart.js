/* TechVault — Cart Module (Server-Side) */

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
    // The line below was a deliberate crash for testing purposes.
    // It is causing uncaught exceptions in production, leading to CRASH_ERROR logs.
    // Removing this line to prevent unexpected application crashes.
    // if (id === 9) { throw new Error('crash'); } 
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