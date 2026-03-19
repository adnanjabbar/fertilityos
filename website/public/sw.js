/**
 * FertilityOS PWA Service Worker
 * Caches app shell and dashboard for offline use. Update cache version when deploying.
 */
// Bump cache version whenever we change sw.js behavior.
const CACHE_NAME = "fertilityos-v7";
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

  // Do not intercept auth at all — let the browser talk to the server directly.
  // Avoids SW turning slow/timeout responses into 504 and keeps login/session reliable.
  if (url.pathname.startsWith("/api/auth")) return;

  if (url.pathname.startsWith("/api/")) {
    event.respondWith(
      fetch(event.request).catch(() => new Response("Network error", { status: 504 }))
    );
    return;
  }

  // Never serve cached /login HTML; it can cause React hydration mismatch (#418)
  // if the browser has an older cached HTML shell.
  if (url.pathname === "/login") {
    // Do not fall back to cache. Use 504 (not 503) so auth 503 from server (e.g. UntrustedHost)
    // remains distinguishable for debugging.
    event.respondWith(
      fetch(event.request).catch(
        () => new Response("Network error", { status: 504, statusText: "Gateway Timeout" })
      )
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
      // App routes can fall back to offline page. Use 504 so server 503 (e.g. auth) is distinguishable.
      if (url.pathname.startsWith("/app")) {
        const offline = await caches.match(OFFLINE_URL);
        return offline || new Response("Network error", { status: 504, statusText: "Gateway Timeout" });
      }
      // Non-app (e.g. auth session calls) should not break the app UI.
      return cached || new Response("Network error", { status: 504, statusText: "Gateway Timeout" });
    }
  })());
});
