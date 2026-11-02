/**
 * اختبار متصفح حقيقي (Chromium عبر Playwright) على مخرجات البناء dist.
 * يغطي: التحميل، تسجيل Service Worker فعليًا، العمل دون اتصال بعد التخزين،
 * فتح التطبيقات في تبويب خارجي، البحث، الاستجابة (جوال/سطح مكتب)، وأخطاء الكونسول.
 * التشغيل: npm run build ثم node scripts/e2e.mjs
 */
import { chromium } from "playwright";
import http from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");
const shots = join(root, "screenshots");
import { mkdirSync } from "node:fs";
mkdirSync(shots, { recursive: true });

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript",
  ".webmanifest": "application/manifest+json",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".json": "application/json",
};

const server = http.createServer((req, res) => {
  const path = decodeURIComponent(new URL(req.url, "http://localhost").pathname);
  let file = join(dist, path);
  if (path === "/" || !existsSync(file)) file = join(dist, "index.html");
  res.writeHead(200, { "Content-Type": MIME[extname(file)] ?? "application/octet-stream" });
  res.end(readFileSync(file));
});
await new Promise((resolve) => server.listen(4174, resolve));
const BASE = "http://localhost:4174";

let failures = 0;
function check(name, condition) {
  console.log(`${condition ? "✓" : "✗"} ${name}`);
  if (!condition) failures++;
}

const browser = await chromium.launch();

/* ---------- سطح المكتب 1440×900 ---------- */
const desktop = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: "ar" });
const page = await desktop.newPage();
const pageErrors = [];
const consoleErrors = [];
page.on("pageerror", (error) => pageErrors.push(String(error)));
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

await page.goto(BASE, { waitUntil: "load" });
await page.waitForSelector('[data-testid="apps-grid"]');
const cardLocator = page.locator('[data-testid="apps-grid"] > [role="button"]');
check("سطح المكتب: تحميل اللوحة بالعنوان الصحيح", (await page.title()).includes("WTDO Social Hub"));
check("سطح المكتب: ظهور التطبيقات الـ15", (await cardLocator.count()) === 15);
check("سطح المكتب: الشريط الجانبي ظاهر", await page.getByRole("navigation", { name: "التنقل الرئيسي" }).isVisible());
check("سطح المكتب: لا تمرير أفقي", await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));

/* تسجيل Service Worker حقيقي */
const swActive = await page.evaluate(async () => {
  const registration = await Promise.race([
    navigator.serviceWorker.ready,
    new Promise((_, reject) => setTimeout(() => reject(new Error("SW timeout")), 12000)),
  ]).catch(() => null);
  return registration ? Boolean(registration.active) : false;
});
check("PWA: Service Worker سجّل ونشط في المتصفح", swActive);

