/**
 * البيانات المركزية للتطبيقات — لا تُكتب أي بيانات تطبيقات داخل المكوّنات المرئية.
 */
import {
  LayoutGrid,
  Star,
  Users,
  MessageCircle,
  Clapperboard,
  BriefcaseBusiness,
  Globe,
  type LucideIcon,
} from "lucide-react";
import type { AccentId, AppDraft, CategoryId, FilterId, HubApp, HubSettings } from "../types";

export interface CategoryMeta {
  id: FilterId;
  label: string;
  icon: LucideIcon;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: "all", label: "الكل", icon: LayoutGrid },
  { id: "favorites", label: "المفضلة", icon: Star },
  { id: "social", label: "التواصل الاجتماعي", icon: Users },
  { id: "messaging", label: "المراسلة", icon: MessageCircle },
  { id: "video", label: "الفيديو والترفيه", icon: Clapperboard },
  { id: "productivity", label: "الإنتاجية", icon: BriefcaseBusiness },
  { id: "websites", label: "المواقع", icon: Globe },
];

export const CATEGORY_LABELS: Record<FilterId, string> = Object.fromEntries(
  CATEGORIES.map((c) => [c.id, c.label])
) as Record<FilterId, string>;

export const REAL_CATEGORIES: CategoryId[] = ["social", "messaging", "video", "productivity", "websites"];

export const ACCENTS: Record<AccentId, { label: string; accent: string; deep: string }> = {
  teal: { label: "تركوازي (الافتراضي)", accent: "#14B8A6", deep: "#0F766E" },
  emerald: { label: "زمردي", accent: "#34D399", deep: "#059669" },
  gold: { label: "ذهبي", accent: "#D4AF37", deep: "#A8842C" },
  sapphire: { label: "أزرق ياقوتي", accent: "#38BDF8", deep: "#0369A1" },
  rose: { label: "وردي", accent: "#FB7185", deep: "#BE123C" },
};

export const LETTER_COLORS = ["#14B8A6", "#D4AF37", "#38BDF8", "#F472B6", "#A78BFA", "#FB923C", "#34D399"];

export function colorForName(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return LETTER_COLORS[hash % LETTER_COLORS.length];
}

export const DEFAULT_SETTINGS: HubSettings = {
  hubName: "WTDO Social Hub",
  ownerName: "WTDOsama",
  accent: "teal",
  cardSize: "comfortable",
  showDescriptions: true,
  showQuickAccess: true,
  defaultCategory: "all",
};

const T0 = 1767225600000; // 2026-01-01

