/* ================================================================
   Service Worker — ASTRO Letters PWA
   Cache-first with network fallback for offline letterhead editing
   ================================================================ */

var CACHE_NAME = 'astro-letters-v2';
var ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/letter-template.js',
  './js/pdf-generator.js',
  './js/app.js',
  './assets/logo.png',
  './assets/signature.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
];

// Install — cache all core assets
self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(
        names.filter(function (n) { return n !== CACHE_NAME; })
             .map(function (n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

// Fetch — cache-first, network fallback
self.addEventListener('fetch', function (event) {
  // Bypass CDN scripts (html2pdf.js) and POST requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request).then(function (cached) {
      if (cached) return cached;
      return fetch(event.request).then(function (response) {
        // Cache successful GET responses (except CDN/external)
        if (response.ok && event.request.url.startsWith(self.location.origin)) {
          var clone = response.clone();
          caches.open(CACHE_NAME).then(function (cache) {
            cache.put(event.request, clone);
          });
        }
        return response;
      }).catch(function () {
        // Offline fallback — return the cached index for navigation requests
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
