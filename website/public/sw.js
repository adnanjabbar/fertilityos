/**
 * FertilityOS PWA Service Worker
 * Caches app shell and dashboard for offline use. Update cache version when deploying.
 */
// Bump cache version whenever we change sw.js behavior.
const CACHE_NAME = "fertilityos-v3";
const OFFLINE_URL = "/app/dashboard";

const PRECACHE_URLS = [
  "/",
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

  // IMPORTANT: never handle auth APIs via the service worker cache layer.
  // next-auth relies on fresh responses/cookies for session establishment.
  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => new Response("Network error", { status: 504 }))
    );
    return;
  }

  // Never serve cached /login HTML; it can cause React hydration mismatch (#418)
  // if the browser has an older cached HTML shell.
  if (url.pathname === "/login") {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request) ?? new Response("Offline", { status: 503 }))
    );
    return;
  }

  // Always return a real Response from respondWith.
  // Previously, some failures returned `null`, which causes:
  // "TypeError: Failed to convert value to 'Response'".
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);

    try {
      const response = await fetch(event.request);
      if (
        response &&
        response.ok &&
        url.pathname.startsWith("/app") &&
        !url.pathname.includes("/api/")
      ) {
        cache.put(event.request, response.clone());
      }
      return response;
    } catch (e) {
      // App routes can fall back to offline page.
      if (url.pathname.startsWith("/app")) {
        const offline = await caches.match(OFFLINE_URL);
        return offline || new Response("Offline", { status: 503, statusText: "Service Unavailable" });
      }
      // Non-app (e.g. auth session calls) should not break the app UI.
      return cached || new Response("Network error", { status: 504, statusText: "Gateway Timeout" });
    }
  })());
});
