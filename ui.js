/* TechVault — UI Module */

function renderProducts() {
    // Ensure PRODUCTS is an array before attempting to map over it.
    // If PRODUCTS is undefined or not an array, use an empty array to prevent crashes.
    const productsToRender = Array.isArray(PRODUCTS) ? PRODUCTS : [];

    const productsContainer = document.getElementById('products');
    if (!productsContainer) {
        console.error("[ui.js] Element with ID 'products' not found. Cannot render products.");
        return; // Prevent further errors if container is missing
    }

    productsContainer.innerHTML = productsToRender.map(function (p) {
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
    if (verBadge) { // Check if element exists before accessing its properties
        verBadge.textContent = 'v2 New Product';
        verBadge.style.background = '#1a1a2e';
        verBadge.style.color = '#a78bfa';
        verBadge.style.borderColor = '#2d2a4a';
    } else {
        console.warn("[ui.js] Element with ID 'ver-badge' not found.");
    }
}

function cartUI() {
    // Ensure cart is an array before attempting to reduce or access length.
    const currentCart = Array.isArray(cart) ? cart : [];

    const countEl = document.getElementById('count');
    if (countEl) {
        var count = currentCart.reduce(function (s, c) { return s + c.qty; }, 0);
        countEl.textContent = count;
    } else {
        console.warn("[ui.js] Element with ID 'count' not found.");
    }

    var el = document.getElementById('cart-items');
    if (!el) {
        console.error("[ui.js] Element with ID 'cart-items' not found. Cannot render cart items.");
        return; // Cannot render cart items if container is missing
    }

    const totalEl = document.getElementById('total');

    if (!currentCart.length) {
        el.innerHTML = '<p class="empty">Cart is empty</p>';
        if (totalEl) {
            totalEl.textContent = '';
        } else {
            console.warn("[ui.js] Element with ID 'total' not found.");
        }
        return;
    }

    el.innerHTML = currentCart.map(function (c) {
        // PRODUCTS is also used here, so ensure it's an array.
        const productsData = Array.isArray(PRODUCTS) ? PRODUCTS : [];
        var p = productsData.find(function (x) { return x.id === c.productId; });
        if (!p) return ''; // If product not found, return empty string to avoid breaking layout
        return '<div class="ci"><span>' + p.name + ' x' + c.qty + '</span><span>$' + (p.price * c.qty) + '</span><button onclick="rm(' + c.productId + ')">×</button></div>';
    }).join('');

    var total = currentCart.reduce(function (s, c) {
        const productsData = Array.isArray(PRODUCTS) ? PRODUCTS : [];
        var p = productsData.find(function (x) { return x.id === c.productId; });
        return s + (p ? p.price * c.qty : 0);
    }, 0);

    if (totalEl) {
        totalEl.textContent = 'Total: $' + total;
    } else {
        console.warn("[ui.js] Element with ID 'total' not found.");
    }
}

function rm(id) {
    // Check if currentUser and API are defined before making a fetch request.
    if (!currentUser || !currentUser.email) {
        console.error('[SmartOps] currentUser or currentUser.email is undefined. Cannot remove product.');
        return;
    }
    if (!API) {
        console.error('[SmartOps] API is undefined. Cannot remove product.');
        return;
    }

    console.log('%c[SmartOps] Removing product #' + id + ' from cart...', 'color: #fbbf24');
    fetch(API + '/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', userId: currentUser.email, productId: id })
    }).then(function () {
        // Ensure cart is an array before filtering.
        // If cart was undefined, initialize it as an empty array.
        if (Array.isArray(cart)) {
            cart = cart.filter(function (c) { return c.productId !== id; });
        } else {
            cart = [];
        }
        cartUI();
        console.log('%c[SmartOps] ✅ Product #' + id + ' removed from DynamoDB cart', 'color: #22c55e');
    }).catch(function (e) { console.error('Remove error:', e); });
}

function tog() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    if (sidebar) { // Check if element exists
        sidebar.classList.toggle('open');
    } else {
        console.warn("[ui.js] Element with ID 'sidebar' not found.");
    }
    if (overlay) { // Check if element exists
        overlay.classList.toggle('open');
    } else {
        console.warn("[ui.js] Element with ID 'overlay' not found.");
    }
}