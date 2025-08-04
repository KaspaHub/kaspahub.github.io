'use strict';

function initServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.log('[Main] Service workers are not supported in this browser.');
        console.log('%c[Main] A service worker is already controlling this page.', 'color: #EC6A5E;');
        return;
    }

    if (navigator.serviceWorker.controller) {
        console.log('%c[Main] A service worker is already controlling this page.', 'color: #61C554;');
    }

    navigator.serviceWorker.register('sw.js')
        .then(function (registration) {
            console.log('%c[Main] Service worker registered successfully.', 'color: #61C554;');
        })
        .catch(function (error) {
            console.log('[Main] Service worker registration failed:', error);
        });

    window.addEventListener('online', networkChange);
    window.addEventListener('offline', networkChange);
}

function networkChange(event) {
    if (navigator.onLine) {
        console.log('[Main] Internet connection restored.');
    } else {
        console.log('[Main] No internet connection.');
    }
}

initServiceWorker();
