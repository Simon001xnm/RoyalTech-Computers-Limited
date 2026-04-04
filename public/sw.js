// Basic Service Worker for PWA installability
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installed');
});

self.addEventListener('fetch', (event) => {
  // This is a pass-through fetch handler, required for PWA install criteria
  event.respondWith(fetch(event.request));
});
