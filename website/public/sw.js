/**
 * FertilityOS PWA Service Worker
 * Caches app shell and dashboard for offline use. Update cache version when deploying.
 */
const CACHE_NAME = "fertilityos-v1";
const OFFLINE_URL = "/app/dashboard";

const PRECACHE_URLS = [
  "/",
  "/app/dashboard",
  "/login",
  "/offline",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS.map((u) => new Request(u, { cache: "reload" }))).catch(() => {
        // Ignore failures for optional precache (e.g. /offline may not exist)
        return Promise.resolve();
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET" || event.request.url.startsWith("chrome-extension")) return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const fetchPromise = fetch(event.request).then((response) => {
          if (response.ok && url.pathname.startsWith("/app") && !url.pathname.includes("/api/")) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => {
          if (url.pathname.startsWith("/app")) {
            return caches.match(OFFLINE_URL).then((r) => r || new Response("Offline", { status: 503, statusText: "Service Unavailable" }));
          }
          return null;
        });
        return cached || fetchPromise;
      })
    )
  );
});
