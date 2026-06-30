// Minimal service worker — required for PWA installability checks.
// This does not cache anything; the app always loads fresh from the network,
// which is correct for a subscription-gated app that must always verify access.

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Pass-through — always fetch from network, never serve cached/stale content.
  event.respondWith(fetch(event.request));
});
