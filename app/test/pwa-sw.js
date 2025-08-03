'use strict';

var cache_storage_name = 'pwa-0.2';
var start_page = '/app/test/';
var offline_page = '/app/test/offline/';
var first_cache_urls = [start_page, offline_page];

// Install
self.addEventListener('install', function (e) {
	console.log('PWA sw installation');
	e.waitUntil(caches.open(cache_storage_name).then(function (cache) {
		console.log('PWA sw caching first urls');
		first_cache_urls.map(function (url) {
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
			if (key !== cache_storage_name) {
				console.log('PWA old cache removed', key);
				return caches.delete(key);
			}
		}));
	}));
	self.clients.claim();
});

// Fetch
self.addEventListener('fetch', function (e) {
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
