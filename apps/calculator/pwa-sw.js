'use strict';

const CACHE_VERSION = 'pwa-0.8';
const START_URL = '/apps/calculator/';
const OFFLINE_URL = '/apps/calculator/offline/';
const ASSETS = [
  START_URL,
  OFFLINE_URL,
  'pwa-manifest.json',
  '/assets/styles/main.css',
  '/assets/fonts/mulish.woff2',
  '/apps/',
  '/'
];

self.addEventListener('install', function (e) {
  console.log('[ServiceWorker] Install event triggered');

  e.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      console.log('[ServiceWorker] Opened cache:', CACHE_VERSION);
      console.log('[ServiceWorker] Attempting to pre-cache assets:', ASSETS);
      return Promise.all(
        ASSETS.map(function (url) {
          return cache.add(url).then(() => {
            console.log('[ServiceWorker] Cached asset:', url);
          }).catch(function (err) {
            console.error('[ServiceWorker] Failed to cache:', url, 'Error:', err);
          });
        })
      );
    })
  );
});

self.addEventListener('activate', function (e) {
  console.log('[ServiceWorker] Activate event triggered');
  e.waitUntil(
    caches.keys().then(function (keys) {
      console.log('[ServiceWorker] Existing cache keys:', keys);
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_VERSION) {
            console.log('[ServiceWorker] Deleting old cache:', key);
            return caches.delete(key);
          } else {
            console.log('[ServiceWorker] Keeping current cache:', key);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  console.log('[ServiceWorker] Fetch event for:', e.request.url);

  if (!fetchRules(e)) {
    console.log('[ServiceWorker] Skipping request due to fetchRules:', e.request.url);
    return;
  }

  if (e.request.mode === 'navigate') {
    console.log('[ServiceWorker] Handling navigation request');

    e.respondWith(
      fetch(e.request)
        .then(function (response) {
          console.log('[ServiceWorker] Fetched from network:', e.request.url);
          return caches.open(CACHE_VERSION).then(function (cache) {
            cache.put(e.request, response.clone());
            console.log('[ServiceWorker] Cached navigation response:', e.request.url);
            return response;
          });
        })
        .catch(function (err) {
          console.warn('[ServiceWorker] Network failed, trying cache:', e.request.url, 'Error:', err);
          return caches.match(e.request).then(function (response) {
            if (response) {
              console.log('[ServiceWorker] Found in cache:', e.request.url);
              return response;
            } else {
              console.warn('[ServiceWorker] Not found in cache. Serving OFFLINE_URL:', OFFLINE_URL);
              return caches.match(OFFLINE_URL);
            }
          });
        })
    );
    return;
  }

  // Non-navigation requests
  e.respondWith(
    caches.match(e.request)
      .then(function (response) {
        if (response) {
          console.log('[ServiceWorker] Serving from cache:', e.request.url);
          return response;
        }
        console.log('[ServiceWorker] Fetching from network (non-cache):', e.request.url);
        return fetch(e.request)
          .then(function (networkResponse) {
            return caches.open(CACHE_VERSION).then(function (cache) {
              cache.put(e.request, networkResponse.clone());
              console.log('[ServiceWorker] Cached new asset:', e.request.url);
              return networkResponse;
            });
          });
      })
      .catch(function (err) {
        console.error('[ServiceWorker] Failed to fetch and no cache fallback:', e.request.url, 'Error:', err);
        return caches.match(OFFLINE_URL);
      })
  );
});

function fetchRules(e) {
  const url = new URL(e.request.url);

  const sameOrigin = url.origin === self.location.origin;
  const secure = url.protocol.startsWith('https');
  const isGet = e.request.method === 'GET';

  console.log('[ServiceWorker] fetchRules:', {
    url: url.href,
    sameOrigin,
    secure,
    isGet
  });

  return sameOrigin && secure && isGet;
}
