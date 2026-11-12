// Service worker RacikRouter: simpan berkas aplikasi agar situs tetap bisa dibuka tanpa jaringan.
// Strategi: cache first untuk berkas sendiri, jaringan dulu untuk sisanya.
var CACHE = 'racikrouter-v14';
var SHELL = [
  './',
  './index.html',
  './styles.css',
  './racik.css',
  './app.js',
  './tools.js',
  './qrcode.js',
  './share.js',
  './racik.js',
  './manifest.webmanifest',
  './icon.svg'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.map(function (k) { return k === CACHE ? null : caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  if (e.request.method !== 'GET') return;
  // Navigasi halaman selalu coba jaringan dulu, supaya versi terbaru situs
  // langsung sampai ke pengguna dan tidak terjebak salinan lama di cache.
  // Saat luring, jatuh ke salinan cache terakhir.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      }).catch(function () {
        return caches.match(e.request).then(function (hit) {
          return hit || caches.match('./index.html');
        });
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).then(function (res) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        return res;
      });
    })
  );
});
