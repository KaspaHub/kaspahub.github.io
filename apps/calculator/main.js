'use strict';

function initServiceWorker() {
    if (!('serviceWorker' in navigator)) {
        console.log('[Main] Service workers are not supported in this browser.');
        return;
    }

    window.addEventListener('load', function () {
        if (navigator.serviceWorker.controller) {
            console.log('[Main] A service worker is already controlling this page.');
        }

        navigator.serviceWorker.register('sw.js')
            .then(function (registration) {
                console.log('[Main] Service worker registered successfully.');
            })
            .catch(function (error) {
                console.log('[Main] Service worker registration failed:', error);
            });

        window.addEventListener('online', networkChange);
        window.addEventListener('offline', networkChange);
    });

}

function networkChange(event) {
    if (navigator.onLine) {
        console.log('[Main] Internet connection restored.');
    } else {
        console.log('[Main] No internet connection.');
    }
}

initServiceWorker();