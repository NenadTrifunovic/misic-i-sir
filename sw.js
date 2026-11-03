/* Offline cache for the app shell. Bump VERSION whenever files change. */
const VERSION = 'misic-v2';
const FILES = [
  './',
  './index.html',
  './css/style.css',
  './js/engine.js',
  './js/levels.js',
  './js/i18n.js',
  './js/audio.js',
  './js/app.js',
  './manifest.webmanifest',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (ev) => {
  ev.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (ev) => {
  ev.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});

/* Network first (always the newest files when online), cache as the offline fallback. */
self.addEventListener('fetch', (ev) => {
  if (ev.request.method !== 'GET') return;
  const url = new URL(ev.request.url);
  if (url.origin !== location.origin) return;
  ev.respondWith(
    fetch(ev.request)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(VERSION).then((c) => c.put(ev.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(ev.request, { ignoreSearch: true }).then((hit) => hit || caches.match('./index.html')))
  );
});
