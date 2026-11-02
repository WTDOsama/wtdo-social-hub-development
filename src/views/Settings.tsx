import { useEffect, useRef, useState, type ChangeEvent, type ReactNode } from "react";
import {
  AlertTriangle,
  Check,
  Download,
  HardDriveDownload,
  LayoutGrid,
  Moon,
  PackageCheck,
  Palette,
  RotateCcw,
  Settings as SettingsIcon,
  ShieldCheck,
  Smartphone,
  Upload,
  UserRound,
  Wifi,
  WifiOff,
  type LucideIcon,
} from "lucide-react";
import type { AccentId, CardSize, FilterId, HubSettings } from "../types";
import { ACCENTS, CATEGORIES } from "../data/apps";
import { appCountLabel, formatNumber, parseBackup } from "../lib/utils";
import { useHub } from "../store";
import { ConfirmDialog, Toggle } from "../components/ui";
import { Logo } from "../components/layout";
import { cn } from "../utils/cn";

function Section({ icon: Icon, title, description, children }: { icon: LucideIcon; title: string; description?: string; children: ReactNode }) {
  return (
    <section className="anim-rise rounded-2xl border border-line bg-panel/70 p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent/25 bg-accent/10 text-accent">
          <Icon size={17} />
        </span>
        <div>
          <h2 className="font-display text-[1rem] font-bold">{title}</h2>
          {description && <p className="mt-0.5 text-xs leading-relaxed text-mut">{description}</p>}
        </div>
      </div>
      {children}
    </section>
  );
}

const inputClass =
  "focus-ring w-full rounded-xl border border-line bg-night/70 px-3.5 py-2.5 text-sm placeholder:text-mut/50 transition focus:border-accent/60";

type PendingImport = { apps: import("../types").HubApp[]; settings: HubSettings; fileName: string };

