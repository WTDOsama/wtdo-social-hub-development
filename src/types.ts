/** الأنواع المركزية لتطبيق WTDO Social Hub */

export type CategoryId = "social" | "messaging" | "video" | "productivity" | "websites";

export type FilterId = "all" | "favorites" | CategoryId;

export type ViewId = "dashboard" | "sites" | "manage" | "settings";

export type IconSpec =
  | { kind: "brand"; key: string }
  | { kind: "emoji"; value: string }
  | { kind: "image"; dataUrl: string }
  | { kind: "letter"; value: string; color: string };

export interface HubApp {
  id: string;
  name: string;
  url: string;
  description?: string;
  category: CategoryId;
  icon: IconSpec;
  favorite: boolean;
  hidden: boolean;
  /** كلمات إضافية للبحث (بالعربية والإنجليزية) */
  keywords?: string[];
  /** حزمة أندرويد رسمية لإطلاق التطبيق الأصلي عبر Intent مع تراجع مضمون للموقع */
  androidPackage?: string;
  createdAt: number;
}

export type CardSize = "compact" | "comfortable" | "large";

export type AccentId = "teal" | "emerald" | "gold" | "sapphire" | "rose";

export interface HubSettings {
  hubName: string;
  ownerName: string;
  accent: AccentId;
  cardSize: CardSize;
  showDescriptions: boolean;
  showQuickAccess: boolean;
  defaultCategory: FilterId;
}

export interface HubState {
  version: 1;
  apps: HubApp[];
  settings: HubSettings;
  recentIds: string[];
}

export interface BackupFile {
  app: "wtdo-social-hub";
  version: 1;
  exportedAt: string;
  apps: HubApp[];
  settings: HubSettings;
}

export type ToastTone = "success" | "error" | "info";

export interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

export interface AppDraft {
  name: string;
  url: string;
  description: string;
  category: CategoryId;
  icon: IconSpec;
  favorite: boolean;
  hidden: boolean;
  androidPackage?: string;
}