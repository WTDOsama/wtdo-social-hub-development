import { useMemo, useState } from "react";
import { EyeOff, Globe, Plus, Sparkles } from "lucide-react";
import type { AppDraft, HubApp, ViewId } from "../types";
import { SITE_SUGGESTIONS } from "../data/apps";
import { appCountLabel, launchApp } from "../lib/utils";
import { useHub } from "../store";
import { AppCard, gridClassForSize } from "../components/AppCard";
import { AppForm } from "../components/AppForm";
import { AppIcon } from "../components/AppIcon";
import { EmptyState } from "../components/ui";

const stripSlash = (url: string) => url.replace(/\/+$/, "");

export function Sites({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const { state, toggleFavorite, registerLaunch, notify, online } = useHub();
  const { apps, settings } = state;
  const [formOpen, setFormOpen] = useState(false);
  const [preset, setPreset] = useState<Partial<AppDraft> | null>(null);

  const sites = useMemo(() => apps.filter((app) => app.category === "websites" && !app.hidden), [apps]);
  const hiddenCount = useMemo(() => apps.filter((app) => app.category === "websites" && app.hidden).length, [apps]);

  const suggestions = useMemo(() => {
    const existing = new Set(apps.map((app) => stripSlash(app.url)));
    return SITE_SUGGESTIONS.filter((suggestion) => !existing.has(stripSlash(suggestion.url)));
  }, [apps]);

  const openAdd = (draft: Partial<AppDraft> | null) => {
    setPreset(draft ?? { category: "websites" });
    setFormOpen(true);
  };

  const launch = (app: HubApp) => {
    registerLaunch(app.id);
    if (!online) notify("أنت غير متصل — قد لا يفتح الموقع", "info");
    launchApp(app);
  };

  return (
    <div>
      <header className="anim-rise mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 font-display text-2xl font-bold">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/35 bg-gold/10 text-gold">
              <Globe size={19} />
            </span>
            مواقعي واختصاراتي
          </h1>
          <p className="mt-2 text-sm text-mut">
            أضف أي موقع أو خدمة: أدوات تطوير، منصات ذكاء اصطناعي، أنظمة إدارية أو مواقعك الشخصية.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openAdd(null)}
          className="focus-ring flex items-center gap-2 rounded-xl bg-accent-deep px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent-deep/25 transition hover:brightness-110"
        >
          <Plus size={16} />
          إضافة موقع
        </button>
      </header>

      {suggestions.length > 0 && (
        <div className="anim-rise mb-6 rounded-2xl border border-line bg-panel/60 p-4" style={{ animationDelay: "70ms" }}>
          <p className="mb-3 flex items-center gap-1.5 text-xs font-bold text-mut">
            <Sparkles size={14} className="text-gold" />
            اقتراحات سريعة — اضغط لتعبئة النموذج ثم احفظ
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((suggestion) => (
              <button
                key={suggestion.url}
                type="button"
                onClick={() => openAdd(suggestion)}
                className="focus-ring flex items-center gap-2 rounded-full border border-line bg-card/70 py-1.5 pe-3.5 ps-1.5 text-xs font-semibold text-mut transition-all duration-150 hover:-translate-y-0.5 hover:border-accent/50 hover:text-ink"
              >
                <AppIcon icon={suggestion.icon} size={24} />
                <span dir="auto">{suggestion.name}</span>
                <Plus size={12} className="text-accent" />
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-[1rem] font-bold sm:text-lg">
          مواقعي
          <span className="ms-2 text-xs font-normal text-mut">{appCountLabel(sites.length)}</span>
        </h2>
        {hiddenCount > 0 && (
          <button
            type="button"
            onClick={() => onNavigate("manage")}
            className="focus-ring flex items-center gap-1.5 text-[11px] text-mut transition hover:text-ink"
          >
            <EyeOff size={12} />
            {hiddenCount} مخفي — إدارتها من صفحة الإدارة
          </button>
        )}
      </div>

      {sites.length === 0 ? (
        <EmptyState icon={Globe} title="أضف موقعك الأول" message="أي موقع تستخدمه يوميًا يمكن أن يكون هنا: أدوات عمل، منصات ذكاء اصطناعي، لوحات تحكم والمزيد.">
          <button
            type="button"
            onClick={() => openAdd(null)}
            className="focus-ring mt-1 flex items-center gap-2 rounded-xl bg-accent-deep px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
          >
            <Plus size={16} />
            إضافة موقع
          </button>
        </EmptyState>
      ) : (
        <div className={gridClassForSize(settings.cardSize)} data-testid="sites-grid">
          {sites.map((app, index) => (
            <AppCard
              key={app.id}
              app={app}
              index={index}
              size={settings.cardSize}
              showDescription={settings.showDescriptions}
              onLaunch={launch}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}

      <AppForm open={formOpen} onClose={() => setFormOpen(false)} preset={preset} />
    </div>
  );
}