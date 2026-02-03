const CACHE_NAME = "rcp-assist-v2";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./offline.html",
  "./assets/logoGuttmann.png"
  // añade aquí tus .css, .js, audios locales, etc.
];

self.addEventListener("install", (event) => {
  // Precache app shell
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Clean up old caches on activate
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch strategy: try cache first, then network; for navigations, provide offline fallback
self.addEventListener("fetch", (event) => {
  const request = event.request;

  // For navigation requests, try cache -> network -> offline page
  if (request.mode === 'navigate' || (request.method === 'GET' && request.headers.get('accept') && request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) return cached;
        return fetch(request).then((networkResponse) => {
          return networkResponse;
        }).catch(() => caches.match('./offline.html'));
      })
    );
    return;
  }

  // For other requests, prefer cache, fallback to network
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request).catch(() => {
      // If request is for an image and both cache/network fail, you may return a placeholder here
      return;
    }))
  );
});
