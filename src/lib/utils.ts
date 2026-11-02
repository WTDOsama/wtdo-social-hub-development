/** أدوات مشتركة: تحقق، تطبيع بحث، إطلاق التطبيقات، نسخ احتياطي */
import { BRANDS } from "../data/brands";
import { ACCENTS, DEFAULT_SETTINGS, REAL_CATEGORIES, colorForName, makeDefaultApps } from "../data/apps";
import type { AppDraft, BackupFile, HubApp, HubSettings, HubState, IconSpec } from "../types";

export function uid(): string {
  try {
    if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  } catch {
    /* تجاهل */
  }
  return `app-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}`;
}

/** تطبيع النص العربي لتحسين البحث (همزات، تشكيل، ة/ه، ى/ي) */
export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .trim();
}

export type UrlCheck = { ok: true; url: string } | { ok: false; error: string };

/** يقبل فقط روابط HTTP/HTTPS صالحة، ويضيف https تلقائيًا عند غياب البروتوكول */
export function validateUrl(input: string): UrlCheck {
  const trimmed = (input ?? "").trim();
  if (!trimmed) return { ok: false, error: "أدخل رابط التطبيق أو الموقع" };
  if (/\s/.test(trimmed)) return { ok: false, error: "الرابط يجب ألا يحتوي على مسافات" };
  const candidate = /^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed) ? trimmed : `https://${trimmed}`;
  let parsed: URL;
  try {
    parsed = new URL(candidate);
  } catch {
    return { ok: false, error: "الرابط غير صالح — مثال: https://example.com" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { ok: false, error: "يُقبل فقط روابط http أو https" };
  }
  if (parsed.username || parsed.password) {
    return { ok: false, error: "لا تُضمّن أسماء مستخدم أو كلمات مرور في الرابط" };
  }
  if (!parsed.hostname.includes(".") && parsed.hostname !== "localhost") {
    return { ok: false, error: "الرابط غير مكتمل — مثال: https://example.com" };
  }
  return { ok: true, url: parsed.href };
}

/* ---------- تنظيف البيانات والتحقق منها ---------- */

export function sanitizeIcon(raw: unknown, name: string): IconSpec {
  if (raw && typeof raw === "object") {
    const icon = raw as Record<string, unknown>;
    if (icon.kind === "brand" && typeof icon.key === "string" && BRANDS[icon.key]) {
      return { kind: "brand", key: icon.key };
    }
    if (icon.kind === "emoji" && typeof icon.value === "string" && icon.value.trim()) {
      return { kind: "emoji", value: [...icon.value.trim()].slice(0, 2).join("") };
    }
    if (icon.kind === "image" && typeof icon.dataUrl === "string" && /^data:image\/(png|jpe?g|webp|gif|svg\+xml);/.test(icon.dataUrl) && icon.dataUrl.length < 400_000) {
      return { kind: "image", dataUrl: icon.dataUrl };
    }
    if (icon.kind === "letter" && typeof icon.value === "string") {
      const color = typeof icon.color === "string" && /^#[0-9a-fA-F]{6}$/.test(icon.color) ? icon.color : colorForName(name);
      return { kind: "letter", value: icon.value.slice(0, 2) || name.charAt(0), color };
    }
  }
  return { kind: "letter", value: name.trim().charAt(0) || "؟", color: colorForName(name) };
}

export function sanitizeApp(raw: unknown): HubApp | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;
  const name = typeof obj.name === "string" ? obj.name.trim().slice(0, 80) : "";
  if (!name) return null;
  const check = typeof obj.url === "string" ? validateUrl(obj.url) : ({ ok: false } as UrlCheck);
  if (!check.ok) return null;
  const category = REAL_CATEGORIES.includes(obj.category as never) ? (obj.category as HubApp["category"]) : "websites";
  return {
    id: typeof obj.id === "string" && obj.id.length > 0 && obj.id.length <= 80 ? obj.id : uid(),
    name,
    url: check.url,
    description: typeof obj.description === "string" && obj.description.trim() ? obj.description.trim().slice(0, 160) : undefined,
    category,
    icon: sanitizeIcon(obj.icon, name),
    favorite: Boolean(obj.favorite),
    hidden: Boolean(obj.hidden),
    keywords: Array.isArray(obj.keywords) ? obj.keywords.filter((k): k is string => typeof k === "string").slice(0, 12) : undefined,
    androidPackage:
      typeof obj.androidPackage === "string" && /^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+$/.test(obj.androidPackage)
        ? obj.androidPackage
        : undefined,
    createdAt: typeof obj.createdAt === "number" && Number.isFinite(obj.createdAt) ? obj.createdAt : Date.now(),
  };
}

