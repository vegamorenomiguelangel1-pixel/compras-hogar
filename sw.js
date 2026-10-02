var CACHE = 'yapa-shell-v7';
var ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/logic.js',
  './js/data.js',
  './js/store.js',
  './js/cloud.js',
  './js/i18n.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/yapa-logo.png',
  './fonts/outfit-400.woff2',
  './fonts/outfit-500.woff2',
  './fonts/outfit-600.woff2',
  './fonts/outfit-700.woff2',
  './fonts/OFL.txt'
];

self.addEventListener('install', function (event) {
  event.waitUntil(caches.open(CACHE).then(function (cache) {
    return cache.addAll(ASSETS);
  }));
  self.skipWaiting();
});

self.addEventListener('activate', function (event) {
  event.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (key) { return key !== CACHE; }).map(function (key) {
      return caches.delete(key);
    }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (event) {
  var req = event.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  // Firebase (SDK en gstatic y API en googleapis) no se guarda en este caché:
  // una respuesta vieja de Auth o Firestore dejaría la sync rota.
  if (url.hostname.indexOf('googleapis.com') !== -1) return;
  if (url.hostname.indexOf('gstatic.com') !== -1) return;
  if (url.hostname.indexOf('firebase') !== -1) return;
  if (url.origin !== self.location.origin) return;
  event.respondWith(fetch(req).then(function (res) {
    if (res && res.ok) {
      var copy = res.clone();
      caches.open(CACHE).then(function (cache) { return cache.put(req, copy); }).catch(function () {});
    }
    return res;
  }).catch(function () {
    return caches.match(req).then(function (cached) {
      if (cached) return cached;
      if (req.mode === 'navigate') return caches.match('./index.html');
      return new Response('', { status: 504, statusText: 'Offline' });
    });
  }));
});