/** التطبيقات الافتراضية الخمسة عشر — روابطها الرسمية HTTPS */
const DEFAULTS: Array<Omit<HubApp, "createdAt">> = [
  {
    id: "whatsapp",
    name: "واتساب",
    url: "https://web.whatsapp.com/",
    description: "مراسلة فورية ومكالمات",
    category: "messaging",
    icon: { kind: "brand", key: "whatsapp" },
    favorite: true,
    hidden: false,
    keywords: ["whatsapp", "واتس اب", "watsapp"],
    androidPackage: "com.whatsapp",
  },
  {
    id: "whatsapp-business",
    name: "واتساب للأعمال",
    url: "https://business.whatsapp.com/",
    description: "إدارة محادثات العملاء",
    category: "messaging",
    icon: { kind: "brand", key: "whatsapp-business" },
    favorite: false,
    hidden: false,
    keywords: ["whatsapp business", "واتس اعمال"],
    androidPackage: "com.whatsapp.w4b",
  },
  {
    id: "youtube",
    name: "يوتيوب",
    url: "https://www.youtube.com/",
    description: "مشاهدة الفيديو والبث",
    category: "video",
    icon: { kind: "brand", key: "youtube" },
    favorite: true,
    hidden: false,
    keywords: ["youtube", "يوتوب"],
    androidPackage: "com.google.android.youtube",
  },
  {
    id: "youtube-studio",
    name: "يوتيوب ستوديو",
    url: "https://studio.youtube.com/",
    description: "إدارة قناتك ومحتواك",
    category: "productivity",
    icon: { kind: "brand", key: "youtube-studio" },
    favorite: false,
    hidden: false,
    keywords: ["youtube studio", "استوديو"],
    androidPackage: "com.google.android.apps.youtube.creator",
  },
  {
    id: "instagram",
    name: "إنستغرام",
    url: "https://www.instagram.com/",
    description: "صور وقصص وريلز",
    category: "social",
    icon: { kind: "brand", key: "instagram" },
    favorite: true,
    hidden: false,
    keywords: ["instagram", "انستقرام", "انستا"],
    androidPackage: "com.instagram.android",
  },
  {
    id: "tiktok",
    name: "تيك توك",
    url: "https://www.tiktok.com/",
    description: "فيديوهات قصيرة رائجة",
    category: "video",
    icon: { kind: "brand", key: "tiktok" },
    favorite: false,
    hidden: false,
    keywords: ["tiktok", "تيكتوك"],
    androidPackage: "com.zhiliaoapp.musically",
  },
  {
    id: "facebook",
    name: "فيسبوك",
    url: "https://www.facebook.com/",
    description: "شبكة التواصل الأكبر",
    category: "social",
    icon: { kind: "brand", key: "facebook" },
    favorite: false,
    hidden: false,
    keywords: ["facebook", "فيس"],
    androidPackage: "com.facebook.katana",
  },
  {
    id: "messenger",
    name: "ماسنجر",
    url: "https://www.messenger.com/",
    description: "دردشة فيسبوك",
    category: "messaging",
    icon: { kind: "brand", key: "messenger" },
    favorite: false,
    hidden: false,
    keywords: ["messenger", "مسنجر"],
    androidPackage: "com.facebook.orca",
  },
  {
    id: "telegram",
    name: "تيليجرام",
    url: "https://web.telegram.org/",
    description: "مراسلة سريعة وقنوات",
    category: "messaging",
    icon: { kind: "brand", key: "telegram" },
    favorite: true,
    hidden: false,
    keywords: ["telegram", "تليجرام", "تلجرام"],
    androidPackage: "org.telegram.messenger",
  },
  {
    id: "x",
    name: "إكس (تويتر)",
    url: "https://x.com/",
    description: "آخر الأخبار والنقاشات",
    category: "social",
    icon: { kind: "brand", key: "x" },
    favorite: false,
    hidden: false,
    keywords: ["twitter", "x", "تويتر"],
    androidPackage: "com.twitter.android",
  },
  {
    id: "gmail",
    name: "جيميل",
    url: "https://mail.google.com/",
    description: "بريدك الإلكتروني",
    category: "productivity",
    icon: { kind: "brand", key: "gmail" },
    favorite: false,
    hidden: false,
    keywords: ["gmail", "ايميل", "بريد"],
    androidPackage: "com.google.android.gm",
  },
  {
    id: "google-drive",
    name: "جوجل درايف",
    url: "https://drive.google.com/",
    description: "ملفاتك في السحابة",
    category: "productivity",
    icon: { kind: "brand", key: "google-drive" },
    favorite: false,
    hidden: false,
    keywords: ["google drive", "درايف", "قرص"],
    androidPackage: "com.google.android.apps.docs",
  },
  {
    id: "linkedin",
    name: "لينكدإن",
    url: "https://www.linkedin.com/",
    description: "شبكتك المهنية",
    category: "social",
    icon: { kind: "brand", key: "linkedin" },
    favorite: false,
    hidden: false,
    keywords: ["linkedin", "لينكد ان"],
    androidPackage: "com.linkedin.android",
  },
  {
    id: "snapchat",
    name: "سناب شات",
    url: "https://www.snapchat.com/",
    description: "لحظاتك بعدسات مميزة",
    category: "social",
    icon: { kind: "brand", key: "snapchat" },
    favorite: false,
    hidden: false,
    keywords: ["snapchat", "سناب"],
    androidPackage: "com.snapchat.android",
  },
  {
    id: "pinterest",
    name: "بينتريست",
    url: "https://www.pinterest.com/",
    description: "أفكار وإلهام بصري",
    category: "social",
    icon: { kind: "brand", key: "pinterest" },
    favorite: false,
    hidden: false,
    keywords: ["pinterest", "بنترست"],
    androidPackage: "com.pinterest",
  },
];

/** نسخة جديدة قابلة للتعديل من القائمة الافتراضية */
export function makeDefaultApps(): HubApp[] {
  return DEFAULTS.map((app, i) => ({
    ...app,
    icon: { ...app.icon },
    keywords: app.keywords ? [...app.keywords] : undefined,
    createdAt: T0 + i,
  }));
}

/** اقتراحات جاهزة لقسم «مواقعي واختصاراتي» — تُعبّئ النموذج ولا تُضاف تلقائيًا */
export const SITE_SUGGESTIONS: AppDraft[] = [
  {
    name: "ChatGPT",
    url: "https://chatgpt.com/",
    description: "مساعد الذكاء الاصطناعي",
    category: "websites",
    icon: { kind: "emoji", value: "🤖" },
    favorite: false,
    hidden: false,
    androidPackage: "com.openai.chatgpt",
  },
  {
    name: "GitHub",
    url: "https://github.com/",
    description: "مستودعات الأكواد",
    category: "websites",
    icon: { kind: "brand", key: "github" },
    favorite: false,
    hidden: false,
    androidPackage: "com.github.android",
  },
  {
    name: "Claude",
    url: "https://claude.ai/",
    description: "ذكاء اصطناعي للكتابة والتحليل",
    category: "websites",
    icon: { kind: "brand", key: "claude" },
    favorite: false,
    hidden: false,
    androidPackage: "com.anthropic.claude",
  },
  {
    name: "Notion",
    url: "https://www.notion.so/",
    description: "ملاحظات وتنظيم المشاريع",
    category: "websites",
    icon: { kind: "brand", key: "notion" },
    favorite: false,
    hidden: false,
    androidPackage: "notion.id",
  },
  {
    name: "خرائط جوجل",
    url: "https://maps.google.com/",
    description: "خرائط وملاحة",
    category: "websites",
    icon: { kind: "brand", key: "google-maps" },
    favorite: false,
    hidden: false,
    androidPackage: "com.google.android.apps.maps",
  },
  {
    name: "ويكيبيديا",
    url: "https://ar.wikipedia.org/",
    description: "الموسوعة الحرة",
    category: "websites",
    icon: { kind: "brand", key: "wikipedia" },
    favorite: false,
    hidden: false,
    androidPackage: "org.wikipedia",
  },
];