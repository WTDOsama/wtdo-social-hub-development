import { useEffect, type ReactNode } from "react";
import { AlertTriangle, CheckCircle2, AlertCircle, Info, X, type LucideIcon } from "lucide-react";
import { cn } from "../utils/cn";
import { useHub } from "../store";

/* ---------- نافذة منبثقة ---------- */

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  maxWidth?: string;
}

export function Modal({ open, onClose, title, children, maxWidth = "max-w-lg" }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={title}>
      <button
        type="button"
        aria-label="إغلاق النافذة"
        className="absolute inset-0 cursor-default bg-black/65 backdrop-blur-sm"
        onClick={onClose}
        tabIndex={-1}
      />
      <div className={cn("anim-pop relative flex max-h-[88dvh] w-full flex-col overflow-hidden rounded-2xl border border-line bg-panel shadow-2xl shadow-black/50", maxWidth)}>
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <h2 className="font-display text-[1rem] font-bold">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            className="focus-ring rounded-lg p-1.5 text-mut transition hover:bg-card hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
}

/* ---------- حوار تأكيد ---------- */

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  tone?: "danger" | "accent";
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({ open, title, message, confirmLabel = "تأكيد", tone = "danger", onConfirm, onClose }: ConfirmDialogProps) {
  return (
    <Modal open={open} onClose={onClose} title={title} maxWidth="max-w-sm">
      <div className="flex flex-col items-center gap-4 text-center">
        <span
          className={cn(
            "flex h-14 w-14 items-center justify-center rounded-full border",
            tone === "danger" ? "border-danger/40 bg-danger/10 text-danger" : "border-accent/40 bg-accent/10 text-accent"
          )}
        >
          <AlertTriangle size={26} />
        </span>
        <div className="text-sm leading-relaxed text-mut">{message}</div>
        <div className="flex w-full gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="focus-ring flex-1 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-raise"
          >
            إلغاء
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={cn(
              "focus-ring flex-1 rounded-xl px-4 py-2.5 text-sm font-bold text-white transition",
              tone === "danger" ? "bg-red-600 hover:bg-red-500" : "bg-accent-deep hover:brightness-110"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ---------- التنبيهات ---------- */

export function Toasts() {
  const { toasts, dismissToast } = useHub();
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-24 left-3 z-[70] flex w-[calc(100%-1.5rem)] max-w-xs flex-col gap-2 sm:left-5 lg:bottom-6">
      {toasts.map((toast) => {
        const Icon = toast.tone === "success" ? CheckCircle2 : toast.tone === "error" ? AlertCircle : Info;
        return (
          <div
            key={toast.id}
            className={cn(
              "anim-toast pointer-events-auto flex items-center gap-2.5 rounded-xl border bg-panel/95 px-3.5 py-3 text-sm shadow-xl shadow-black/40 backdrop-blur",
              toast.tone === "success" && "border-accent/40",
              toast.tone === "error" && "border-danger/50",
              toast.tone === "info" && "border-gold/40"
            )}
          >
            <Icon
              size={18}
              className={cn(
                "shrink-0",
                toast.tone === "success" && "text-accent",
                toast.tone === "error" && "text-danger",
                toast.tone === "info" && "text-gold"
              )}
            />
            <p className="flex-1 leading-snug">{toast.message}</p>
            <button
              type="button"
              onClick={() => dismissToast(toast.id)}
              aria-label="إغلاق التنبيه"
              className="rounded p-0.5 text-mut transition hover:text-ink"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ---------- مفتاح تبديل ---------- */

interface ToggleProps {
  checked: boolean;
  onChange: (value: boolean) => void;
  label: string;
  description?: string;
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm font-semibold">{label}</p>
        {description && <p className="mt-0.5 text-xs leading-relaxed text-mut">{description}</p>}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={cn(
          "focus-ring flex h-6.5 w-11.5 shrink-0 items-center rounded-full border px-0.5 transition-colors duration-200",
          checked ? "justify-end border-accent/60 bg-accent-deep" : "justify-start border-line bg-raise"
        )}
      >
        <span className={cn("h-5 w-5 rounded-full shadow transition-colors", checked ? "bg-ink" : "bg-mut")} />
      </button>
    </div>
  );
}

/* ---------- حالة فارغة ---------- */

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
  children?: ReactNode;
}

export function EmptyState({ icon: Icon, title, message, children }: EmptyStateProps) {
  return (
    <div className="anim-rise flex flex-col items-center gap-3 rounded-2xl border border-dashed border-line bg-panel/50 px-6 py-14 text-center">
      <span className="flex h-16 w-16 items-center justify-center rounded-full border border-accent/25 bg-accent/8 text-accent">
        <Icon size={28} />
      </span>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="max-w-sm text-sm leading-relaxed text-mut">{message}</p>
      {children}
    </div>
  );
}