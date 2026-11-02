import type { DragEvent, KeyboardEvent } from "react";
import { ExternalLink, Star } from "lucide-react";
import type { CardSize, HubApp } from "../types";
import { AppIcon } from "./AppIcon";
import { cn } from "../utils/cn";

export type DragState = "dragging" | "over" | null;

interface AppCardProps {
  app: HubApp;
  size: CardSize;
  showDescription: boolean;
  index: number;
  onLaunch: (app: HubApp) => void;
  onToggleFavorite: (id: string) => void;
  draggable?: boolean;
  dragState?: DragState;
  onDragStart?: (event: DragEvent, id: string) => void;
  onDragOver?: (event: DragEvent, id: string) => void;
  onDrop?: (event: DragEvent, id: string) => void;
  onDragEnd?: () => void;
}

const SIZE_STYLES: Record<CardSize, { card: string; icon: number; name: string }> = {
  compact: { card: "gap-1.5 p-2.5 pt-4 sm:p-3 sm:pt-4", icon: 40, name: "text-xs sm:text-[13px]" },
  comfortable: { card: "gap-2 p-3 pt-5 sm:p-4 sm:pt-5", icon: 52, name: "text-[13px] sm:text-sm" },
  large: { card: "gap-2.5 p-4 pt-6 sm:p-5 sm:pt-7", icon: 62, name: "text-sm sm:text-[1rem]" },
};

export function AppCard({
  app,
  size,
  showDescription,
  index,
  onLaunch,
  onToggleFavorite,
  draggable = false,
  dragState = null,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: AppCardProps) {
  const styles = SIZE_STYLES[size];

  const handleKey = (event: KeyboardEvent) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onLaunch(app);
    }
  };

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={`فتح ${app.name}`}
      onClick={() => onLaunch(app)}
      onKeyDown={handleKey}
      draggable={draggable}
      onDragStart={draggable && onDragStart ? (event) => onDragStart(event, app.id) : undefined}
      onDragOver={draggable && onDragOver ? (event) => onDragOver(event, app.id) : undefined}
      onDrop={draggable && onDrop ? (event) => onDrop(event, app.id) : undefined}
      onDragEnd={draggable ? onDragEnd : undefined}
      style={{ animationDelay: `${Math.min(index * 30, 330)}ms` }}
      className={cn(
        "group anim-rise focus-ring relative flex cursor-pointer select-none flex-col items-center text-center",
        "rounded-2xl border border-line bg-card/85 transition-all duration-200",
        "hover:-translate-y-1 hover:border-accent/45 hover:bg-raise/70 hover:shadow-[0_16px_36px_-16px_color-mix(in_srgb,var(--hub-accent)_45%,transparent)]",
        styles.card,
        draggable && "active:cursor-grabbing",
        dragState === "over" && "scale-[1.03] border-accent ring-2 ring-accent/70",
        dragState === "dragging" && "opacity-40"
      )}
    >
      <button
        type="button"
        aria-label={app.favorite ? `إزالة ${app.name} من المفضلة` : `إضافة ${app.name} إلى المفضلة`}
        aria-pressed={app.favorite}
        onClick={(event) => {
          event.stopPropagation();
          onToggleFavorite(app.id);
        }}
        className={cn(
          "focus-ring absolute start-1.5 top-1.5 z-10 rounded-full p-1.5 transition-all duration-150 hover:scale-125",
          app.favorite ? "text-gold" : "text-mut/45 hover:text-gold group-hover:text-mut"
        )}
      >
        <Star size={15} fill={app.favorite ? "currentColor" : "none"} />
      </button>

      <AppIcon icon={app.icon} size={styles.icon} />

      <p dir="auto" title={app.name} className={cn("w-full truncate px-0.5 font-semibold leading-snug", styles.name)}>
        {app.name}
      </p>

      {showDescription && size !== "compact" && app.description && (
        <p className="w-full truncate text-[11px] leading-relaxed text-mut">{app.description}</p>
      )}

      <ExternalLink
        size={13}
        className="absolute bottom-2 end-2 text-accent opacity-0 transition-opacity duration-200 group-hover:opacity-100"
        aria-hidden
      />
    </div>
  );
}

/** فئات الشبكة حسب حجم البطاقة — ثلاثة أعمدة على الهواتف */
export function gridClassForSize(size: CardSize): string {
  switch (size) {
    case "compact":
      return "grid grid-cols-3 gap-2.5 sm:grid-cols-4 sm:gap-3 md:grid-cols-5 xl:grid-cols-7 2xl:grid-cols-8";
    case "large":
      return "grid grid-cols-2 gap-3 min-[420px]:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";
    default:
      return "grid grid-cols-3 gap-2.5 sm:gap-3.5 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";
  }
}