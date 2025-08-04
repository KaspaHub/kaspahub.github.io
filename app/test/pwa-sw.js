'use strict';

var version = 'pwa-0.5';
var start_url = '/app/test/';
var offline_url = '/app/test/offline/';
var whitelist = [start_url, offline_url, 'pwa-manifest.json'];

// Install 
self.addEventListener('install', function (e) {
  console.log('PWA sw installation');
  e.waitUntil(caches.open(version).then(function (cache) {
    console.log('PWA sw caching first urls');
    whitelist.map(function (url) {
      return cache.add(url).catch(function (res) {
        console.log('PWA: ' + String(res) + ' ' + url);
      });
    });
  }));
});

// Activate
self.addEventListener('activate', function (e) {
  console.log('PWA sw activation');
  e.waitUntil(caches.keys().then(function (kl) {
    return Promise.all(kl.map(function (key) {
      if (key !== version) {
        console.log('PWA old cache removed', key);
        return caches.delete(key);
      }
    }));
  }));
  return self.clients.claim();
});

// Fetch
self.addEventListener('fetch', function (e) {
  if (!fetchRules(e)) return;

  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then(function (response) {
          return caches.open(version).then(function (cache) {
            cache.put(e.request, response.clone());
            return response;
          });
        })
        .catch(function () {
          return caches.match(e.request).then(function (response) {
            return response || caches.match(offline_url);
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
              return caches.open(version).then(function (cache) {
                cache.put(e.request, response.clone());
                return response;
              });
            })
        );
      })
      .catch(function () {
        return caches.match(offline_url);
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
