/* WTDO Social Hub — Service Worker
 * استراتيجية التخزين:
 *  - تثبيت: تخزين هيكل اللوحة مسبقًا (صدفة التطبيق تعمل دون اتصال).
 *  - التنقل: الشبكة أولًا مع تراجع إلى النسخة المخزنة من index.html.
 *  - أصول نفس النطاق: stale-while-revalidate.
 *  - خطوط Google: cache-first.
 * ملاحظة: خدمات التواصل الخارجية نفسها تتطلب اتصالًا بالإنترنت.
 */
const CACHE = "wtdo-social-hub-v1";

const PRECACHE = [
  "/",
  "/index.html",
  "/manifest.webmanifest",
  "/icons/logo.svg",
  "/icons/icon-192.png",
  "/icons/icon-512.png",
  "/icons/maskable-512.png",
  "/icons/apple-touch-icon.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      // كل أصل على حدة حتى لا يفشل التثبيت كاملًا بسبب ملف واحد
      await Promise.allSettled(PRECACHE.map((url) => cache.add(url)));
      await self.skipWaiting();
    })()
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return;

  // تنقل الصفحات: الشبكة أولًا، ثم الصدفة المخزنة عند انقطاع الاتصال
  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request);
          if (fresh && fresh.ok) {
            const cache = await caches.open(CACHE);
            cache.put("/index.html", fresh.clone()).catch(() => {});
          }
          return fresh;
        } catch {
          const cached = (await caches.match("/index.html")) || (await caches.match("/"));
          return cached || new Response("Offline", { status: 503, headers: { "Content-Type": "text/plain" } });
        }
      })()
    );
    return;
  }

  // أصول التطبيق من نفس النطاق
  if (url.origin === self.location.origin) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        const refresh = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
            }
            return response;
          })
          .catch(() => cached);
        return cached || refresh;
      })()
    );
    return;
  }

  // خطوط Google — تُخزن بعد أول تحميل لتعمل الواجهة كاملة دون اتصال
  if (url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com") {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        if (response && (response.ok || response.type === "opaque")) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {});
        }
        return response;
      })()
    );
  }
});