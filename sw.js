/* Service Worker — Condor CQ / suivi PF
   Caches the local app shell only (this HTML file, manifest, icons).
   Firebase/Firestore calls and CDN scripts always go to the network —
   this app's data must stay live, so we do NOT cache API/data traffic. */

const CACHE_NAME = 'condor-cq-shell-v1';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-72.png',
  './icons/icon-144.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png',
  './icons/apple-touch-icon-76x76.png',
  './icons/apple-touch-icon-120x120.png',
  './icons/apple-touch-icon-152x152.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Only handle same-origin GET requests for the app shell itself.
  // Everything else (Firestore, Google Fonts, CDN scripts, camera lib, SheetJS...)
  // is left completely untouched so data always stays fresh and live.
  if (event.request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cached) => {
      const network = fetch(event.request)
        .then((response) => {
          if (response && response.ok) {
            const clone = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return response;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
