'use strict';

const CACHE_VERSION = 'pwa-0.5';
const START_URL = '/app/test/';
const OFFLINE_URL = '/app/test/offline/';
const PRECACHE_URLS = [START_URL, OFFLINE_URL, 'pwa-manifest.json', 'https://kaspahub.org/assets/styles/main.css'];

// Install Event: Cache essential files during installation
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Install');

  event.waitUntil(
    caches.open(CACHE_VERSION)
      .then(cache => {
        console.log('[ServiceWorker] Pre-caching assets');
        return Promise.all(
          PRECACHE_URLS.map(url =>
            cache.add(url).catch(err => {
              console.warn(`[ServiceWorker] Failed to cache ${url}:`, err);
            })
          )
        );
      })
  );
});

// Activate Event: Clean up old caches
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Activate');

  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_VERSION) {
            console.log('[ServiceWorker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      )
    )
  );

  return self.clients.claim();
});

// Fetch Event: Serve cached assets when available, fallback to network
self.addEventListener('fetch', event => {
  if (!fetchRules(event)) return;

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) return cachedResponse;

        // Try fetching from network
        return fetch(event.request)
          .catch(() => {
            // For navigation requests, serve offline page as fallback
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});

// Rules
function fetchRules(e) {
  const url = new URL(e.request.url);

  if (url.origin !== self.location.origin) return false;
  if (!url.protocol.startsWith('https')) return false;
  if (e.request.method !== 'GET') return false;

  return true;
}
