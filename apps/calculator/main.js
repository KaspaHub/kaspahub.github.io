if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {

        navigator.serviceWorker.register('/assets/scripts/sw.js', {
          scope: '/calculator/'
        })
            .then(function (register) {
                console.log('[Main] SW Registered');
                register.update();
            })
            .catch(function (error) {
                console.log('[Main] SW Registration failed. Error:' + error);
            });

        function updateOnlineStatus(event) {
            if (!navigator.onLine) {
                console.log('[Main] No Internet connection');
            }
        }

        window.addEventListener('online', updateOnlineStatus);
        window.addEventListener('offline', updateOnlineStatus);

    });
}