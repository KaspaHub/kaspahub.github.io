if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('./pwa-sw.js')
            .then(function (register) {
                console.log('PWA service worker ready');
                register.update();
            })
            .catch(function (error) {
                console.log('Register failed! Error:' + error);
            });

        // function status(event) {
        //     if (!navigator.onLine) {
        //         alert('Internet access is not possible!')
        //     }
        // }

        // window.addEventListener('online', status);
        // window.addEventListener('offline', status);

    });
}