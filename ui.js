/* TechVault — UI Module */

// Ensure global dependencies are declared to prevent ReferenceErrors
// and provide safe defaults if they are not yet initialized by other modules.
// This pattern uses `typeof` to safely check if a variable is declared without
// throwing a ReferenceError, then provides a default value if it's not.
var PRODUCTS = typeof PRODUCTS !== 'undefined' ? PRODUCTS : [];
var cart = typeof cart !== 'undefined' ? cart : [];
var currentUser = typeof currentUser !== 'undefined' ? currentUser : null;
var API = typeof API !== 'undefined' ? API : '';

function renderProducts() {
    const productsContainer = document.getElementById('products');
    if (!productsContainer) {
        console.warn("Element with ID 'products' not found. Cannot render products.");
        return;
    }

    // Check if PRODUCTS is an array before attempting to map over it.
    // This prevents TypeError if PRODUCTS is defined but not an array (e.g., null, object).
    if (!Array.isArray(PRODUCTS)) {
        console.error("PRODUCTS is not an array. Cannot render products.");
        productsContainer.innerHTML = '<p class="error">Failed to load products. Please try again later.</p>';
        return;
    }

    productsContainer.innerHTML = PRODUCTS.map(function (p) {
        var isNew = p.id === 9 || p.id === 10;
        return '<div class="card' + (isNew ? ' new-card' : '') + '" data-id="' + p.id + '">' +
            '<img src="' + p.img + '" alt="' + p.name + '" loading="lazy">' +
            (isNew ? '<span class="new-tag">NEW</span>' : '') +
            '<div class="info"><span class="cat">' + p.cat + '</span>' +
            '<h3>' + p.name + '</h3><p class="price">$' + p.price + '</p>' +
            '<button class="btn' + (isNew ? ' new-product' : '') + '" id="btn-' + p.id + '" onclick="add(' + p.id + ')">Add to Cart</button>' +
            '</div></div>';
    }).join('');

    const verBadge = document.getElementById('ver-badge');
    if (verBadge) {
        verBadge.textContent = 'v2 New Product';
        verBadge.style.background = '#1a1a2e';
        verBadge.style.color = '#a78bfa';
        verBadge.style.borderColor = '#2d2a4a';
    }
}

function cartUI() {
    const countEl = document.getElementById('count');
    const el = document.getElementById('cart-items');
    const totalEl = document.getElementById('total');

    // Check if cart is an array before attempting to reduce or access length.
    if (!Array.isArray(cart)) {
        console.error("Cart is not an array. Cannot render cart UI.");
        if (countEl) countEl.textContent = '0';
        if (el) el.innerHTML = '<p class="error">Failed to load cart.</p>';
        if (totalEl) totalEl.textContent = '';
        return;
    }

    var count = cart.reduce(function (s, c) { return s + c.qty; }, 0);
    if (countEl) countEl.textContent = count;

    if (!el) {
        console.warn("Element with ID 'cart-items' not found. Cannot render cart items.");
        return;
    }

    if (!cart.length) {
        el.innerHTML = '<p class="empty">Cart is empty</p>';
        if (totalEl) totalEl.textContent = '';
        return;
    }

    // PRODUCTS is also used here, ensure it's an array before accessing its properties
    if (!Array.isArray(PRODUCTS)) {
        console.error("PRODUCTS is not an array. Cannot display product details in cart.");
        el.innerHTML = '<p class="error">Failed to load product details for cart items.</p>';
        if (totalEl) totalEl.textContent = '';
        return;
    }

    el.innerHTML = cart.map(function (c) {
        var p = PRODUCTS.find(function (x) { return x.id === c.productId; });
        if (!p) return ''; // If product details are missing, skip this item
        return '<div class="ci"><span>' + p.name + ' x' + c.qty + '</span><span>$' + (p.price * c.qty) + '</span><button onclick="rm(' + c.productId + ')">×</button></div>';
    }).join('');

    var total = cart.reduce(function (s, c) {
        var p = PRODUCTS.find(function (x) { return x.id === c.productId; });
        return s + (p ? p.price * c.qty : 0);
    }, 0);
    if (totalEl) totalEl.textContent = 'Total: $' + total;
}

function rm(id) {
    // Ensure currentUser and its email property exist before making an API call
    if (!currentUser || !currentUser.email) {
        console.warn('%c[SmartOps] Cannot remove product: currentUser or currentUser.email is not defined.', 'color: #fbbf24');
        return;
    }
    // Ensure API endpoint is defined before making a fetch request
    if (!API) {
        console.error('%c[SmartOps] Cannot remove product: API endpoint is not defined.', 'color: #dc2626');
        return;
    }

    console.log('%c[SmartOps] Removing product #' + id + ' from cart...', 'color: #fbbf24');
    fetch(API + '/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', userId: currentUser.email, productId: id })
    }).then(function () {
        // Ensure cart is an array before filtering to prevent TypeError
        if (Array.isArray(cart)) {
            cart = cart.filter(function (c) { return c.productId !== id; });
        } else {
            console.warn("Cart is not an array, re-initializing to empty after removal attempt.");
            cart = []; // Reset cart to an empty array to prevent further errors
        }
        cartUI();
        console.log('%c[SmartOps] ✅ Product #' + id + ' removed from DynamoDB cart', 'color: #22c55e');
    }).catch(function (e) { console.error('Remove error:', e); });
}

function tog() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar) sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('open');
}