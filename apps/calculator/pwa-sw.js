'use strict';

const CACHE_VERSION = 'pwa-0.8';
const START_URL = '/apps/calculator/';
const OFFLINE_URL = '/apps/calculator/offline/';
const ASSETS = [
  START_URL,
  OFFLINE_URL,
  'pwa-manifest.json',
  '/assets/styles/main.css',
  '/assets/fonts/mulish.woff2'
];

self.addEventListener('install', function (e) {
  console.log('[ServiceWorker] Installation');
  e.waitUntil(caches.open(CACHE_VERSION).then(function (cache) {
    console.log('[ServiceWorker] Pre-caching assets');
    ASSETS.map(function (url) {
      return cache.add(url).catch(function (res) {
        console.log('[ServiceWorker]  ' + String(res) + ' ' + url);
      });
    });
  }));
});

self.addEventListener('activate', function (e) {
  console.log('[ServiceWorker] Activation');
  e.waitUntil(caches.keys().then(function (kl) {
    return Promise.all(kl.map(function (key) {
      if (key !== CACHE_VERSION) {
        console.log('[ServiceWorker] Removing old cache', key);
        return caches.delete(key);
      }
    }));
  }));
  return self.clients.claim();
});

self.addEventListener('fetch', function (e) {
  if (!fetchRules(e)) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(function (response) {
          return caches.open(CACHE_VERSION).then(function (cache) {
            cache.put(e.request, response.clone());
            return response;
          });
        })
        .catch(function () {
          return caches.match(e.request).then(function (response) {
            return response || caches.match(OFFLINE_URL);
          });
        })
    );
    return;
  }

  // Non-navigation requests
  e.respondWith(
    caches.match(e.request)
      .then(function (response) {
        return (
          response ||
          fetch(e.request)
            .then(function (response) {
              return caches.open(CACHE_VERSION).then(function (cache) {
                cache.put(e.request, response.clone());
                return response;
              });
            })
        );
      })
      .catch(function () {
        return caches.match(OFFLINE_URL);
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