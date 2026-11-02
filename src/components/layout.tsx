import { useId } from "react";
import { CalendarDays, Download, Globe, Home, Settings, ShieldCheck, SlidersHorizontal, Wifi, WifiOff } from "lucide-react";
import type { ViewId } from "../types";
import { useHub } from "../store";
import { formatNumber, formatToday, greeting } from "../lib/utils";
import { cn } from "../utils/cn";

/* ---------- الشعار ---------- */

export function Logo({ size = 40 }: { size?: number }) {
  // معرفات فريدة لكل نسخة — التعريفات المشتركة تفشل إذا كانت النسخة الأولى مخفية (display:none)
  const uid = useId().replace(/[^a-zA-Z0-9]/g, "");
  const bgId = `wtbg${uid}`;
  const tealId = `wtteal${uid}`;
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} aria-hidden className="shrink-0 drop-shadow-[0_4px_14px_rgba(20,184,166,0.3)]">
      <defs>
        <linearGradient id={bgId} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1C2B26" />
          <stop offset="1" stopColor="#101817" />
        </linearGradient>
        <linearGradient id={tealId} x1="0" y1="1" x2="1" y2="0">
          <stop offset="0" stopColor="#0F766E" />
          <stop offset="1" stopColor="#2DD4BF" />
        </linearGradient>
      </defs>
      <rect x="8" y="8" width="496" height="496" rx="116" fill={`url(#${bgId})`} />
      <rect x="14" y="14" width="484" height="484" rx="110" fill="none" stroke="#14B8A6" strokeOpacity="0.35" strokeWidth="10" />
      <path d="M126 172 L192 352 L256 222 L320 352 L386 172" fill="none" stroke={`url(#${tealId})`} strokeWidth="46" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="386" cy="172" r="27" fill="#D4AF37" />
    </svg>
  );
}

export const NAV_ITEMS: { id: ViewId; label: string; short: string; icon: typeof Home }[] = [
  { id: "dashboard", label: "الرئيسية", short: "الرئيسية", icon: Home },
  { id: "sites", label: "مواقعي واختصاراتي", short: "مواقعي", icon: Globe },
  { id: "manage", label: "إدارة التطبيقات", short: "الإدارة", icon: SlidersHorizontal },
  { id: "settings", label: "الإعدادات", short: "الإعدادات", icon: Settings },
];

/* ---------- الشريط الجانبي (سطح المكتب) ---------- */

export function Sidebar({ view, onNavigate }: { view: ViewId; onNavigate: (view: ViewId) => void }) {
  const { state, online, installReady, promptInstall } = useHub();
  return (
    <aside className="sticky top-0 hidden h-dvh w-72 shrink-0 flex-col border-e border-line bg-panel/60 p-5 backdrop-blur lg:flex">
      <div className="flex items-center gap-3">
        <Logo size={44} />
        <div className="min-w-0">
          <p className="truncate font-display text-[1rem] font-bold leading-tight">{state.settings.hubName}</p>
          <p className="text-[11px] text-mut">بواسطة WTDOsama</p>
        </div>
      </div>

      <nav className="mt-8 space-y-1.5" aria-label="التنقل الرئيسي">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "focus-ring flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-semibold transition-all duration-150",
                active
                  ? "border border-accent/35 bg-accent-deep/20 text-ink shadow-[inset_0_1px_0_rgba(248,250,252,0.05)]"
                  : "border border-transparent text-mut hover:bg-card hover:text-ink"
              )}
            >
              <Icon size={18} className={active ? "text-accent" : ""} />
              <span className="flex-1 text-start">{item.label}</span>
              {item.id === "manage" && (
                <span className="rounded-full bg-night/70 px-2 py-0.5 text-[10px] text-mut">{formatNumber(state.apps.length)}</span>
              )}
              {active && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        {installReady && (
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-accent-deep px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent-deep/30 transition hover:brightness-110"
          >
            <Download size={16} />
            تثبيت التطبيق
          </button>
        )}
        <div className="flex items-center gap-2 rounded-xl border border-line bg-night/50 px-3 py-2.5 text-xs">
          <span className={cn("h-2 w-2 rounded-full", online ? "live-dot bg-accent" : "bg-gold")} />
          <span className="text-mut">{online ? "متصل بالإنترنت" : "غير متصل — الوضع المحلي"}</span>
          {online ? <Wifi size={13} className="ms-auto text-accent" /> : <WifiOff size={13} className="ms-auto text-gold" />}
        </div>
        <p className="flex items-start gap-1.5 px-1 text-[10.5px] leading-relaxed text-mut/80">
          <ShieldCheck size={13} className="mt-0.5 shrink-0 text-accent/70" />
          بياناتك محفوظة على جهازك فقط، ولا تُرسل لأي خادم.
        </p>
        <p className="border-t border-line px-1 pt-3 text-center text-[10px] text-mut/70">
          WTDO Social Hub · © 2026 WTDOsama
        </p>
      </div>
    </aside>
  );
}

