// @vitest-environment node
/**
 * اختبارات PWA على مخرجات البناء الفعلية (dist):
 * 1) صحة Manifest والأيقونات وأحجامها الحقيقية.
 * 2) تنفيذ منطق Service Worker فعليًا داخل VM مع محاكاة Cache API والشبكة.
 * ملاحظة: تسجيل SW في متصفح حقيقي والتثبيت على جهاز يتطلبان اختبارًا يدويًا.
 */
import { describe, expect, it } from "vitest";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import vm from "node:vm";
import sharp from "sharp";

const dist = join(process.cwd(), "dist");

describe("Manifest وأيقونات PWA (من dist الفعلية)", () => {
  const manifest = JSON.parse(readFileSync(join(dist, "manifest.webmanifest"), "utf8"));

  it("الحقول الأساسية صحيحة", () => {
    expect(manifest.name).toBe("WTDO Social Hub");
    expect(manifest.short_name).toBe("WTDO Hub");
    expect(manifest.display).toBe("standalone");
    expect(manifest.start_url).toBe("/");
    expect(manifest.scope).toBe("/");
    expect(manifest.theme_color).toBe("#101817");
    expect(manifest.background_color).toBe("#101817");
    expect(manifest.lang).toBe("ar");
    expect(manifest.dir).toBe("rtl");
  });

  it("أيقونات 192 و512 وmaskable موجودة بأحجامها المعلنة الفعلية", async () => {
    const required = [
      { size: 192, purpose: "any" },
      { size: 512, purpose: "any" },
      { size: 512, purpose: "maskable" },
    ];
    for (const req of required) {
      const entry = manifest.icons.find(
        (icon: { sizes: string; purpose: string; type: string }) =>
          icon.sizes === `${req.size}x${req.size}` && icon.purpose === req.purpose && icon.type === "image/png"
      );
      expect(entry, `أيقونة ${req.size} ${req.purpose}`).toBeDefined();
      const filePath = join(dist, entry.src.replace(/^\//, ""));
      expect(existsSync(filePath)).toBe(true);
      const meta = await sharp(filePath).metadata();
      expect(meta.width).toBe(req.size);
      expect(meta.height).toBe(req.size);
    }
  });

  it("index.html يتضمن RTL العربية وربط Manifest وتسجيل SW", () => {
    const html = readFileSync(join(dist, "index.html"), "utf8");
    expect(html).toContain('lang="ar"');
    expect(html).toContain('dir="rtl"');
    expect(html).toContain('rel="manifest"');
    expect(html).toContain("WTDO Social Hub");
    expect(html).toContain("serviceWorker");
    expect(html).toContain("/sw.js");
  });

  it("sw.js والأيقونات منسوخة إلى dist", () => {
    for (const file of ["sw.js", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png", "icons/logo.svg"]) {
      expect(existsSync(join(dist, file)), file).toBe(true);
    }
  });
});

/* ---------- محاكاة بيئة Service Worker وتنفيذ كوده الحقيقي ---------- */

function createSWHarness() {
  const ORIGIN = "https://hub.example";
  const SHELL = '<!doctype html><html lang="ar" dir="rtl"><title>WTDO Social Hub</title><body>shell</body></html>';
  const norm = (req: unknown) => {
    const raw = typeof req === "string" ? req : (req as { url: string }).url;
    return new URL(raw, ORIGIN).href;
  };

  const stores = new Map<string, Map<string, Response>>();
  let networkUp = true;
  const fetchLog: string[] = [];

  async function fakeFetch(req: unknown): Promise<Response> {
    const url = norm(req);
    fetchLog.push(url);
    if (!networkUp) throw new TypeError("Failed to fetch (offline)");
    const isShell = url === `${ORIGIN}/` || url === `${ORIGIN}/index.html`;
    return new Response(isShell ? SHELL : `asset:${url}`, { status: 200 });
  }

  function makeCache(name: string) {
    const map = stores.get(name)!;
    return {
      async match(req: unknown) {
        const hit = map.get(norm(req));
        return hit ? hit.clone() : undefined;
      },
      async put(req: unknown, res: Response) {
        map.set(norm(req), res.clone());
      },
      async add(url: string) {
        const res = await fakeFetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        map.set(norm(url), res.clone());
      },
    };
  }

  const cachesMock = {
    async open(name: string) {
      if (!stores.has(name)) stores.set(name, new Map());
      return makeCache(name);
    },
    async match(req: unknown) {
      for (const name of stores.keys()) {
        const hit = await makeCache(name).match(req);
        if (hit) return hit;
      }
      return undefined;
    },
    async keys() {
      return [...stores.keys()];
    },
    async delete(name: string) {
      return stores.delete(name);
    },
  };

  const listeners: Record<string, (event: unknown) => void> = {};
  let skipped = 0;
  let claimed = 0;

  const selfMock = {
    addEventListener: (type: string, fn: (event: unknown) => void) => {
      listeners[type] = fn;
    },
    skipWaiting: async () => {
      skipped++;
    },
    clients: {
      claim: async () => {
        claimed++;
      },
    },
    location: { origin: ORIGIN },
  };

  const context = vm.createContext({
    self: selfMock,
    caches: cachesMock,
    fetch: fakeFetch,
    Response,
    URL,
    Promise,
    console,
    setTimeout,
  });
  vm.runInContext(readFileSync(join(dist, "sw.js"), "utf8"), context);

  return {
    stores,
    ORIGIN,
    SHELL,
    fetchLog,
    setNetwork: (up: boolean) => {
      networkUp = up;
    },
    counters: () => ({ skipped, claimed }),
    async install() {
      let pending: Promise<unknown> | undefined;
      listeners.install({ waitUntil: (p: Promise<unknown>) => (pending = p) });
      await pending;
    },
    async activate() {
      let pending: Promise<unknown> | undefined;
      listeners.activate({ waitUntil: (p: Promise<unknown>) => (pending = p) });
      await pending;
    },
    message(data: unknown) {
      listeners.message({ data });
    },
    async fetchEvent(request: { method: string; url: string; mode?: string }): Promise<Response | undefined> {
      let pending: Promise<Response> | undefined;
      listeners.fetch({ request, respondWith: (p: Promise<Response>) => (pending = p) });
      return pending ? await pending : undefined;
    },
  };
}

describe("Service Worker — تنفيذ فعلي لمنطق التخزين والعمل دون اتصال", () => {
  it("التثبيت يخزّن صدفة اللوحة والـmanifest والأيقونات مسبقًا ثم skipWaiting", async () => {
    const harness = createSWHarness();
    await harness.install();
    const cache = harness.stores.get("wtdo-social-hub-v1");
    expect(cache).toBeDefined();
    const keys = [...cache!.keys()];
    for (const path of ["/", "/index.html", "/manifest.webmanifest", "/icons/icon-192.png", "/icons/icon-512.png", "/icons/maskable-512.png"]) {
      expect(keys).toContain(harness.ORIGIN + path);
    }
    expect(harness.counters().skipped).toBe(1);
  });

  it("التفعيل يحذف التخزينات القديمة ويسيطر على العملاء", async () => {
    const harness = createSWHarness();
    await harness.install();
    harness.stores.set("wtdo-social-hub-v0-قديم", new Map());
    await harness.activate();
    expect([...harness.stores.keys()]).toEqual(["wtdo-social-hub-v1"]);
    expect(harness.counters().claimed).toBe(1);
  });

  it("دون اتصال: التنقل يعيد صدفة اللوحة المخزنة (العمل دون إنترنت)", async () => {
    const harness = createSWHarness();
    await harness.install();
    harness.setNetwork(false);
    const response = await harness.fetchEvent({ method: "GET", mode: "navigate", url: `${harness.ORIGIN}/` });
    expect(response).toBeDefined();
    expect(response!.status).toBe(200);
    expect(await response!.text()).toBe(harness.SHELL);
  });

  it("دون اتصال: أصول نفس النطاق تُقدَّم من التخزين", async () => {
    const harness = createSWHarness();
    await harness.install();
    harness.setNetwork(false);
    const response = await harness.fetchEvent({ method: "GET", mode: "no-cors", url: `${harness.ORIGIN}/icons/icon-192.png` });
    expect(response).toBeDefined();
    expect(await response!.text()).toBe(`asset:${harness.ORIGIN}/icons/icon-192.png`);
  });

  it("خطوط Google تُخزن عند أول طلب وتُقدَّم من التخزين لاحقًا دون شبكة", async () => {
    const harness = createSWHarness();
    await harness.install();
    const fontUrl = "https://fonts.gstatic.com/s/alexandria/v3/font.woff2";
    const first = await harness.fetchEvent({ method: "GET", mode: "cors", url: fontUrl });
    expect(first).toBeDefined();
    const callsAfterFirst = harness.fetchLog.filter((url) => url === fontUrl).length;
    harness.setNetwork(false);
    const second = await harness.fetchEvent({ method: "GET", mode: "cors", url: fontUrl });
    expect(second).toBeDefined();
    expect(harness.fetchLog.filter((url) => url === fontUrl).length).toBe(callsAfterFirst); // لم يلمس الشبكة
  });

  it("طلبات غير GET وطلبات النطاقات الخارجية الأخرى تُترك للمتصفح", async () => {
    const harness = createSWHarness();
    await harness.install();
    expect(await harness.fetchEvent({ method: "POST", url: `${harness.ORIGIN}/api` })).toBeUndefined();
    expect(await harness.fetchEvent({ method: "GET", mode: "cors", url: "https://www.youtube.com/" })).toBeUndefined();
  });

  it("رسالة SKIP_WAITING تفعّل التحديث الفوري", async () => {
    const harness = createSWHarness();
    await harness.install();
    const before = harness.counters().skipped;
    harness.message("SKIP_WAITING");
    expect(harness.counters().skipped).toBe(before + 1);
  });
});