'use strict';

var cache_storage_name = 'pwa-0.2';
var cachedUrls = [
  start_page,
  offline_page,
  'pwa-manifest.json'
];

// Install 
self.addEventListener('install', function (e) {
	console.log('PWA sw installation');
	e.waitUntil(caches.open(cache_storage_name).then(function (cache) {
		console.log('PWA sw caching first urls');
		cachedUrls.map(function (url) {
			return cache.add(url).catch(function (res) {
				return console.log('PWA: ' + String(res) + ' ' + url);
			});
		});
	}));
});

// Activate
self.addEventListener('activate', function (e) {
	console.log('PWA sw activation');
	e.waitUntil(caches.keys().then(function (kl) {
		return Promise.all(kl.map(function (key) {
			if (key !== cache_storage_name) {
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

	// Online
	if (e.request.mode === 'navigate' && navigator.onLine) {
		e.respondWith(fetch(e.request).then(function (response) {
			return caches.open(cache_storage_name).then(function (cache) {
				cache.put(e.request, response.clone());
				return response;
			});
		}));
		return;
	}

	// Offline
	e.respondWith(caches.match(e.request).then(function (response) {
		return response || fetch(e.request).then(function (response) {
			return caches.open(cache_storage_name).then(function (cache) {
				cache.put(e.request, response.clone());
				return response;
			});
		});
	}).catch(function () {
		return caches.match(offline_page);
	}));
});

// Rules
function fetchRules(e) {

	if (new URL(e.request.url).origin !== location.origin) return;

	if (!e.request.url.startsWith('https://')) return;

	if (e.request.method !== 'GET') {
		return caches.match(offline_page);
	}

	return true;
}
