/* TechVault E-Commerce - SmartOps Monitored */
var API = 'https://kn6pfzv6b4.execute-api.us-east-1.amazonaws.com/prod';
var VER = 'v1';
var SID = 's-' + Math.random().toString(36).substr(2, 8);
var PRODUCTS = [
    { id: 1, name: 'MacBook Pro 16"', price: 1299, img: 'https://picsum.photos/seed/mbp16/300/200', cat: 'Laptops' },
    { id: 2, name: 'iPhone 15 Pro', price: 799, img: 'https://picsum.photos/seed/ip15p/300/200', cat: 'Phones' },
    { id: 3, name: 'Sony WH-1000XM5', price: 199, img: 'https://picsum.photos/seed/sxm5h/300/200', cat: 'Audio' },
    { id: 4, name: 'Apple Watch Ultra', price: 299, img: 'https://picsum.photos/seed/awu2x/300/200', cat: 'Wearables' },
    { id: 5, name: 'iPad Air M2', price: 499, img: 'https://picsum.photos/seed/ipam2/300/200', cat: 'Tablets' },
    { id: 6, name: 'AirPods Pro 2', price: 179, img: 'https://picsum.photos/seed/airp2/300/200', cat: 'Audio' },
    { id: 7, name: 'Galaxy S24 Ultra', price: 699, img: 'https://picsum.photos/seed/gs24u/300/200', cat: 'Phones' },
    { id: 8, name: 'Bose QC Ultra', price: 249, img: 'https://picsum.photos/seed/bqcul/300/200', cat: 'Audio' }
];
var cart = [];

document.getElementById('sid').textContent = SID;

function render() {
    document.getElementById('products').innerHTML = PRODUCTS.map(function (p) {
        return '<div class="card" data-id="' + p.id + '">' +
            '<img src="' + p.img + '" alt="' + p.name + '" loading="lazy">' +
            '<div class="info"><span class="cat">' + p.cat + '</span>' +
            '<h3>' + p.name + '</h3><p class="price">$' + p.price + '</p>' +
            '<button class="btn" id="btn-' + p.id + '" onclick="add(' + p.id + ')">Add to Cart</button>' +
            '</div></div>';
    }).join('');
}

function add(id) {
    var b = document.getElementById('btn-' + id);
    if (b.disabled) return;
    b.disabled = true;
    b.textContent = 'Adding...';
    b.className = 'btn';
    fetch(API + '/cart/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: SID, productId: id, version: VER })
    })
        .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
        .then(function () {
            var c = cart.find(function (x) { return x.id === id; });
            if (c) c.qty++; else cart.push({ id: id, qty: 1 });
            cartUI();
            b.textContent = 'Added'; b.className = 'btn done';
            slog('CART_ADD_SUCCESS', { productId: id });
            setTimeout(function () { b.textContent = 'Add to Cart'; b.className = 'btn'; b.disabled = false; }, 700);
        })
        .catch(function (e) {
            b.textContent = 'Failed'; b.className = 'btn fail';
            slog('CART_ADD_ERROR', { productId: id, error: e.message });
            setTimeout(function () { b.textContent = 'Add to Cart'; b.className = 'btn'; b.disabled = false; }, 1000);
        });
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

function rm(id) { cart = cart.filter(function (c) { return c.id !== id; }); cartUI(); }
function tog() { document.getElementById('sidebar').classList.toggle('open'); document.getElementById('overlay').classList.toggle('open'); }
function slog(t, d) {
    fetch(API + '/log', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventType: t, sessionId: SID, version: VER, data: d, timestamp: Date.now() })
    }).catch(function () { });
}

window.onerror = function (m, u, l) { slog('CRASH_ERROR', { message: m, url: u, line: l }); };
window.addEventListener('unhandledrejection', function (e) { slog('CRASH_ERROR', { message: e.reason && e.reason.message || 'Promise rejected' }); });

slog('SESSION_START', { userAgent: navigator.userAgent });
render();
cartUI();

