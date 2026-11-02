import { useMemo, useState, type DragEvent } from "react";
import { ChevronDown, ChevronUp, Eye, EyeOff, GripVertical, Pencil, Plus, Search, SlidersHorizontal, Star, Trash2 } from "lucide-react";
import type { HubApp } from "../types";
import { CATEGORY_LABELS } from "../data/apps";
import { appCountLabel, formatNumber, normalizeText } from "../lib/utils";
import { useHub } from "../store";
import { AppIcon } from "../components/AppIcon";
import { AppForm } from "../components/AppForm";
import { ConfirmDialog, EmptyState } from "../components/ui";
import { cn } from "../utils/cn";

export function Manage() {
  const { state, deleteApp, toggleFavorite, toggleHidden, moveApp, nudgeApp, notify } = useHub();
  const { apps } = state;
  const [filter, setFilter] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<HubApp | null>(null);
  const [deleting, setDeleting] = useState<HubApp | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  const list = useMemo(() => {
    const q = normalizeText(filter);
    if (!q) return apps;
    return apps.filter((app) => normalizeText(`${app.name} ${app.url} ${(app.keywords ?? []).join(" ")}`).includes(q));
  }, [apps, filter]);

  const dndEnabled = !filter.trim();

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };
  const openEdit = (app: HubApp) => {
    setEditing(app);
    setFormOpen(true);
  };

  const handleDragStart = (event: DragEvent, id: string) => {
    event.dataTransfer.setData("text/plain", id);
    event.dataTransfer.effectAllowed = "move";
    setDragId(id);
  };
  const handleDragOver = (event: DragEvent, id: string) => {
    event.preventDefault();
    if (id !== dragId) setOverId(id);
  };
  const handleDrop = (event: DragEvent, id: string) => {
    event.preventDefault();
    const source = dragId ?? event.dataTransfer.getData("text/plain");
    if (source && source !== id) moveApp(source, id);
    setDragId(null);
    setOverId(null);
  };

  const actionButton =
    "focus-ring rounded-lg p-2 text-mut transition hover:bg-raise hover:text-ink disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div>
      <header className="anim-rise mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2.5 font-display text-2xl font-bold">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
              <SlidersHorizontal size={19} />
            </span>
            إدارة التطبيقات
          </h1>
          <p className="mt-2 text-sm text-mut">
            {appCountLabel(apps.length)} — أضف، حرّر، رتّب، أخفِ أو احذف. كل تغيير يُحفظ فورًا على جهازك.
          </p>
        </div>
        <button
          type="button"
          onClick={openAdd}
          className="focus-ring flex items-center gap-2 rounded-xl bg-accent-deep px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent-deep/25 transition hover:brightness-110"
        >
          <Plus size={16} />
          تطبيق جديد
        </button>
      </header>

      <div className="anim-rise relative mb-4" style={{ animationDelay: "70ms" }}>
        <Search size={16} className="pointer-events-none absolute start-3.5 top-1/2 -translate-y-1/2 text-mut" />
        <input
          type="search"
          value={filter}
          onChange={(event) => setFilter(event.target.value)}
          aria-label="تصفية قائمة الإدارة"
          placeholder="تصفية بالاسم أو الرابط…"
          className="focus-ring w-full rounded-xl border border-line bg-panel/80 py-2.5 pe-4 ps-10 text-sm placeholder:text-mut/55 transition focus:border-accent/55 [&::-webkit-search-cancel-button]:hidden"
        />
      </div>

      {dndEnabled && apps.length > 1 && (
        <p className="mb-3 hidden items-center gap-1 text-[11px] text-mut/80 lg:flex">
          <GripVertical size={13} />
          اسحب الصفوف لإعادة الترتيب، أو استخدم الأسهم على الجوال
        </p>
      )}

      {list.length === 0 ? (
        <EmptyState icon={SlidersHorizontal} title="لا توجد تطبيقات" message={filter ? "لا نتائج مطابقة للتصفية الحالية." : "ابدأ بإضافة تطبيقك الأول."}>
          {!filter && (
            <button
              type="button"
              onClick={openAdd}
              className="focus-ring mt-1 flex items-center gap-2 rounded-xl bg-accent-deep px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
            >
              <Plus size={16} />
              إضافة تطبيق
            </button>
          )}
        </EmptyState>
      ) : (
        <ul className="space-y-2" data-testid="manage-list">
          {list.map((app, index) => {
            const globalIndex = apps.findIndex((item) => item.id === app.id);
            return (
              <li
                key={app.id}
                draggable={dndEnabled}
                onDragStart={dndEnabled ? (event) => handleDragStart(event, app.id) : undefined}
                onDragOver={dndEnabled ? (event) => handleDragOver(event, app.id) : undefined}
                onDrop={dndEnabled ? (event) => handleDrop(event, app.id) : undefined}
                onDragEnd={() => {
                  setDragId(null);
                  setOverId(null);
                }}
                className={cn(
                  "anim-rise flex flex-wrap items-center gap-3 rounded-xl border border-line bg-card/60 p-3 transition-all duration-150",
                  app.hidden && "opacity-55",
                  dragId === app.id && "opacity-40",
                  overId === app.id && "border-accent ring-1 ring-accent/60"
                )}
                style={{ animationDelay: `${Math.min(index * 25, 300)}ms` }}
              >
                {dndEnabled && <GripVertical size={16} className="hidden shrink-0 cursor-grab text-mut/60 sm:block" aria-hidden />}
                <span className="hidden w-6 shrink-0 text-center text-[11px] text-mut md:block">{formatNumber(globalIndex + 1)}</span>
                <AppIcon icon={app.icon} size={42} />
                <div className="min-w-0 flex-1 basis-40">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p dir="auto" className="truncate text-sm font-bold">{app.name}</p>
                    {app.favorite && <Star size={12} className="shrink-0 fill-gold text-gold" aria-label="مفضل" />}
                    {app.hidden && (
                      <span className="flex items-center gap-1 rounded-full border border-gold/40 bg-gold/10 px-1.5 py-0.5 text-[9.5px] font-bold text-gold">
                        <EyeOff size={9} />
                        مخفي
                      </span>
                    )}
                    <span className="rounded-full bg-night/70 px-2 py-0.5 text-[9.5px] text-mut">{CATEGORY_LABELS[app.category]}</span>
                  </div>
                  <p dir="ltr" className="mt-0.5 truncate text-start text-[11px] text-mut/80">{app.url}</p>
                </div>
                <div className="ms-auto flex items-center gap-0.5">
                  <button type="button" aria-label={`تحريك ${app.name} لأعلى`} title="لأعلى" disabled={globalIndex === 0 || !dndEnabled} onClick={() => nudgeApp(app.id, -1)} className={actionButton}>
                    <ChevronUp size={16} />
                  </button>
                  <button type="button" aria-label={`تحريك ${app.name} لأسفل`} title="لأسفل" disabled={globalIndex === apps.length - 1 || !dndEnabled} onClick={() => nudgeApp(app.id, 1)} className={actionButton}>
                    <ChevronDown size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={app.favorite ? `إزالة ${app.name} من المفضلة` : `إضافة ${app.name} للمفضلة`}
                    title="المفضلة"
                    onClick={() => toggleFavorite(app.id)}
                    className={cn(actionButton, app.favorite && "text-gold hover:text-gold")}
                  >
                    <Star size={16} fill={app.favorite ? "currentColor" : "none"} />
                  </button>
                  <button
                    type="button"
                    aria-label={app.hidden ? `إظهار ${app.name}` : `إخفاء ${app.name}`}
                    title={app.hidden ? "إظهار" : "إخفاء"}
                    onClick={() => toggleHidden(app.id)}
                    className={actionButton}
                  >
                    {app.hidden ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  <button type="button" aria-label={`تحرير ${app.name}`} title="تحرير" onClick={() => openEdit(app)} className={actionButton}>
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    aria-label={`حذف ${app.name}`}
                    title="حذف"
                    onClick={() => setDeleting(app)}
                    className={cn(actionButton, "hover:bg-danger/15 hover:text-danger")}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AppForm open={formOpen} onClose={() => setFormOpen(false)} initial={editing} preset={null} />

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="حذف التطبيق"
        message={
          <>
            هل أنت متأكد من حذف <span className="font-bold text-ink">«{deleting?.name}»</span>؟
            <br />
            سيُزال من اللوحة نهائيًا ولا يمكن التراجع إلا بإضافته مجددًا.
          </>
        }
        confirmLabel="حذف نهائي"
        onConfirm={() => {
          if (deleting) {
            deleteApp(deleting.id);
            notify(`تم حذف «${deleting.name}»`, "info");
          }
        }}
      />
    </div>
  );
}