export function sanitizeSettings(raw: unknown): HubSettings {
  const base = { ...DEFAULT_SETTINGS };
  if (!raw || typeof raw !== "object") return base;
  const obj = raw as Record<string, unknown>;
  if (typeof obj.hubName === "string" && obj.hubName.trim()) base.hubName = obj.hubName.trim().slice(0, 60);
  if (typeof obj.ownerName === "string" && obj.ownerName.trim()) base.ownerName = obj.ownerName.trim().slice(0, 40);
  if (typeof obj.accent === "string" && obj.accent in ACCENTS) base.accent = obj.accent as HubSettings["accent"];
  if (obj.cardSize === "compact" || obj.cardSize === "comfortable" || obj.cardSize === "large") base.cardSize = obj.cardSize;
  if (typeof obj.showDescriptions === "boolean") base.showDescriptions = obj.showDescriptions;
  if (typeof obj.showQuickAccess === "boolean") base.showQuickAccess = obj.showQuickAccess;
  const filters = ["all", "favorites", ...REAL_CATEGORIES];
  if (typeof obj.defaultCategory === "string" && filters.includes(obj.defaultCategory)) {
    base.defaultCategory = obj.defaultCategory as HubSettings["defaultCategory"];
  }
  return base;
}

/** يحمّل الحالة من التخزين المحلي مع تنظيف كامل، أو يعيد الافتراضية */
export function stateFromRaw(raw: unknown): HubState {
  const fallback: HubState = { version: 1, apps: makeDefaultApps(), settings: { ...DEFAULT_SETTINGS }, recentIds: [] };
  if (!raw || typeof raw !== "object") return fallback;
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj.apps)) return fallback;
  const seen = new Set<string>();
  const apps: HubApp[] = [];
  for (const item of obj.apps) {
    const app = sanitizeApp(item);
    if (!app) continue;
    if (seen.has(app.id)) app.id = uid();
    seen.add(app.id);
    apps.push(app);
  }
  const recentIds = Array.isArray(obj.recentIds)
    ? obj.recentIds.filter((id): id is string => typeof id === "string" && seen.has(id)).slice(0, 8)
    : [];
  return { version: 1, apps, settings: sanitizeSettings(obj.settings), recentIds };
}

/* ---------- النسخ الاحتياطي ---------- */

export function buildBackup(state: HubState): BackupFile {
  return {
    app: "wtdo-social-hub",
    version: 1,
    exportedAt: new Date().toISOString(),
    apps: state.apps,
    settings: state.settings,
  };
}

/** يتحقق بصرامة من ملف النسخة الاحتياطية قبل استيراد أي شيء */
export function parseBackup(text: string): { apps: HubApp[]; settings: HubSettings } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("الملف ليس JSON صالحًا");
  }
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("بنية الملف غير صحيحة");
  }
  const obj = data as Record<string, unknown>;
  if (obj.version !== 1) throw new Error("إصدار النسخة الاحتياطية غير مدعوم");
  if (!Array.isArray(obj.apps)) throw new Error("الملف لا يحتوي على قائمة تطبيقات");
  const seen = new Set<string>();
  const apps: HubApp[] = [];
  for (let i = 0; i < obj.apps.length; i++) {
    const app = sanitizeApp(obj.apps[i]);
    if (!app) throw new Error(`التطبيق رقم ${i + 1} غير صالح (اسم أو رابط مفقود/غير مقبول)`);
    if (seen.has(app.id)) app.id = uid();
    seen.add(app.id);
    apps.push(app);
  }
  return { apps, settings: sanitizeSettings(obj.settings) };
}

