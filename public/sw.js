const CACHE_NAME = 'whatsalink-v2';
const STATIC_ASSETS = [
  './',
  'index.html',
  'manifest.json',
  'icon-192.png',
  'icon-512.png',
  'favicon.png',
  'favicon.ico',
  'screenshot-narrow.png',
  'screenshot-wide.png'
];

// Installs and precaches core assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Precaching static assets');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Cleans up previous cache versions
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch events interception with Stale-While-Revalidate
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // Exclude non-http(s) schemes like tel: or mailto:
  if (!url.protocol.startsWith('http')) return;

  // Exclude WhatsApp redirection, API requests, and Gemini services
  if (url.hostname.includes('wa.me') || url.hostname.includes('whatsapp.com')) return;
  if (url.pathname.includes('/api/') || url.hostname.includes('generativelanguage.googleapis.com')) return;

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch fresh copy from network asynchronously to update the cache
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }
        }).catch((err) => {
          console.log('[Service Worker] Async update fetch failed:', err);
        });

        return cachedResponse;
      }

      // Fetch from network and store in cache dynamically
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200) {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch((err) => {
        console.log('[Service Worker] Direct fetch failed, offline:', err);
        // Fallback to index.html if navigating page
        if (event.request.mode === 'navigate') {
          return caches.match('index.html');
        }
      });
    })
  );
});
