// Service Worker — Functional Tribe PWA
const CACHE = "ft-v1";
const STATIC = ["/", "/index.html", "/style.css", "/app.js", "/manifest.json"];

self.addEventListener("install", e =>
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(STATIC)))
);

self.addEventListener("fetch", e => {
  // Solo cachear GET, dejar pasar las llamadas a la API
  if (e.request.method !== "GET" || e.request.url.includes("/api/") || e.request.url.includes(":8000")) {
    return;
  }
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