export function Settings() {
  const { state, updateSettings, resetSettings, restoreDefaults, exportBackup, importBackup, notify, online, installReady, promptInstall } = useHub();
  const { settings, apps } = state;
  const [hubName, setHubName] = useState(settings.hubName);
  const [ownerName, setOwnerName] = useState(settings.ownerName);
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setHubName(settings.hubName);
    setOwnerName(settings.ownerName);
  }, [settings.hubName, settings.ownerName]);

  const favoriteCount = apps.filter((app) => app.favorite).length;
  const hiddenCount = apps.filter((app) => app.hidden).length;

  const saveIdentity = () => {
    if (!hubName.trim() || !ownerName.trim()) {
      notify("اسم التطبيق واسم المالك مطلوبان", "error");
      return;
    }
    updateSettings({ hubName: hubName.trim(), ownerName: ownerName.trim() });
    notify("تم حفظ الهوية بنجاح");
  };

  const handleImportFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const data = parseBackup(text);
      setPendingImport({ ...data, fileName: file.name });
    } catch (error) {
      notify(error instanceof Error ? `فشل الاستيراد: ${error.message}` : "فشل الاستيراد: ملف غير صالح", "error");
    }
  };

  const sizeOptions: { id: CardSize; label: string }[] = [
    { id: "compact", label: "مضغوط" },
    { id: "comfortable", label: "مريح" },
    { id: "large", label: "كبير" },
  ];

  return (
    <div>
      <header className="anim-rise mb-6">
        <h1 className="flex items-center gap-2.5 font-display text-2xl font-bold">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
            <SettingsIcon size={19} />
          </span>
          الإعدادات
        </h1>
        <p className="mt-2 text-sm text-mut">خصص لوحتك، وأدر نسخك الاحتياطية — كل شيء محفوظ محليًا على جهازك.</p>
      </header>

      <div className="grid gap-5 xl:grid-cols-2">
        {/* الهوية */}
        <Section icon={UserRound} title="الهوية والعلامة" description="اسم التطبيق واسمك في رسالة الترحيب">
          <div className="mb-4 flex items-center gap-3 rounded-xl border border-line bg-night/50 p-3">
            <Logo size={44} />
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-bold">{hubName || "WTDO Social Hub"}</p>
              <p className="text-[11px] text-mut">مرحبًا، {ownerName || "…"} <span className="text-gold">✦</span></p>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label htmlFor="set-hubname" className="mb-1.5 block text-xs font-semibold text-mut">اسم التطبيق</label>
              <input id="set-hubname" value={hubName} onChange={(event) => setHubName(event.target.value)} maxLength={60} className={inputClass} />
            </div>
            <div>
              <label htmlFor="set-ownername" className="mb-1.5 block text-xs font-semibold text-mut">اسم المالك (رسالة الترحيب)</label>
              <input id="set-ownername" value={ownerName} onChange={(event) => setOwnerName(event.target.value)} maxLength={40} className={inputClass} />
            </div>
            <button
              type="button"
              onClick={saveIdentity}
              className="focus-ring rounded-xl bg-accent-deep px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
            >
              حفظ الهوية
            </button>
          </div>
        </Section>

        {/* المظهر */}
        <Section icon={Palette} title="المظهر والتخطيط" description="الوضع الداكن هو الهوية الأساسية الدائمة للتطبيق">
          <div className="space-y-5">
            <div>
              <p className="mb-2 text-xs font-semibold text-mut">لون التمييز — {ACCENTS[settings.accent].label}</p>
              <div className="flex flex-wrap gap-2.5">
                {(Object.keys(ACCENTS) as AccentId[]).map((accentId) => {
                  const accent = ACCENTS[accentId];
                  const active = settings.accent === accentId;
                  return (
                    <button
                      key={accentId}
                      type="button"
                      aria-label={`لون ${accent.label}`}
                      aria-pressed={active}
                      title={accent.label}
                      onClick={() => updateSettings({ accent: accentId })}
                      style={{ background: `linear-gradient(135deg, ${accent.accent}, ${accent.deep})` }}
                      className={cn(
                        "focus-ring flex h-9 w-9 items-center justify-center rounded-full transition-transform hover:scale-110",
                        active && "ring-2 ring-ink ring-offset-2 ring-offset-panel"
                      )}
                    >
                      {active && <Check size={16} className="text-white" />}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold text-mut">حجم بطاقات التطبيقات</p>
              <div className="flex gap-1.5 rounded-xl border border-line bg-night/60 p-1">
                {sizeOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    aria-pressed={settings.cardSize === option.id}
                    onClick={() => updateSettings({ cardSize: option.id })}
                    className={cn(
                      "focus-ring flex-1 rounded-lg px-3 py-2 text-xs font-bold transition",
                      settings.cardSize === option.id ? "bg-accent-deep/35 text-accent" : "text-mut hover:text-ink"
                    )}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="set-defaultcat" className="mb-1.5 block text-xs font-semibold text-mut">التصنيف الافتراضي عند الفتح</label>
              <select
                id="set-defaultcat"
                value={settings.defaultCategory}
                onChange={(event) => updateSettings({ defaultCategory: event.target.value as FilterId })}
                className={cn(inputClass, "cursor-pointer")}
              >
                {CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>{category.label}</option>
                ))}
              </select>
            </div>

            <Toggle
              checked={settings.showDescriptions}
              onChange={(value) => updateSettings({ showDescriptions: value })}
              label="إظهار الأوصاف"
              description="الوصف المختصر تحت اسم كل تطبيق"
            />
            <Toggle
              checked={settings.showQuickAccess}
              onChange={(value) => updateSettings({ showQuickAccess: value })}
              label="شريط الوصول السريع"
              description="صف المفضلة أعلى اللوحة"
            />

            <p className="flex items-center gap-2 rounded-xl border border-line bg-night/50 px-3 py-2.5 text-[11px] text-mut">
              <Moon size={14} className="shrink-0 text-gold" />
              الوضع الداكن جزء من هوية WTDO ولا يمكن تغييره — لراحة العين وتوفير البطارية.
            </p>
          </div>
        </Section>

        {/* النسخ الاحتياطي */}
        <Section icon={HardDriveDownload} title="النسخ الاحتياطي والاستعادة" description="انقل تطبيقاتك وإعداداتك بين الأجهزة عبر ملف JSON">
          <div className="mb-4 flex flex-wrap gap-2 text-[11px]">
            <span className="rounded-full border border-line bg-night/60 px-2.5 py-1 text-mut">{appCountLabel(apps.length)}</span>
            <span className="rounded-full border border-gold/30 bg-gold/10 px-2.5 py-1 text-gold">{formatNumber(favoriteCount)} مفضل</span>
            <span className="rounded-full border border-line bg-night/60 px-2.5 py-1 text-mut">{formatNumber(hiddenCount)} مخفي</span>
          </div>
          <div className="flex flex-col gap-2.5 sm:flex-row">
            <button
              type="button"
              onClick={exportBackup}
              className="focus-ring flex flex-1 items-center justify-center gap-2 rounded-xl bg-accent-deep px-4 py-2.5 text-sm font-bold text-white transition hover:brightness-110"
            >
              <Download size={16} />
              تصدير JSON
            </button>
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={handleImportFile} className="hidden" aria-label="استيراد ملف نسخة احتياطية" data-testid="import-input" />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="focus-ring flex flex-1 items-center justify-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5 text-sm font-bold text-accent transition hover:bg-accent/20"
            >
              <Upload size={16} />
              استيراد نسخة
            </button>
          </div>
          <button
            type="button"
            onClick={() => setConfirmRestore(true)}
            className="focus-ring mt-2.5 flex w-full items-center justify-center gap-2 rounded-xl border border-line bg-card px-4 py-2.5 text-sm font-semibold text-mut transition hover:border-gold/40 hover:text-gold"
          >
            <RotateCcw size={15} />
            استعادة التطبيقات الافتراضية (15)
          </button>
          <p className="mt-3 text-[11px] leading-relaxed text-mut">
            الاستيراد والاستعادة يطلبان تأكيدك دائمًا ولا يستبدلان بياناتك بصمت. صدّر نسخة بانتظام لنقل إعداداتك لأي جهاز آخر.
          </p>
        </Section>

        {/* التثبيت والاتصال */}
        <Section icon={Smartphone} title="تثبيت التطبيق (PWA)" description="يعمل كتطبيق مستقل على أندرويد وسطح المكتب، وواجهته تعمل دون اتصال">
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-xl border border-line bg-night/50 px-3 py-2.5 text-xs">
              {online ? <Wifi size={15} className="text-accent" /> : <WifiOff size={15} className="text-gold" />}
              <span className={online ? "text-accent" : "text-gold"}>{online ? "متصل بالإنترنت" : "غير متصل — اللوحة تعمل محليًا"}</span>
              <PackageCheck size={15} className="ms-auto text-mut" />
              <span className="text-mut">الواجهة تُخزن بعد أول زيارة</span>
            </div>
            {installReady ? (
              <button
                type="button"
                onClick={() => void promptInstall()}
                className="focus-ring flex w-full items-center justify-center gap-2 rounded-xl bg-accent-deep px-4 py-3 text-sm font-bold text-white shadow-lg shadow-accent-deep/30 transition hover:brightness-110"
              >
                <Download size={16} />
                تثبيت WTDO Social Hub الآن
              </button>
            ) : (
              <div className="space-y-2 rounded-xl border border-line bg-night/40 p-3.5 text-[11.5px] leading-relaxed text-mut">
                <p><span className="font-bold text-ink">أندرويد (Chrome):</span> القائمة ⋮ ← «تثبيت التطبيق» أو «إضافة إلى الشاشة الرئيسية».</p>
                <p><span className="font-bold text-ink">آيفون (Safari):</span> زر المشاركة ← «إضافة إلى الشاشة الرئيسية».</p>
                <p><span className="font-bold text-ink">سطح المكتب:</span> أيقونة التثبيت في شريط العنوان، أو قائمة المتصفح.</p>
              </div>
            )}
            <p className="text-[11px] leading-relaxed text-mut">
              دون اتصال تعمل اللوحة وإعداداتك كاملة، أما فتح واتساب ويوتيوب وبقية الخدمات فيتطلب إنترنت.
            </p>
          </div>
        </Section>

        {/* الخصوصية */}
        <Section icon={ShieldCheck} title="الخصوصية وأمان البيانات" description="تطبيق شخصي محلي بالكامل — بلا خوادم وبلا تتبع">
          <ul className="space-y-2.5 text-xs leading-relaxed text-mut">
            <li className="flex gap-2">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-accent" />
              لا نطلب أو نخزن كلمات مرور حساباتك أبدًا — تسجيل الدخول يتم في المواقع والتطبيقات الرسمية فقط.
            </li>
            <li className="flex gap-2">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-accent" />
              جميع الإعدادات وقائمة التطبيقات تُحفظ في متصفحك (LocalStorage) ولا تُرسل لأي خادم خارجي.
            </li>
            <li className="flex gap-2">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-accent" />
              الروابط تُفتح في تبويبات خارجية آمنة (noopener) ولا تُضمَّن أي مواقع داخل iframes.
            </li>
            <li className="flex gap-2 rounded-xl border border-gold/30 bg-gold/8 p-2.5">
              <AlertTriangle size={14} className="mt-0.5 shrink-0 text-gold" />
              <span className="text-gold/90">مسح بيانات المتصفح قد يمحو إعداداتك — احتفظ بنسخة احتياطية JSON بشكل دوري.</span>
            </li>
          </ul>
        </Section>

        {/* إعادة الضبط */}
        <Section icon={LayoutGrid} title="إعادة الضبط" description="إعادة الإعدادات فقط إلى الوضع الافتراضي مع الاحتفاظ بتطبيقاتك">
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="focus-ring flex items-center gap-2 rounded-xl border border-danger/40 bg-danger/10 px-4 py-2.5 text-sm font-bold text-danger transition hover:bg-danger/20"
          >
            <RotateCcw size={15} />
            إعادة ضبط الإعدادات الافتراضية
          </button>
        </Section>
      </div>

      {/* حوارات التأكيد */}
      <ConfirmDialog
        open={pendingImport !== null}
        onClose={() => setPendingImport(null)}
        title="استيراد نسخة احتياطية"
        tone="accent"
        confirmLabel="استبدال واستيراد"
        message={
          <>
            الملف <span dir="ltr" className="font-bold text-ink">{pendingImport?.fileName}</span> يحتوي على{" "}
            <span className="font-bold text-ink">{appCountLabel(pendingImport?.apps.length ?? 0)}</span>.
            <br />
            سيتم استبدال قائمتك الحالية ({appCountLabel(apps.length)}) وإعداداتك بالكامل. هل تريد المتابعة؟
          </>
        }
        onConfirm={() => {
          if (pendingImport) {
            importBackup({ apps: pendingImport.apps, settings: pendingImport.settings });
            notify(`تم استيراد ${appCountLabel(pendingImport.apps.length)} بنجاح`);
          }
        }}
      />
      <ConfirmDialog
        open={confirmRestore}
        onClose={() => setConfirmRestore(false)}
        title="استعادة التطبيقات الافتراضية"
        confirmLabel="استعادة الافتراضية"
        message={
          <>
            ستُستبدل قائمتك الحالية ({appCountLabel(apps.length)}) بالتطبيقات الافتراضية الخمسة عشر.
            <br />
            تعديلاتك وإضافاتك الحالية ستُفقد — الإعدادات لن تتغير.
          </>
        }
        onConfirm={() => {
          restoreDefaults();
          notify("تمت استعادة التطبيقات الافتراضية");
        }}
      />
      <ConfirmDialog
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="إعادة ضبط الإعدادات"
        tone="accent"
        confirmLabel="إعادة الضبط"
        message="ستعود الهوية والمظهر والتخطيط إلى الوضع الافتراضي، مع الاحتفاظ بجميع تطبيقاتك ومفضلاتك."
        onConfirm={() => {
          resetSettings();
          notify("تمت إعادة الإعدادات الافتراضية");
        }}
      />
    </div>
  );
}