export function downloadBackup(state: HubState): string {
  const json = JSON.stringify(buildBackup(state), null, 2);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  const stamp = new Date().toISOString().slice(0, 10);
  anchor.href = url;
  anchor.download = `wtdo-social-hub-backup-${stamp}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
  return json;
}

/* ---------- إطلاق التطبيقات ---------- */

export interface LaunchPlan {
  url: string;
  fallback: string;
  kind: "android-intent" | "web";
}

/**
 * أندرويد: Intent رسمي بحزمة التطبيق مع browser_fallback_url يضمن فتح الموقع
 * إذا لم يكن التطبيق مثبتًا (تتعامل كروم مع الحالة أصلًا دون أخطاء).
 * iOS: روابط HTTPS العامة (Universal Links) تفتح التطبيق الأصلي تلقائيًا إن كان مثبتًا.
 * سطح المكتب: الموقع الرسمي في تبويب آمن.
 */
export function buildLaunchPlan(app: HubApp, userAgent?: string): LaunchPlan {
  const ua = userAgent ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");
  const isAndroid = /Android/i.test(ua);
  if (isAndroid && app.androidPackage) {
    try {
      const u = new URL(app.url);
      const intent =
        `intent://${u.host}${u.pathname}${u.search}` +
        `#Intent;scheme=${u.protocol.replace(":", "")};package=${app.androidPackage};` +
        `S.browser_fallback_url=${encodeURIComponent(app.url)};end`;
      return { url: intent, fallback: app.url, kind: "android-intent" };
    } catch {
      /* رابط غير صالح — تراجع للموقع */
    }
  }
  return { url: app.url, fallback: app.url, kind: "web" };
}

/**
 * يفتح تبويبًا خارجيًا آمنًا ويقطع علاقة opener فورًا (حماية مكافئة لـ noopener).
 * ملاحظة: window.open مع خاصية noopener يعيد null دائمًا حتى عند النجاح،
 * لذلك نقطع opener يدويًا ليمكن تمييز الحجب الحقيقي عن الفتح الناجح.
 * لا تُستخدم iframe إطلاقًا.
 */
function openSafeTab(url: string): boolean {
  let win: Window | null = null;
  try {
    win = window.open(url, "_blank");
  } catch {
    win = null;
  }
  if (win) {
    try {
      win.opener = null;
    } catch {
      /* بعض المنصات تمنع الوصول — المتصفح يعزل التبويب أصلًا */
    }
    return true;
  }
  return false;
}

export function launchApp(app: HubApp): LaunchPlan {
  const plan = buildLaunchPlan(app);
  if (openSafeTab(plan.url)) return plan;
  // حجب النوافذ مع رابط Intent: جرّب الموقع الرسمي مباشرة
  if (plan.kind === "android-intent" && openSafeTab(plan.fallback)) return plan;
  // الملاذ الأخير: تنقل التبويب الحالي للموقع الرسمي
  window.location.assign(plan.fallback);
  return plan;
}

/* ---------- ترتيب وعرض ---------- */

export function moveById(apps: HubApp[], dragId: string, targetId: string): HubApp[] {
  if (dragId === targetId) return apps;
  const from = apps.findIndex((a) => a.id === dragId);
  const to = apps.findIndex((a) => a.id === targetId);
  if (from < 0 || to < 0) return apps;
  const next = [...apps];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function nudgeById(apps: HubApp[], id: string, dir: -1 | 1): HubApp[] {
  const index = apps.findIndex((a) => a.id === id);
  const target = index + dir;
  if (index < 0 || target < 0 || target >= apps.length) return apps;
  const next = [...apps];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

const arNumber = new Intl.NumberFormat("ar-EG");

export function formatNumber(n: number): string {
  return arNumber.format(n);
}

export function appCountLabel(n: number): string {
  if (n === 0) return "لا توجد تطبيقات";
  if (n === 1) return "تطبيق واحد";
  if (n === 2) return "تطبيقان";
  if (n >= 3 && n <= 10) return `${arNumber.format(n)} تطبيقات`;
  return `${arNumber.format(n)} تطبيقًا`;
}

export function formatToday(): string {
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());
}

export function greeting(): string {
  const hour = new Date().getHours();
  return hour < 12 ? "صباح الخير" : "مساء الخير";
}

export function draftFromApp(app: HubApp): AppDraft {
  return {
    name: app.name,
    url: app.url,
    description: app.description ?? "",
    category: app.category,
    icon: { ...app.icon },
    favorite: app.favorite,
    hidden: app.hidden,
    androidPackage: app.androidPackage,
  };
}