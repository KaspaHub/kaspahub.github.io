if ('serviceWorker' in navigator) {
    window.addEventListener('appinstalled', function () {
        console.log('[Main] PWA Installed');

        navigator.serviceWorker.register('pwa-sw.js')
            .then(function (register) {
                console.log('[Main] SW Registered');
                register.update();
            })
            .catch(function (error) {
                console.error('[Main] SW Registration failed:', error);
            });
    });
}

// Check user internet status (online/offline)
// function updateOnlineStatus(event) {
//     if (!navigator.onLine) {
//         alert('Internet access is not possible!')
//     }
// }

// window.addEventListener('online', updateOnlineStatus);
// window.addEventListener('offline', updateOnlineStatus);