/* ---------- تنقل الجوال السفلي ---------- */

export function BottomNav({ view, onNavigate }: { view: ViewId; onNavigate: (view: ViewId) => void }) {
  return (
    <nav
      aria-label="التنقل السفلي"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 border-t border-line bg-panel/95 backdrop-blur lg:hidden"
    >
      <div className="grid grid-cols-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = view === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex flex-col items-center gap-1 py-2.5 text-[10.5px] font-semibold transition-colors",
                active ? "text-accent" : "text-mut hover:text-ink"
              )}
            >
              <Icon size={19} strokeWidth={active ? 2.4 : 2} />
              {item.short}
              <span className={cn("h-1 w-1 rounded-full transition", active ? "bg-accent" : "bg-transparent")} />
            </button>
          );
        })}
      </div>
    </nav>
  );
}

/* ---------- الشريط العلوي للجوال ---------- */

export function MobileTopBar({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const { state, online } = useHub();
  return (
    <div className="mb-5 flex items-center gap-2.5 lg:hidden">
      <Logo size={34} />
      <p className="min-w-0 truncate font-display text-sm font-bold">{state.settings.hubName}</p>
      <span className={cn("ms-1 h-2 w-2 shrink-0 rounded-full", online ? "bg-accent" : "bg-gold")} title={online ? "متصل" : "غير متصل"} />
      <button
        type="button"
        onClick={() => onNavigate("settings")}
        aria-label="فتح الإعدادات"
        className="focus-ring ms-auto rounded-xl border border-line bg-card p-2 text-mut transition hover:text-ink"
      >
        <Settings size={17} />
      </button>
    </div>
  );
}

/* ---------- ترويسة اللوحة ---------- */

export function DashboardHeader({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const { state, online, installReady, promptInstall } = useHub();
  return (
    <header className="anim-rise mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-sm text-mut">{greeting()} <span className="text-gold">✦</span></p>
        <h1 className="mt-1 font-display text-2xl font-bold leading-tight sm:text-3xl">
          مرحبًا، <span className="text-accent">{state.settings.ownerName}</span>
        </h1>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-mut sm:text-sm">
          <CalendarDays size={14} className="text-gold" />
          {formatToday()}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <span
          className={cn(
            "hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold sm:flex",
            online ? "border-accent/30 bg-accent/10 text-accent" : "border-gold/40 bg-gold/10 text-gold"
          )}
        >
          {online ? <Wifi size={13} /> : <WifiOff size={13} />}
          {online ? "متصل" : "غير متصل"}
        </span>
        {installReady && (
          <button
            type="button"
            onClick={() => void promptInstall()}
            className="focus-ring flex items-center gap-1.5 rounded-xl bg-accent-deep px-3 py-2 text-xs font-bold text-white transition hover:brightness-110 lg:hidden"
          >
            <Download size={14} />
            تثبيت
          </button>
        )}
        <button
          type="button"
          onClick={() => onNavigate("manage")}
          className="focus-ring flex items-center gap-1.5 rounded-xl border border-line bg-card px-3 py-2 text-xs font-semibold text-mut transition hover:border-accent/40 hover:text-ink"
          title="إدارة التطبيقات"
        >
          <SlidersHorizontal size={14} />
          <span className="hidden sm:inline">إدارة التطبيقات</span>
          <span className="sm:hidden">إدارة</span>
        </button>
        <button
          type="button"
          onClick={() => onNavigate("settings")}
          aria-label="الإعدادات"
          title="الإعدادات"
          className="focus-ring hidden rounded-xl border border-line bg-card p-2 text-mut transition hover:rotate-45 hover:border-accent/40 hover:text-ink lg:block"
        >
          <Settings size={16} />
        </button>
      </div>
    </header>
  );
}

/* ---------- لافتة عدم الاتصال ---------- */

export function OfflineBanner() {
  return (
    <div role="status" className="anim-rise mb-5 flex items-center gap-2.5 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-xs leading-relaxed text-gold sm:text-sm">
      <WifiOff size={16} className="shrink-0" />
      أنت غير متصل بالإنترنت — اللوحة وإعداداتك تعمل بشكل كامل، لكن فتح التطبيقات الخارجية يتطلب اتصالًا.
    </div>
  );
}

/* ---------- التذييل ---------- */

export function Footer() {
  return (
    <footer className="mt-12 space-y-1 border-t border-line pt-6 text-center text-[11px] text-mut">
      <p className="font-display text-xs font-bold text-ink/80">WTDO Social Hub</p>
      <p>Developed by WTDOsama</p>
      <p>© 2026 All Rights Reserved — جميع الحقوق محفوظة</p>
    </footer>
  );
}