const controlled = await page.evaluate(async () => {
  for (let i = 0; i < 40; i++) {
    if (navigator.serviceWorker.controller) return true;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  return Boolean(navigator.serviceWorker.controller);
});
check("PWA: الصفحة أصبحت تحت تحكم SW (claim)", controlled);

/* فتح تطبيق في تبويب خارجي آمن */
const [popup] = await Promise.all([
  desktop.waitForEvent("page", { timeout: 10000 }),
  page.getByRole("button", { name: "فتح واتساب", exact: true }).click(),
]);
check("الإطلاق: واتساب فُتح في تبويب جديد بالرابط الرسمي", popup.url().startsWith("https://web.whatsapp.com"));
await popup.close();
check("الإطلاق: التبويب الأصلي بقي على اللوحة دون انتقال", page.url().startsWith(BASE));

/* البحث في متصفح حقيقي */
await page.getByRole("searchbox").fill("واتس");
check("البحث: تصفية فورية إلى تطبيقين", (await cardLocator.count()) === 2);
await page.getByRole("button", { name: "مسح البحث" }).first().click();
check("البحث: المسح يعيد الـ15", (await cardLocator.count()) === 15);

await page.waitForTimeout(900); // استقرار حركات الظهور المتدرجة
await page.screenshot({ path: join(shots, "desktop.png"), fullPage: false });

/* العمل دون اتصال — قطع شبكة حقيقي على مستوى المتصفح */
await desktop.setOffline(true);
await page.reload({ waitUntil: "load" });
await page.waitForSelector('[data-testid="apps-grid"]', { timeout: 10000 });
check("دون اتصال: اللوحة أُعيد تحميلها كاملة من التخزين", (await cardLocator.count()) === 15);
check("دون اتصال: لافتة انقطاع الاتصال ظاهرة", await page.getByText(/أنت غير متصل بالإنترنت/).first().isVisible());
await page.screenshot({ path: join(shots, "desktop-offline.png") });
await desktop.setOffline(false);

check("سطح المكتب: صفر أخطاء JavaScript", pageErrors.length === 0);
const realConsoleErrors = consoleErrors.filter((text) => !text.includes("net::ERR_INTERNET_DISCONNECTED") && !text.includes("Failed to load resource"));
check("سطح المكتب: صفر أخطاء كونسول (خارج أخطاء الشبكة المتوقعة)", realConsoleErrors.length === 0);
if (realConsoleErrors.length) console.log("Console errors:", realConsoleErrors.slice(0, 5));

/* ---------- جوال 390×844 (أندرويد) ---------- */
const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  isMobile: true,
  hasTouch: true,
  deviceScaleFactor: 2,
  locale: "ar",
  userAgent: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
});
const mPage = await mobile.newPage();
const mobileErrors = [];
mPage.on("pageerror", (error) => mobileErrors.push(String(error)));
await mPage.goto(BASE, { waitUntil: "load" });
await mPage.waitForSelector('[data-testid="apps-grid"]');

const mCards = mPage.locator('[data-testid="apps-grid"] > [role="button"]');
check("جوال: التطبيقات الـ15 ظاهرة", (await mCards.count()) === 15);
const columns = await mPage.evaluate(() => getComputedStyle(document.querySelector('[data-testid="apps-grid"]')).gridTemplateColumns.split(" ").length);
check("جوال: شبكة من ثلاثة أعمدة", columns === 3);
check("جوال: لا تمرير أفقي", await mPage.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1));
check("جوال: التنقل السفلي ظاهر والجانبي مخفي", (await mPage.getByRole("navigation", { name: "التنقل السفلي" }).isVisible()) && !(await mPage.getByRole("navigation", { name: "التنقل الرئيسي" }).isVisible()));

await mPage.waitForTimeout(900);
await mPage.screenshot({ path: join(shots, "mobile.png") });

/* تنقل الجوال + صفحة الإدارة */
await mPage.getByRole("navigation", { name: "التنقل السفلي" }).getByRole("button", { name: "الإدارة" }).click();
check("جوال: صفحة الإدارة تعمل", await mPage.getByRole("heading", { name: /إدارة التطبيقات/ }).isVisible());
await mPage.waitForTimeout(600);
await mPage.screenshot({ path: join(shots, "mobile-manage.png") });

/* SW + عدم اتصال على الجوال أيضًا (إعادة التحميل تعود للوحة الرئيسية) */
await mPage.evaluate(() => navigator.serviceWorker.ready);
await mPage.evaluate(async () => {
  for (let i = 0; i < 40; i++) {
    if (navigator.serviceWorker.controller) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
});
await mobile.setOffline(true);
await mPage.reload({ waitUntil: "load" });
await mPage.waitForSelector('[data-testid="apps-grid"]', { timeout: 10000 });
check("جوال دون اتصال: اللوحة تعمل كاملة من التخزين", (await mPage.locator('[data-testid="apps-grid"] > [role="button"]').count()) === 15);
await mPage.screenshot({ path: join(shots, "mobile-offline.png") });
await mobile.setOffline(false);
check("جوال: صفر أخطاء JavaScript", mobileErrors.length === 0);

await browser.close();
server.close();

console.log(failures === 0 ? "\n🎉 كل اختبارات المتصفح الحقيقي نجحت" : `\n❌ ${failures} اختبار فشل`);
process.exit(failures === 0 ? 0 : 1);