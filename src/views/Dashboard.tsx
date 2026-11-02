import { useEffect, useMemo, useRef, useState, type DragEvent } from "react";
import { GripVertical, History, LayoutGrid, Plus, Search, SearchX, Star, X } from "lucide-react";
import type { FilterId, HubApp, ViewId } from "../types";
import { CATEGORIES, CATEGORY_LABELS } from "../data/apps";
import { appCountLabel, formatNumber, launchApp, normalizeText } from "../lib/utils";
import { useHub } from "../store";
import { AppCard, gridClassForSize, type DragState } from "../components/AppCard";
import { AppForm } from "../components/AppForm";
import { EmptyState } from "../components/ui";
import { AppIcon } from "../components/AppIcon";
import { DashboardHeader } from "../components/layout";
import { cn } from "../utils/cn";

export function Dashboard({ onNavigate }: { onNavigate: (view: ViewId) => void }) {
  const { state, toggleFavorite, moveApp, registerLaunch, notify, online } = useHub();
  const { apps, settings, recentIds } = state;
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<FilterId>(settings.defaultCategory);
  const [addOpen, setAddOpen] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  /* اختصار "/" لتركيز البحث */
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? "").toLowerCase();
      if (event.key === "/" && !["input", "textarea", "select"].includes(tag)) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const visible = useMemo(() => apps.filter((app) => !app.hidden), [apps]);

  const counts = useMemo(() => {
    const result = { all: visible.length, favorites: 0, social: 0, messaging: 0, video: 0, productivity: 0, websites: 0 } as Record<FilterId, number>;
    for (const app of visible) {
      result[app.category] += 1;
      if (app.favorite) result.favorites += 1;
    }
    return result;
  }, [visible]);

  const filtered = useMemo(() => {
    let list = visible;
    if (category === "favorites") list = list.filter((app) => app.favorite);
    else if (category !== "all") list = list.filter((app) => app.category === category);
    const q = normalizeText(query);
    if (q) {
      list = list.filter((app) => {
        const haystack = normalizeText(
          [app.name, app.description ?? "", CATEGORY_LABELS[app.category], ...(app.keywords ?? [])].join(" ")
        );
        return haystack.includes(q);
      });
    }
    return list;
  }, [visible, category, query]);

  const favorites = useMemo(() => visible.filter((app) => app.favorite), [visible]);
  const recents = useMemo(
    () => recentIds.map((id) => visible.find((app) => app.id === id)).filter((app): app is HubApp => Boolean(app)),
    [recentIds, visible]
  );

  const dndEnabled = category === "all" && !query.trim();
  const showQuick = settings.showQuickAccess && category === "all" && !query.trim();
  const addPreset = useMemo(
    () => (category !== "all" && category !== "favorites" ? { category } : null),
    [category]
  );

  const launch = (app: HubApp) => {
    registerLaunch(app.id);
    if (!online) notify("أنت غير متصل — قد لا يفتح التطبيق الخارجي", "info");
    launchApp(app);
  };

  const handleDragStart = (event: DragEvent, id: string) => {
    event.dataTransfer.setData("text/plain", id);
    event.dataTransfer.effectAllowed = "move";
    setDragId(id);
  };
  const handleDragOver = (event: DragEvent, id: string) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
    if (id !== dragId) setOverId(id);
  };
  const handleDrop = (event: DragEvent, id: string) => {
    event.preventDefault();
    const source = dragId ?? event.dataTransfer.getData("text/plain");
    if (source && source !== id) moveApp(source, id);
    setDragId(null);
    setOverId(null);
  };
  const handleDragEnd = () => {
    setDragId(null);
    setOverId(null);
  };

  const dragStateFor = (id: string): DragState => (dragId === id ? "dragging" : overId === id ? "over" : null);

  const quickApps = favorites.length > 0 ? favorites : recents;
  const quickLabel = favorites.length > 0 ? "وصول سريع" : "آخر استخدام";

  return (
    <div>
      <DashboardHeader onNavigate={onNavigate} />

      {/* البحث */}
      <div className="anim-rise relative mb-5" style={{ animationDelay: "60ms" }}>
        <Search size={19} className="pointer-events-none absolute start-4 top-1/2 -translate-y-1/2 text-mut" />
        <input
          ref={searchRef}
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Escape") setQuery("");
          }}
          aria-label="ابحث عن تطبيق بالاسم أو التصنيف"
          placeholder="ابحث عن تطبيق أو تصنيف…"
          className="focus-ring w-full rounded-2xl border border-line bg-panel/85 py-3.5 pe-12 ps-12 text-sm shadow-[0_10px_30px_-18px_rgba(0,0,0,0.8)] placeholder:text-mut/55 transition focus:border-accent/55 sm:py-4 sm:text-[1rem] [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              searchRef.current?.focus();
            }}
            aria-label="مسح البحث"
            className="focus-ring absolute end-3.5 top-1/2 -translate-y-1/2 rounded-full bg-card p-1.5 text-mut transition hover:text-ink"
          >
            <X size={14} />
          </button>
        ) : (
          <kbd className="pointer-events-none absolute end-4 top-1/2 hidden -translate-y-1/2 rounded-md border border-line bg-night/70 px-2 py-0.5 text-[11px] text-mut md:block">
            /
          </kbd>
        )}
      </div>

      {/* التصنيفات */}
      <div className="anim-rise no-scrollbar -mx-1 mb-6 flex gap-2 overflow-x-auto px-1 py-1" style={{ animationDelay: "110ms" }} role="tablist" aria-label="تصنيفات التطبيقات">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const active = category === cat.id;
          return (
            <button
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setCategory(cat.id)}
              className={cn(
                "focus-ring flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-semibold transition-all duration-150 sm:text-[13px]",
                active
                  ? "border-accent/50 bg-accent-deep/25 text-ink shadow-[0_6px_18px_-8px_color-mix(in_srgb,var(--hub-accent)_60%,transparent)]"
                  : "border-line bg-card/60 text-mut hover:border-accent/30 hover:text-ink"
              )}
            >
              <Icon size={14} className={cn(active && "text-accent", cat.id === "favorites" && active && "fill-gold text-gold")} />
              {cat.label}
              <span className={cn("rounded-full px-1.5 py-0.5 text-[10px]", active ? "bg-night/60 text-accent" : "bg-night/50")}>
                {formatNumber(counts[cat.id])}
              </span>
            </button>
          );
        })}
      </div>

      {/* الوصول السريع */}
      {showQuick && quickApps.length > 0 && (
        <div className="anim-rise mb-6" style={{ animationDelay: "150ms" }}>
          <p className="mb-2.5 flex items-center gap-1.5 text-xs font-bold text-mut">
            {favorites.length > 0 ? <Star size={13} className="fill-gold text-gold" /> : <History size={13} className="text-accent" />}
            {quickLabel}
          </p>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
            {quickApps.map((app) => (
              <button
                key={app.id}
                type="button"
                onClick={() => launch(app)}
                title={`فتح ${app.name}`}
                className="focus-ring flex shrink-0 items-center gap-2 rounded-full border border-gold/25 bg-card/75 py-1.5 pe-3.5 ps-1.5 text-xs font-semibold transition-all duration-150 hover:-translate-y-0.5 hover:border-gold/60 hover:bg-raise"
              >
                <AppIcon icon={app.icon} size={26} />
                {app.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* عنوان القسم */}
      <div className="mb-3.5 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-[1rem] font-bold sm:text-lg">
          {query.trim() ? `نتائج البحث` : CATEGORY_LABELS[category]}
          <span className="ms-2 text-xs font-normal text-mut">{appCountLabel(filtered.length)}</span>
        </h2>
        {dndEnabled && filtered.length > 1 && (
          <p className="hidden items-center gap-1 text-[11px] text-mut/80 lg:flex">
            <GripVertical size={13} />
            اسحب البطاقات لإعادة الترتيب
          </p>
        )}
      </div>

      {/* الشبكة */}
      {visible.length === 0 ? (
        <EmptyState icon={LayoutGrid} title="لوحتك فارغة" message="أضف تطبيقاتك المفضلة أو استعد القائمة الافتراضية من الإعدادات.">
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="focus-ring mt-1 flex items-center gap-2 rounded-xl bg-accent-deep px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
          >
            <Plus size={16} />
            إضافة تطبيق
          </button>
        </EmptyState>
      ) : filtered.length === 0 ? (
        query.trim() ? (
          <EmptyState icon={SearchX} title="لا توجد نتائج" message={`لم نجد تطبيقات تطابق «${query.trim()}». جرّب اسمًا آخر أو تصنيفًا مختلفًا.`}>
            <button
              type="button"
              onClick={() => setQuery("")}
              className="focus-ring mt-1 rounded-xl border border-line bg-card px-4 py-2 text-sm font-semibold transition hover:bg-raise"
            >
              مسح البحث
            </button>
          </EmptyState>
        ) : category === "favorites" ? (
          <EmptyState icon={Star} title="لا مفضلات بعد" message="اضغط على النجمة في أي بطاقة تطبيق لتظهر هنا وفي شريط الوصول السريع." />
        ) : (
          <EmptyState icon={LayoutGrid} title="لا تطبيقات في هذا التصنيف" message="أضف تطبيقًا جديدًا واختر هذا التصنيف ليظهر هنا.">
            <button
              type="button"
              onClick={() => setAddOpen(true)}
              className="focus-ring mt-1 flex items-center gap-2 rounded-xl bg-accent-deep px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
            >
              <Plus size={16} />
              إضافة تطبيق
            </button>
          </EmptyState>
        )
      ) : (
        <div className={gridClassForSize(settings.cardSize)} data-testid="apps-grid">
          {filtered.map((app, index) => (
            <AppCard
              key={app.id}
              app={app}
              index={index}
              size={settings.cardSize}
              showDescription={settings.showDescriptions}
              onLaunch={launch}
              onToggleFavorite={toggleFavorite}
              draggable={dndEnabled}
              dragState={dragStateFor(app.id)}
              onDragStart={handleDragStart}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      )}

      <AppForm open={addOpen} onClose={() => setAddOpen(false)} preset={addPreset} />
    </div>
  );
}