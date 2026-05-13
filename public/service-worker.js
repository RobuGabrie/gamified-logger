const CACHE_VERSION = "v3";
const SHELL_CACHE = `gogo-shell-${CACHE_VERSION}`;
const RUNTIME_CACHE = `gogo-runtime-${CACHE_VERSION}`;
const URLS_TO_CACHE = ["/", "/manifest.json"];

const isHtmlRequest = (request) =>
  request.mode === "navigate" ||
  (request.headers.get("accept") || "").includes("text/html");

const isStaticAsset = (request) =>
  ["style", "script", "font", "image"].includes(request.destination);

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(URLS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (![SHELL_CACHE, RUNTIME_CACHE].includes(key)) {
            return caches.delete(key);
          }
          return Promise.resolve();
        })
      )
    ).then(() => self.clients.claim())
  );
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") {
    return;
  }

  if (isHtmlRequest(event.request)) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          const cloned = networkResponse.clone();
          caches.open(SHELL_CACHE).then((cache) => {
            cache.put(event.request, cloned);
          });
          return networkResponse;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  if (isStaticAsset(event.request)) {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        const fetchPromise = fetch(event.request)
          .then((networkResponse) => {
            const cloned = networkResponse.clone();
            caches.open(RUNTIME_CACHE).then((cache) => {
              cache.put(event.request, cloned);
            });
            return networkResponse;
          })
          .catch(() => undefined);

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  event.respondWith(fetch(event.request).catch(() => caches.match(event.request)));
});
