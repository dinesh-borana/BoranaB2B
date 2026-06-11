const CACHE = 'borana-b2b-v1';

// Cache static shell on install
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) =>
      c.addAll(['/', '/manifest.json', '/borana-logo.png'])
    )
  );
  self.skipWaiting();
});

// Remove old caches on activate
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for everything; fall back to cache when offline
self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);

  // Skip non-GET, cross-origin, and Next.js internals
  if (
    e.request.method !== 'GET' ||
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/_next/webpack-hmr') ||
    url.pathname.startsWith('/api/')
  ) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        // Cache successful responses for offline fallback
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
