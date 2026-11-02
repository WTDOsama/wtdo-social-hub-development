import { describe, expect, it } from "vitest";
import { buildLaunchPlan, moveById, normalizeText, nudgeById, parseBackup, sanitizeSettings, validateUrl } from "../lib/utils";
import { makeDefaultApps } from "../data/apps";
import type { HubApp } from "../types";

describe("validateUrl — قبول http/https فقط", () => {
  it("يقبل https صالح", () => {
    const result = validateUrl("https://example.com");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.url).toBe("https://example.com/");
  });

  it("يضيف https تلقائيًا عند غياب البروتوكول", () => {
    const result = validateUrl("discord.com");
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.url).toBe("https://discord.com/");
  });

  it("يرفض javascript: و data: و ftp:", () => {
    expect(validateUrl("javascript:alert(1)").ok).toBe(false);
    expect(validateUrl("data:text/html,<script>").ok).toBe(false);
    expect(validateUrl("ftp://files.example.com").ok).toBe(false);
  });

  it("يرفض الفراغ والنصوص غير الروابط وبيانات الاعتماد", () => {
    expect(validateUrl("").ok).toBe(false);
    expect(validateUrl("كلام عادي").ok).toBe(false);
    expect(validateUrl("https://").ok).toBe(false);
    expect(validateUrl("https://user:pass@example.com").ok).toBe(false);
  });

  it("يقبل http العادي", () => {
    expect(validateUrl("http://example.com/page").ok).toBe(true);
  });
});

describe("normalizeText — البحث العربي", () => {
  it("يوحد الهمزات والتاء المربوطة ويحذف التشكيل", () => {
    expect(normalizeText("أحمد")).toBe(normalizeText("احمد"));
    expect(normalizeText("مَكَّة")).toBe(normalizeText("مكه"));
    expect(normalizeText("إنستغرام")).toBe(normalizeText("انستغرام"));
  });
});

describe("buildLaunchPlan — استراتيجية الإطلاق", () => {
  const whatsapp = makeDefaultApps().find((a) => a.id === "whatsapp") as HubApp;
  const androidUA = "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/120 Mobile Safari/537.36";
  const iphoneUA = "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15";
  const desktopUA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120 Safari/537.36";

  it("أندرويد: Intent بالحزمة الرسمية مع تراجع مضمون للموقع", () => {
    const plan = buildLaunchPlan(whatsapp, androidUA);
    expect(plan.kind).toBe("android-intent");
    expect(plan.url).toContain("intent://web.whatsapp.com/");
    expect(plan.url).toContain("package=com.whatsapp");
    expect(plan.url).toContain(`S.browser_fallback_url=${encodeURIComponent("https://web.whatsapp.com/")}`);
    expect(plan.fallback).toBe("https://web.whatsapp.com/");
  });

  it("iOS: الرابط العام (Universal Link) كما هو", () => {
    const plan = buildLaunchPlan(whatsapp, iphoneUA);
    expect(plan.kind).toBe("web");
    expect(plan.url).toBe("https://web.whatsapp.com/");
  });

  it("سطح المكتب: الموقع الرسمي مباشرة", () => {
    const plan = buildLaunchPlan(whatsapp, desktopUA);
    expect(plan.kind).toBe("web");
    expect(plan.url).toBe("https://web.whatsapp.com/");
  });

  it("بدون حزمة أندرويد: موقع حتى على أندرويد", () => {
    const custom: HubApp = { ...whatsapp, androidPackage: undefined };
    expect(buildLaunchPlan(custom, androidUA).kind).toBe("web");
  });
});

describe("parseBackup — التحقق من ملفات الاستيراد", () => {
  const valid = JSON.stringify({
    app: "wtdo-social-hub",
    version: 1,
    exportedAt: new Date().toISOString(),
    apps: makeDefaultApps().slice(0, 2),
    settings: { accent: "gold" },
  });

  it("يقبل ملفًا صالحًا ويطبّق الإعدادات الممررة", () => {
    const result = parseBackup(valid);
    expect(result.apps).toHaveLength(2);
    expect(result.settings.accent).toBe("gold");
    expect(result.settings.hubName).toBe("WTDO Social Hub");
  });

  it("يرفض JSON تالفًا", () => {
    expect(() => parseBackup("{ليس جيسون")).toThrow("الملف ليس JSON صالحًا");
  });

  it("يرفض إصدارًا غير مدعوم وبنية خاطئة", () => {
    expect(() => parseBackup(JSON.stringify({ version: 99, apps: [] }))).toThrow("إصدار النسخة الاحتياطية غير مدعوم");
    expect(() => parseBackup(JSON.stringify({ version: 1 }))).toThrow("الملف لا يحتوي على قائمة تطبيقات");
    expect(() => parseBackup("[]")).toThrow("بنية الملف غير صحيحة");
  });

  it("يرفض تطبيقًا برابط خطير", () => {
    const bad = JSON.stringify({ version: 1, apps: [{ name: "شرير", url: "javascript:alert(1)" }] });
    expect(() => parseBackup(bad)).toThrow("التطبيق رقم 1 غير صالح");
  });

  it("يعالج المعرفات المكررة بتوليد معرف جديد", () => {
    const app = makeDefaultApps()[0];
    const dup = JSON.stringify({ version: 1, apps: [app, app] });
    const result = parseBackup(dup);
    expect(result.apps[0].id).not.toBe(result.apps[1].id);
  });
});

describe("sanitizeSettings", () => {
  it("يتجاهل القيم غير الصالحة ويعيد الافتراضي", () => {
    const result = sanitizeSettings({ accent: "neon-pink", cardSize: "gigantic", hubName: "  ", showDescriptions: "yes" });
    expect(result.accent).toBe("teal");
    expect(result.cardSize).toBe("comfortable");
    expect(result.hubName).toBe("WTDO Social Hub");
    expect(result.showDescriptions).toBe(true);
  });
});

describe("الترتيب", () => {
  const apps = makeDefaultApps();

  it("moveById ينقل العنصر لموضع الهدف", () => {
    const result = moveById(apps, "pinterest", "whatsapp");
    expect(result[0].id).toBe("pinterest");
    expect(result).toHaveLength(apps.length);
  });

  it("nudgeById يبدل مع الجار ويتجاهل الحدود", () => {
    expect(nudgeById(apps, "whatsapp", 1)[1].id).toBe("whatsapp");
    expect(nudgeById(apps, "whatsapp", -1)).toBe(apps);
    expect(nudgeById(apps, "pinterest", 1)).toBe(apps);
  });
});