const CACHE_NAME = "studygram-v2-cache";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/icon.svg",
  "./src/styles/base.css",
  "./src/styles/app.css",
  "./src/app.js",
  "./src/core/storage.js",
  "./src/core/utils.js",
  "./src/core/matcher.js",
  "./src/core/scheduler.js",
  "./src/core/decks.js",
  "./src/core/quiz.js",
  "./src/ui/dom.js",
  "./src/ui/render.js",
  "./data/shared-decks/index.json",
  "./data/shared-decks/chem-final.json",
  "./data/shared-decks/physics-mid.json"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))))
  );
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
      return response;
    }).catch(() => caches.match(event.request).then(cached => cached || caches.match("./index.html")))
  );
});
