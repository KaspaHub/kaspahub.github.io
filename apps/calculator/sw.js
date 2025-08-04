'use strict';

const CACHE_VERSION = 'v0.3';
const START_URL = '/apps/calculator/';
const OFFLINE_URL = '/apps/calculator/offline/';
const ASSETS = [
  START_URL,
  OFFLINE_URL,
  '/favicon.ico',
  '/apps/calculator/wm.json',
  '/assets/styles/main.css',
  '/assets/fonts/mulish.woff2'
];

self.addEventListener('install', function (event) {
  const preCache = caches.open(CACHE_VERSION).then(function (cache) {

    return Promise.all(
      ASSETS.map(function (url) {
        return cache.add(url).catch(function (error) {
          console.log(`[ServiceWorker] Could not save ${url}. Error: ${String(error)}`);
        });
      })
    );
  });

  event.waitUntil(
    preCache.then(() => {
      console.log('%c[ServiceWorker] Installation completed successfully.', 'color: #42A611;');
    })
  );
});

self.addEventListener('activate', function (event) {
  const cleanOldCaches = caches.keys().then(function (keys) {
    return Promise.all(
      keys.map(function (key) {
        if (key !== CACHE_VERSION) {
          console.log(`[ServiceWorker] Removing outdated files from cache: ${key}`);
          return caches.delete(key);
        }
      })
    );
  });

  event.waitUntil(
    cleanOldCaches.then(() => {
      console.log('%c[ServiceWorker] Activation completed successfully.', 'color: #42A611;');
    })
  );

  self.clients.claim();
});

self.addEventListener('fetch', function (event) {
  if (!isRequestValid(event)) {
    return;
  }

  if (event.request.mode === 'navigate') {
    event.respondWith(handlePageRequest(event));
    return;
  }

  event.respondWith(handleResourceRequest(event));
});

function isRequestValid(event) {
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isSecure = url.protocol.startsWith('https');
  const isGet = event.request.method === 'GET';
  const isCacheablePath = ASSETS.includes(url.pathname);

  if (!isSameOrigin) {
    console.log(`[ServiceWorker] Skipping request: different origin → ${url.origin}`);
    return false;
  }

  if (!isSecure) {
    console.log(`[ServiceWorker] Skipping request: insecure protocol → ${url.protocol}`);
    return false;
  }

  if (!isGet) {
    console.log(`[ServiceWorker] Skipping request: non-GET method → ${event.request.method}`);
    return false;
  }

  // if (!isCacheablePath) {
  //   console.log(`[ServiceWorker] Skipping request: not in cacheable paths → ${url.pathname}`);
  //   return false;
  // }

  return true;
}

function handlePageRequest(event) {
  return fetch(event.request)
    .then(function (response) {
      return caches.open(CACHE_VERSION).then(function (cache) {
        cache.put(event.request, response.clone());
        console.log(`[ServiceWorker] Saved page for offline access: ${event.request.url}`);
        return response;
      });
    })
    .catch(function () {
      console.log(`[ServiceWorker] Could not load page: ${event.request.url}. Serving offline page instead.`);
      return caches.match(event.request).then(function (response) {
        return response || caches.match(OFFLINE_URL);
      });
    });
}

function handleResourceRequest(event) {
  return caches.match(event.request)
    .then(function (response) {
      if (response) {
        console.log(`[ServiceWorker] Loaded resource from cache: ${event.request.url}`);
        return response;
      }

      return fetch(event.request).then(function (response) {
        return caches.open(CACHE_VERSION).then(function (cache) {
          cache.put(event.request, response.clone());
          console.log(`[ServiceWorker] Downloaded and cached resource: ${event.request.url}`);
          return response;
        });
      });
    })
    .catch(function () {
      console.log(`[ServiceWorker] Could not load resource: ${event.request.url}. Serving offline fallback.`);
      return caches.match(OFFLINE_URL);
    });
}
