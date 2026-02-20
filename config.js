/* TechVault — Config & Constants */
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
var authMode = 'login';
var lastDecisionCount = 0;
