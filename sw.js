// ALTHER FIT — Service Worker PWA (Cache Hors-Ligne & Rechargement Dynamique v6.0)
const CACHE_NAME = 'alther-fit-v7.0-pure-vector-studio';
const STATIC_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './src/styles.css?v=7.0',
  './src/data.js?v=7.0',
  './src/storage.js?v=7.0',
  './src/rpg.js?v=7.0',
  './src/hero3d.js?v=7.0',
  './src/audio.js?v=7.0',
  './src/hardware.js?v=7.0',
  './src/charts.js?v=7.0',
  './src/aiCoach.js?v=7.0',
  './src/app.js?v=7.0',
  './src/icon.svg?v=7.0',
  './src/assets/hero-anime-original.svg',
  './src/assets/arena-bg.jpg',
  './avatar_gallery.html',
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        STATIC_ASSETS.map((asset) =>
          cache.add(asset).catch((err) => {
            console.warn('[SW] Asset non mis en cache :', asset, err);
          })
        )
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Stratégie Network-First : charge toujours le code le plus frais du serveur
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET' || event.request.url.includes('generativelanguage.googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => caches.match(event.request))
  );
});
