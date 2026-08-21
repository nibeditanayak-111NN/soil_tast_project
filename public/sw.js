// Soil Health PWA — Service Worker
// Strategy: Cache-First for static assets, Network-First for API calls
const CACHE_NAME = "soil-health-v3";
const STATIC_ASSETS = [
  "/",
  "/manifest.webmanifest",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
];

// ── Install: pre-cache core shell ──────────────────────────────────────────────
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

// ── Activate: remove old caches ────────────────────────────────────────────────
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch: route handler ───────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Bypass service worker entirely for API calls
  if (url.port === "3001" || url.pathname.startsWith("/api/")) {
    return;
  }

  // Bypass cache for Vite development files to avoid breaking HMR
  if (url.pathname.startsWith("/src/") || url.pathname.startsWith("/@")) {
    return;
  }

  // Cache-first for everything else (JS, CSS, images)
  event.respondWith(
    caches.match(request).then(
      (cached) => cached || fetch(request).then((res) => {
        // Cache successful GET responses
        if (request.method === "GET" && res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        }
        return res;
      })
    )
  );
});
