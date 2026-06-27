const CACHE_RESET_VERSION = 'gts-empire-derived-builder-compat-20260628-v2';

self.addEventListener('install', event => {
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches
            .keys()
            .then(keys => Promise.all(keys.map(key => caches.delete(key))))
            .then(() => self.clients.claim())
            .then(() =>
                self.clients.matchAll({ type: 'window' }).then(clients => {
                    clients.forEach(client => {
                        client.postMessage({
                            type: 'GTS_CACHE_RESET',
                            version: CACHE_RESET_VERSION,
                        });
                    });
                })
            )
    );
});

self.addEventListener('fetch', () => {
    // Intentionally bypass all requests so the app always uses the latest
    // Netlify build for trading dropdowns and contract metadata.
});
