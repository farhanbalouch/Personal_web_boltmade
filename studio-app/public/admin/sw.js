// Dedicated Studio origin only. Never register this on farhanbalouch.com.
const CACHE = "farhan-studio-v3";
const SHELL = "/admin/";
self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    const response = await fetch(SHELL, { cache: "reload" });
    if (!response.ok || !response.headers.get("content-type")?.includes("text/html"))
      throw new Error("Studio shell is unavailable");
    const html = await response.clone().text();
    await cache.put(SHELL, response);
    // Include first-load bundles: an installed app must have an offline shell
    // even when these bundles loaded before its worker took control.
    const assets = [...html.matchAll(/(?:src|href)=["'](\/assets\/[^"']+)["']/g)].map((m) => m[1]);
    await cache.addAll([...new Set([
      "/manifest.webmanifest", "/admin/icons/icon-192.png",
      "/admin/icons/icon-512.png", "/admin/icons/icon-maskable.png", ...assets,
    ])]);
    await self.skipWaiting();
  })());
});
self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k.startsWith("farhan-studio-") && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "STUDIO_CLAIM") event.waitUntil(self.clients.claim());
});
self.addEventListener("fetch", (event) => {
  const request = event.request, url = new URL(request.url);
  // Credentials, private data and publishing always go to the network.
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).then((response) => {
      if (response.ok && response.headers.get("content-type")?.includes("text/html")) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then((cache) => cache.put(SHELL, copy)));
      }
      return response;
    }).catch(async () => (await caches.match(SHELL)) || new Response("Reconnect to open Farhan Studio.", {status: 503})));
    return;
  }
  if (url.pathname.startsWith("/assets/") || url.pathname.startsWith("/admin/icons/")) {
    event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
      if (response.ok) {
        const copy = response.clone();
        event.waitUntil(caches.open(CACHE).then((cache) => cache.put(request, copy)));
      }
      return response;
    })));
  }
});
