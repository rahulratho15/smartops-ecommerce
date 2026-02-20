/* TechVault — Init (runs after all modules loaded) */
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

/* Enter key support for auth */
document.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && document.getElementById('auth-modal').style.display !== 'none') {
        doAuth();
    }
});
