/* Mizan serves only static UI files through its service worker.
 * Financial entries and JSON backups always stay in browser storage.
 */
const CACHE_PREFIX = "mizan-static-";
const CACHE_NAME = CACHE_PREFIX + "v2";
const APP_PAGES = new Set(["/", "/transactions", "/budgets", "/insights"]);
const APP_SHELL = [...APP_PAGES, "/favicon.svg", "/manifest.webmanifest"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key))),
    ),
  );
  self.clients.claim();
});

const normalizePage = (path) => path.length > 1 ? path.replace(/\/$/, "") : path;

function shouldCache(request, url) {
  if (url.origin !== self.location.origin || request.method !== "GET" || url.search) return false;
  if (request.headers.has("authorization") || request.headers.has("range")) return false;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) return false;
  if (request.mode === "navigate") return APP_PAGES.has(normalizePage(url.pathname));
  if (url.pathname === "/favicon.svg" || url.pathname === "/manifest.webmanifest") return true;
  return ["script", "style", "font", "image"].includes(request.destination)
    && ["/assets/", "/_next/", "/_vinext/", "/static/"].some((prefix) => url.pathname.startsWith(prefix));
}

function isSafeResponse(response) {
  const control = response.headers.get("cache-control") || "";
  return response.ok && !response.headers.has("set-cookie") && !/\b(no-store|private)\b/i.test(control);
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (!shouldCache(request, url)) return;

  if (request.mode === "navigate") {
    // Network-first keeps the app shell current when connected, but allows
    // previously visited, known routes to open without a connection.
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (isSafeResponse(response) && (response.headers.get("content-type") || "").includes("text/html")) {
          try { await (await caches.open(CACHE_NAME)).put(request, response.clone()); } catch { /* Cache is optional */ }
        }
        return response;
      } catch {
        // Framework HTML may vary by RSC and Accept headers. Only known
        // navigation pages are eligible here, so ignore those variants when offline.
        return (await (await caches.open(CACHE_NAME)).match(normalizePage(url.pathname), { ignoreVary: true }))
          || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
      }
    })());
    return;
  }

  // Immutable/static resources can be used from cache. Never substitute a
  // document response for a missing JavaScript, stylesheet or other asset.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (isSafeResponse(response)) {
        try { await cache.put(request, response.clone()); } catch { /* Quota errors are nonfatal */ }
      }
      return response;
    } catch {
      return new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
    }
  })());
});
