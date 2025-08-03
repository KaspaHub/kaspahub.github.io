if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('sw.js')
            .then(function (register) {
                console.log('PWA service worker ready');
                register.update();
            })
            .catch(function (error) {
                console.log('Register failed! Error:' + error);
            });
    });
}


