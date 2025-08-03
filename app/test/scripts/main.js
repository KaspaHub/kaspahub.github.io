'use strict';
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
        navigator.serviceWorker.register('scripts/sw.js').then(function (register) {
            register.update();
        });
    });
}





// // Check user internet status (online/offline)
// function updateOnlineStatus(event) {
//    if (!navigator.onLine) {
//        alert('Internet access is not possible!')
//    }
// }

// window.addEventListener('online', updateOnlineStatus);
// window.addEventListener('offline', updateOnlineStatus);