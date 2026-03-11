'use strict';


const CACHE_VERSION = 'v0.8';
const START_URL = '/app/calculator/';
const OFFLINE_URL = '/app/calculator/offline/';
const ASSETS = [
  START_URL,
  OFFLINE_URL,
  '/favicon.ico',
  '/app/calculator/wm.json',
  '/assets/styles/main.css',
  '/assets/fonts/mulish.woff2'
];

self.addEventListener('install', function (event) {
self.skipWaiting();
  const preCache = caches.open(CACHE_VERSION).then(function (cache) {

return Promise.all(
  ASSETS.map(function (url) {
    return cache.add(url)
      .then(() => {
        console.log(`[ServiceWorker] Pre-cached: ${url}`);
      })
      .catch(function (error) {
        console.log(`[ServiceWorker] Could not save ${url}. Error: ${String(error)}`);
      });
  })
);

  });

  event.waitUntil(
    preCache.then(() => {
      console.log('%c[ServiceWorker] Installed successfully.', 'color: #61C554;');
    })
  );
});

self.addEventListener('activate', function (event) {
  const cleanOldCaches = caches.keys().then(function (keys) {
    return Promise.all(
    keys
      .filter(function (key) {
        return key !== CACHE_VERSION;
      })
      .map(function (key) {
        return caches.delete(key);
      })
    );
  });

  event.waitUntil(
    cleanOldCaches.then(() => {
      console.log('[ServiceWorker] Activated successfully.');
    })
  );

  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  if (!isRequestValid(event)) {
    return;
  }

  event.respondWith(handleFetchRequest(event).catch(error => {
    console.error('Fetch handler error:', error);
  }));
});

function handleFetchRequest(event) {
  return caches.match(event.request)
    .then(function (response) {
      if (response) {
        // console.log(`[ServiceWorker] Loaded resource from cache: ${event.request.url}`);
        return response;
      }

      return fetch(event.request).then(function (response) {
        return caches.open(CACHE_VERSION).then(function (cache) {
          cache.put(event.request, response.clone());
          console.log(`[ServiceWorker] Downloaded and cached: ${event.request.url}`);
          return response;
        });
      });
    })
    .catch(function () {
      console.log(`[ServiceWorker] Could not load: ${event.request.url}. Serving offline fallback.`);
      return caches.match(OFFLINE_URL);
    });
}

function isRequestValid(event) {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isSecure = url.protocol.startsWith('https');
  const isGet = event.request.method === 'GET';
  // const isCacheablePath = ASSETS.includes(url.pathname);

  if (!isSameOrigin) {
    console.log(`[ServiceWorker] Skipping request: different origin → ${url.origin}`);
    return false;
  }

  if (!isSecure) {
    console.log(`[ServiceWorker] Skipping request: insecure protocol → ${url.protocol}`);
    return false;
  }

  if (!isGet) {
    console.log(`[ServiceWorker] Skipping request: non-GET method → ${event.request.method} → ${event.request.url}`);
    return false;
  }

  // if (!isCacheablePath) {
  //   console.log(`[ServiceWorker] Skipping request: not in cacheable paths → ${url.pathname}`);
  //   return false;
  // }

  return true;
}
