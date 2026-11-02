import { Briefcase, Settings2 } from "lucide-react";
import type { IconSpec } from "../types";
import { brandTile } from "../data/brands";
import { colorForName } from "../data/apps";
import { cn } from "../utils/cn";

interface AppIconProps {
  icon: IconSpec;
  size?: number;
  className?: string;
}

/** بلاطة أيقونة التطبيق — علامة رسمية، إيموجي، صورة مرفوعة، أو حرف تلقائي */
export function AppIcon({ icon, size = 52, className }: AppIconProps) {
  const radius = Math.round(size * 0.27);
  const frame = { width: size, height: size, borderRadius: radius };

  if (icon.kind === "image") {
    return (
      <img
        src={icon.dataUrl}
        alt=""
        width={size}
        height={size}
        style={frame}
        className={cn("shrink-0 border border-line object-cover", className)}
      />
    );
  }

  if (icon.kind === "emoji") {
    return (
      <div
        style={{ ...frame, fontSize: size * 0.5 }}
        className={cn("flex shrink-0 items-center justify-center border border-line bg-card leading-none", className)}
        aria-hidden
      >
        <span>{icon.value}</span>
      </div>
    );
  }

  if (icon.kind === "letter") {
    const color = /^#[0-9a-fA-F]{6}$/.test(icon.color) ? icon.color : colorForName(icon.value);
    return (
      <div
        style={{
          ...frame,
          background: `${color}22`,
          border: `1px solid ${color}45`,
          color,
          fontSize: size * 0.42,
        }}
        className={cn("flex shrink-0 items-center justify-center font-display font-bold", className)}
        aria-hidden
      >
        <span>{icon.value.charAt(0) || "؟"}</span>
      </div>
    );
  }

  const tile = brandTile(icon.key);
  if (!tile) {
    return (
      <div
        style={frame}
        className={cn("flex shrink-0 items-center justify-center border border-line bg-card text-mut", className)}
        aria-hidden
      >
        ؟
      </div>
    );
  }

  const badgeSize = Math.max(14, Math.round(size * 0.34));
  const badge =
    icon.key === "whatsapp-business" ? Briefcase : icon.key === "youtube-studio" ? Settings2 : null;
  const BadgeGlyph = badge;

  return (
    <div
      style={{ ...frame, background: tile.bg, border: `1px solid ${tile.border}` }}
      className={cn("relative flex shrink-0 items-center justify-center", className)}
      aria-hidden
    >
      <svg viewBox="0 0 24 24" width={size * 0.52} height={size * 0.52} fill={tile.fg}>
        <path d={tile.path} />
      </svg>
      {BadgeGlyph && (
        <span
          style={{ width: badgeSize, height: badgeSize, borderColor: tile.border }}
          className="absolute -bottom-1 -left-1 flex items-center justify-center rounded-full border bg-night"
        >
          <BadgeGlyph size={badgeSize * 0.62} style={{ color: tile.fg }} />
        </span>
      )}
    </div>
  );
}