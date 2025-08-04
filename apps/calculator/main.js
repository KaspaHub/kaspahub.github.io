if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        registerServiceWorker();
        setupNetworkStatusListeners();
    });
}

function registerServiceWorker() {
    navigator.serviceWorker.register('sw.js')
        .then((registration) => {
            console.log('[Main] SW Registered:', registration.scope);
            registration.update();

            cleanupOldServiceWorkers(registration);
        })
        .catch((error) => {
            console.error('[Main] SW Registration failed. Error:', error);
        });
}

function cleanupOldServiceWorkers(currentRegistration) {
    navigator.serviceWorker.getRegistrations().then((registrations) => {
        registrations.forEach((reg) => {
            if (reg.scope !== currentRegistration.scope) {
                reg.unregister().then((ok) => {
                    console.log(`[Main] Unregistered SW at "${reg.scope}" (not current) — success: ${ok}`);
                });
            }
        });
    });
}


function setupNetworkStatusListeners() {
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);
}

function handleNetworkChange() {
    if (navigator.onLine) {
        console.log('[Main] Internet connection restored');
    } else {
        console.log('[Main] No Internet connection');
    }
}
