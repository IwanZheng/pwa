
const siteCacheName = 'static-cache'
const assets = [
    '/',
    '/index.html',
    '/assets/images/panda.svg',
    '/assets/sound/ni-how.mp3',
    '/js/app/app.js',
    '/css/style.css',
    '/css/pages/page.css',
    '/css/pages/font.css',
    '/css/pages/main/chat.css',
    '/css/pages/sidebar/font.css',
    '/css/pages/sidebar/tts.css',
    "/css/pages/menu/menu.css",
    '/css/font/MaterialIconsRound-Regular.otf',
    '/css/font/Roboto-Regular.ttf',
    "https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js",
    "https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/contrib/auto-render.min.js",
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth-compat.js",
    "https://www.gstatic.com/firebasejs/10.12.2/firebase-analytics-compat.js",
    "https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/katex.min.js",
    "https://cdn.jsdelivr.net/npm/katex@0.16.10/dist/contrib/auto-render.min.js"
]

self.addEventListener('install', evt => {
    evt.waitUntil(
        caches.open(siteCacheName).then(cache => {
            console.log('caching static assets')
            cache.addAll(assets)
        })
    )
});

// Activate service worker
self.addEventListener('activate', evt => {
    console.log('Service worker has been activated!');
})

self.addEventListener('fetch', (evt) => {
    evt.respondWith(
        caches.match(evt.request).then(cacheRes => {
            return cacheRes || fetch(evt.request)
        })
    )
})