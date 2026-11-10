const CACHE = "commutehub-v4";
const SHELL = ["/", "/home", "/offline"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // pages: network first, fall back to cache then the offline page
  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((r) => { caches.open(CACHE).then((c) => c.put(req, r.clone())); return r; }).catch(() => caches.match(req).then((r) => r || caches.match("/offline"))));
    return;
  }
  // static assets and map tiles: cache first, refresh in the background (keeps slow data usable)
  const cacheable = url.pathname.startsWith("/_next/static") || url.hostname.endsWith("basemaps.cartocdn.com") || /\.(png|svg|woff2?)$/.test(url.pathname);
  if (cacheable) {
    e.respondWith(
      caches.match(req).then((hit) => {
        const net = fetch(req).then((r) => { if (r.ok) caches.open(CACHE).then((c) => c.put(req, r.clone())); return r; }).catch(() => hit);
        return hit || net;
      }),
    );
  }
});
