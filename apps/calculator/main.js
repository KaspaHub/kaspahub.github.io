if (!('serviceWorker' in navigator)) {
    console.log('[Main] Service workers are not supported in this browser.');
    return;
}

window.addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js')
        .then(function (register) {
            register.update();
            console.log('[Main] Service worker registered.');
        })
        .catch(function (error) {
            console.log('[Main] Service worker registration failed. Error: ' + error);
        });

    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);
});

function handleNetworkChange() {
    if (navigator.onLine) {
        console.log('[Main] Internet connection restored.');
    } else {
        console.log('[Main] No internet connection.');
    }
}