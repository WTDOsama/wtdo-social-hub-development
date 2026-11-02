import { useEffect, useMemo, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { CheckCircle2, ImagePlus, RotateCcw, Sparkles } from "lucide-react";
import type { AppDraft, CategoryId, HubApp, IconSpec } from "../types";
import { BRANDS } from "../data/brands";
import { CATEGORIES, REAL_CATEGORIES, colorForName } from "../data/apps";
import { validateUrl } from "../lib/utils";
import { useHub } from "../store";
import { Modal, Toggle } from "./ui";
import { AppIcon } from "./AppIcon";
import { cn } from "../utils/cn";

interface AppFormProps {
  open: boolean;
  onClose: () => void;
  /** عند تمريره يتم تحرير التطبيق، وإلا تُنشأ إضافة جديدة */
  initial?: HubApp | null;
  preset?: Partial<AppDraft> | null;
}

type IconTab = "brand" | "emoji" | "upload";

const QUICK_EMOJI = ["🚀", "🤖", "🎮", "🎬", "", "🛒", "💼", "🎨", "⚽", "", "", "✈️"];

const inputClass =
  "focus-ring w-full rounded-xl border border-line bg-night/70 px-3.5 py-2.5 text-sm placeholder:text-mut/50 transition focus:border-accent/60";

export function AppForm({ open, onClose, initial = null, preset = null }: AppFormProps) {
  const { addApp, updateApp, notify } = useHub();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<CategoryId>("social");
  const [favorite, setFavorite] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [androidPackage, setAndroidPackage] = useState("");
  const [icon, setIcon] = useState<IconSpec>({ kind: "letter", value: "؟", color: "#14B8A6" });
  const [iconTouched, setIconTouched] = useState(false);
  const [iconTab, setIconTab] = useState<IconTab>("brand");
  const [errors, setErrors] = useState<{ name?: string; url?: string; androidPackage?: string }>({});
  const fileRef = useRef<HTMLInputElement>(null);

  /* تهيئة الحقول عند الفتح */
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setIconTab("brand");
    if (initial) {
      setName(initial.name);
      setUrl(initial.url);
      setDescription(initial.description ?? "");
      setCategory(initial.category);
      setFavorite(initial.favorite);
      setHidden(initial.hidden);
      setAndroidPackage(initial.androidPackage ?? "");
      setIcon({ ...initial.icon });
      setIconTouched(true);
    } else {
      setName(preset?.name ?? "");
      setUrl(preset?.url ?? "");
      setDescription(preset?.description ?? "");
      setCategory(preset?.category ?? "social");
      setFavorite(preset?.favorite ?? false);
      setHidden(preset?.hidden ?? false);
      setAndroidPackage(preset?.androidPackage ?? "");
      if (preset?.icon) {
        setIcon({ ...preset.icon });
        setIconTouched(true);
      } else {
        setIconTouched(false);
        setIcon({ kind: "letter", value: "؟", color: "#14B8A6" });
      }
    }
  }, [open, initial, preset]);

  /* حرف تلقائي ما دامت الأيقونة لم تُختر يدويًا */
  useEffect(() => {
    if (!iconTouched) {
      setIcon({ kind: "letter", value: name.trim().charAt(0) || "؟", color: colorForName(name || "تطبيق") });
    }
  }, [name, iconTouched]);

  const urlCheck = useMemo(() => (url.trim() ? validateUrl(url) : null), [url]);

  const pickIcon = (next: IconSpec) => {
    setIcon(next);
    setIconTouched(true);
  };

  const handleUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      notify("الرجاء اختيار ملف صورة صالح", "error");
      return;
    }
    if (file.size > 2_000_000) {
      notify("حجم الصورة كبير — الحد الأقصى 2MB", "error");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          const side = 128;
          canvas.width = side;
          canvas.height = side;
          const ctx = canvas.getContext("2d");
          if (!ctx) throw new Error("canvas");
          const scale = Math.max(side / image.width, side / image.height);
          const w = image.width * scale;
          const h = image.height * scale;
          ctx.drawImage(image, (side - w) / 2, (side - h) / 2, w, h);
          pickIcon({ kind: "image", dataUrl: canvas.toDataURL("image/png") });
        } catch {
          notify("تعذرت معالجة الصورة، جرّب صورة أخرى", "error");
        }
      };
      image.onerror = () => notify("تعذرت قراءة الصورة", "error");
      image.src = String(reader.result);
    };
    reader.onerror = () => notify("تعذرت قراءة الملف", "error");
    reader.readAsDataURL(file);
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const nextErrors: typeof errors = {};
    if (!name.trim()) nextErrors.name = "أدخل اسم التطبيق";
    const check = validateUrl(url);
    if (!check.ok) nextErrors.url = check.error;
    if (androidPackage.trim() && !/^[a-zA-Z][a-zA-Z0-9_]*(\.[a-zA-Z0-9_]+)+$/.test(androidPackage.trim())) {
      nextErrors.androidPackage = "اسم الحزمة غير صالح — مثال: com.example.app";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const draft: AppDraft = {
      name: name.trim(),
      url: check.ok ? check.url : url,
      description: description.trim(),
      category,
      icon,
      favorite,
      hidden,
      androidPackage: androidPackage.trim() || undefined,
    };

    if (initial) {
      updateApp(initial.id, draft);
      notify(`تم حفظ تعديلات «${draft.name}»`);
    } else {
      addApp(draft);
      notify(`تمت إضافة «${draft.name}» بنجاح`);
    }
    onClose();
  };

  const categoryOptions = CATEGORIES.filter((c) => REAL_CATEGORIES.includes(c.id as CategoryId));

  return (
    <Modal open={open} onClose={onClose} title={initial ? `تحرير «${initial.name}»` : "إضافة تطبيق جديد"}>
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* معاينة حية */}
        <div className="flex items-center gap-3 rounded-xl border border-line bg-night/50 p-3">
          <AppIcon icon={icon} size={52} />
          <div className="min-w-0">
            <p dir="auto" className="truncate text-sm font-bold">{name.trim() || "اسم التطبيق"}</p>
            <p className="truncate text-xs text-mut">{description.trim() || "معاينة حية للبطاقة"}</p>
          </div>
          {iconTouched && (
            <button
              type="button"
              onClick={() => setIconTouched(false)}
              className="focus-ring ms-auto flex items-center gap-1 rounded-lg border border-line px-2 py-1 text-[11px] text-mut transition hover:text-ink"
              title="العودة للأيقونة التلقائية"
            >
              <RotateCcw size={12} />
              تلقائي
            </button>
          )}
        </div>

        <div>
          <label htmlFor="app-name" className="mb-1.5 block text-sm font-semibold">
            اسم التطبيق <span className="text-danger">*</span>
          </label>
          <input
            id="app-name"
            value={name}
            onChange={(event) => {
              setName(event.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            maxLength={80}
            placeholder="مثال: ديسكورد"
            className={cn(inputClass, errors.name && "border-danger/70")}
          />
          {errors.name && <p role="alert" className="mt-1 text-xs text-danger">{errors.name}</p>}
        </div>

        <div>
          <label htmlFor="app-url" className="mb-1.5 block text-sm font-semibold">
            الرابط (URL) <span className="text-danger">*</span>
          </label>
          <div className="relative">
            <input
              id="app-url"
              value={url}
              onChange={(event) => {
                setUrl(event.target.value);
                if (errors.url) setErrors((prev) => ({ ...prev, url: undefined }));
              }}
              dir="ltr"
              inputMode="url"
              placeholder="https://example.com"
              className={cn(inputClass, "text-left", errors.url && "border-danger/70", urlCheck?.ok && "border-accent/50 pe-9")}
            />
            {urlCheck?.ok && (
              <CheckCircle2 size={16} className="absolute end-3 top-1/2 -translate-y-1/2 text-accent" aria-hidden />
            )}
          </div>
          {errors.url ? (
            <p role="alert" className="mt-1 text-xs text-danger">{errors.url}</p>
          ) : (
            <p className="mt-1 text-[11px] text-mut">يُقبل فقط http أو https — يُضاف https تلقائيًا إن لم تكتبه</p>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="app-category" className="mb-1.5 block text-sm font-semibold">
              التصنيف <span className="text-danger">*</span>
            </label>
            <select
              id="app-category"
              value={category}
              onChange={(event) => setCategory(event.target.value as CategoryId)}
              className={cn(inputClass, "cursor-pointer")}
            >
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="app-desc" className="mb-1.5 block text-sm font-semibold">
              وصف مختصر <span className="text-xs font-normal text-mut">(اختياري)</span>
            </label>
            <input
              id="app-desc"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={160}
              placeholder="يظهر تحت اسم التطبيق"
              className={inputClass}
            />
          </div>
        </div>

        {/* اختيار الأيقونة */}
        <div className="rounded-xl border border-line bg-night/40 p-3">
          <div className="mb-3 flex items-center gap-1.5">
            {(
              [
                { id: "brand", label: "أيقونات جاهزة" },
                { id: "emoji", label: "رمز تعبيري" },
                { id: "upload", label: "رفع صورة" },
              ] as { id: IconTab; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setIconTab(tab.id)}
                className={cn(
                  "focus-ring rounded-lg px-3 py-1.5 text-xs font-semibold transition",
                  iconTab === tab.id ? "bg-accent-deep/30 text-accent" : "text-mut hover:bg-card hover:text-ink"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {iconTab === "brand" && (
            <div className="grid max-h-44 grid-cols-6 gap-1.5 overflow-y-auto sm:grid-cols-8">
              {Object.entries(BRANDS).map(([key, brand]) => (
                <button
                  key={key}
                  type="button"
                  title={brand.label}
                  aria-label={`أيقونة ${brand.label}`}
                  onClick={() => pickIcon({ kind: "brand", key })}
                  className={cn(
                    "focus-ring flex items-center justify-center rounded-lg p-1 transition hover:bg-card",
                    icon.kind === "brand" && icon.key === key && "bg-accent-deep/25 ring-1 ring-accent"
                  )}
                >
                  <AppIcon icon={{ kind: "brand", key }} size={34} />
                </button>
              ))}
            </div>
          )}

          {iconTab === "emoji" && (
            <div className="space-y-2.5">
              <input
                aria-label="رمز تعبيري للأيقونة"
                value={icon.kind === "emoji" ? icon.value : ""}
                onChange={(event) => {
                  const value = [...event.target.value.trim()].slice(0, 2).join("");
                  if (value) pickIcon({ kind: "emoji", value });
                }}
                placeholder="اكتب أو الصق رمزًا مثل 🚀"
                className={inputClass}
              />
              <div className="flex flex-wrap gap-1.5">
                {QUICK_EMOJI.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    aria-label={`اختيار ${emoji}`}
                    onClick={() => pickIcon({ kind: "emoji", value: emoji })}
                    className="focus-ring rounded-lg border border-line bg-card px-2 py-1 text-lg transition hover:scale-110 hover:border-accent/50"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          {iconTab === "upload" && (
            <div className="flex flex-col items-center gap-2 py-2">
              <input ref={fileRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" aria-label="رفع صورة أيقونة" />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="focus-ring flex items-center gap-2 rounded-xl border border-dashed border-accent/40 bg-accent/8 px-4 py-2.5 text-sm font-semibold text-accent transition hover:bg-accent/15"
              >
                <ImagePlus size={16} />
                اختيار صورة من الجهاز
              </button>
              <p className="text-[11px] text-mut">تُقصّ تلقائيًا إلى 128×128 وتُحفظ محليًا (حد 2MB)</p>
            </div>
          )}
        </div>

        <div className="space-y-3 rounded-xl border border-line bg-night/40 p-3.5">
          <Toggle checked={favorite} onChange={setFavorite} label="إضافة إلى المفضلة" description="يظهر في قسم الوصول السريع" />
          <Toggle checked={hidden} onChange={setHidden} label="إخفاء من اللوحة" description="يبقى محفوظًا في صفحة الإدارة فقط" />
        </div>

        <details className="rounded-xl border border-line bg-night/40 p-3.5">
          <summary className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-mut transition hover:text-ink">
            <Sparkles size={14} className="text-gold" />
            خيارات متقدمة — إطلاق تطبيق أندرويد الأصلي
          </summary>
          <div className="mt-3">
            <label htmlFor="app-package" className="mb-1.5 block text-xs font-semibold text-mut">
              اسم حزمة أندرويد (اختياري)
            </label>
            <input
              id="app-package"
              value={androidPackage}
              onChange={(event) => {
                setAndroidPackage(event.target.value);
                if (errors.androidPackage) setErrors((prev) => ({ ...prev, androidPackage: undefined }));
              }}
              dir="ltr"
              placeholder="com.example.app"
              className={cn(inputClass, "text-left", errors.androidPackage && "border-danger/70")}
            />
            {errors.androidPackage && <p role="alert" className="mt-1 text-xs text-danger">{errors.androidPackage}</p>}
            <p className="mt-1.5 text-[11px] leading-relaxed text-mut">
              على أندرويد يُفتح التطبيق الأصلي إن كان مثبتًا، وإلا يُفتح الموقع الرسمي تلقائيًا. وعلى iOS تفتح الروابط العامة التطبيق مباشرة إن كان مثبتًا.
            </p>
          </div>
        </details>

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="focus-ring flex-1 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold transition hover:bg-raise"
          >
            إلغاء
          </button>
          <button
            type="submit"
            className="focus-ring flex-1 rounded-xl bg-accent-deep px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-accent-deep/25 transition hover:brightness-110"
          >
            {initial ? "حفظ التعديلات" : "إضافة التطبيق"}
          </button>
        </div>
      </form>
    </Modal>
  );
}