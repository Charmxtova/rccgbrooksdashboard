/*
 * Deliberately caches almost nothing.
 *
 * This dashboard is password gated and every figure is read live from the
 * attendance sheet, so a cache-first worker would be actively harmful: it could
 * serve yesterday's numbers as though they were today's, or hand a signed out
 * phone a page it should no longer see. Pages and API calls therefore always go
 * to the network.
 *
 * What it does provide is the fetch handler Android needs before it will offer
 * to install the app, plus a plain offline page so a phone with no signal gets
 * an explanation instead of the browser's error screen.
 */
const CACHE = "brooks-shell-v1";
const OFFLINE_URL = "/offline.html";

const PRECACHE = [
  OFFLINE_URL,
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable-512.png",
  "/apple-touch-icon.png",
  "/logo.jpg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(PRECACHE)).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Only GET is ever considered. Sign in and refresh are POSTs and must always
  // reach the server.
  if (request.method !== "GET") return;

  // Page loads: network only, falling back to the offline page. Never cached,
  // so a signed out phone cannot be handed a stale dashboard.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // The handful of images that never change can come from the cache.
  const url = new URL(request.url);
  if (url.origin === self.location.origin && PRECACHE.includes(url.pathname)) {
    event.respondWith(caches.match(request).then((hit) => hit || fetch(request)));
  }

  // Everything else, including the sheet data, falls through to the network.
});
