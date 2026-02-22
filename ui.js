/* TechVault — UI Module */

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
