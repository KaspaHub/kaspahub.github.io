'use strict';

const CACHE_VERSION = 'pwa-0.7';
const START_URL = '/apps/calculator/';
const OFFLINE_URL = '/apps/offline/';
const ASSETS = [
  START_URL,
  OFFLINE_URL,
  'pwa-manifest.json',
  '/apps/',
  '/assets/styles/main.css',
  '/assets/fonts/mulish.woff2'
];

self.addEventListener('install', function (e) {
  console.log('[ServiceWorker] Install event triggered');

  e.waitUntil(
    caches.open(CACHE_VERSION).then(function (cache) {
      console.log('[ServiceWorker] Opened cache:', CACHE_VERSION);
      return Promise.all(
        ASSETS.map(function (url) {
          return cache.add(url).then(() => {
            console.log('[ServiceWorker] Cached:', url);
          }).catch(function (err) {
            console.warn('[ServiceWorker] Failed to cache:', url, err);
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
      return Promise.all(
        keys.map(function (key) {
          if (key !== CACHE_VERSION) {
            console.log('[ServiceWorker] Removing old cache:', key);
            return caches.delete(key);
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
    console.log('[ServiceWorker] Skipped due to fetchRules:', e.request.url);
    return;
  }

  if (e.request.mode === 'navigate') {
    console.log('[ServiceWorker] Handling navigation request:', e.request.url);
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
        .catch(function (error) {
          console.warn('[ServiceWorker] Network failed, trying cache:', e.request.url, error);
          return caches.match(e.request).then(function (response) {
            if (response) {
              console.log('[ServiceWorker] Found navigation request in cache:', e.request.url);
              return response;
            } else {
              console.warn('[ServiceWorker] Falling back to OFFLINE_URL:', OFFLINE_URL);
              return caches.match(OFFLINE_URL).then(function (offlineResponse) {
                if (!offlineResponse) {
                  console.error('[ServiceWorker] OFFLINE_URL not found in cache:', OFFLINE_URL);
                }
                return offlineResponse;
              });
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
          console.log('[ServiceWorker] Served from cache:', e.request.url);
          return response;
        }
        console.log('[ServiceWorker] Fetching from network:', e.request.url);
        return fetch(e.request)
          .then(function (networkResponse) {
            return caches.open(CACHE_VERSION).then(function (cache) {
              cache.put(e.request, networkResponse.clone());
              console.log('[ServiceWorker] Cached non-navigation response:', e.request.url);
              return networkResponse;
            });
          });
      })
      .catch(function (err) {
        console.warn('[ServiceWorker] Non-navigation fetch failed, returning OFFLINE_URL:', e.request.url, err);
        return caches.match(OFFLINE_URL).then(function (offlineResponse) {
          if (!offlineResponse) {
            console.error('[ServiceWorker] OFFLINE_URL not found in cache:', OFFLINE_URL);
          }
          return offlineResponse;
        });
      })
  );
});

// Fetch rules with logging
function fetchRules(e) {
  const url = new URL(e.request.url);

  if (url.origin !== self.location.origin) {
    console.log('[ServiceWorker] Ignoring cross-origin request:', e.request.url);
    return false;
  }
  if (!(url.protocol === 'https:' || url.hostname === 'localhost')) {
    console.log('[ServiceWorker] Ignoring non-https or non-localhost request:', e.request.url);
    return false;
  }
  if (e.request.method !== 'GET') {
    console.log('[ServiceWorker] Ignoring non-GET request:', e.request.url);
    return false;
  }

  return true;
}
