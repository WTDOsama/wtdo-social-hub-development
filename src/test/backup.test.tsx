import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import App from "../App";
import { STORAGE_KEY } from "../store";
import { makeDefaultApps } from "../data/apps";

const renderApp = () => render(<App />);
const bottomNav = () => within(screen.getByRole("navigation", { name: "التنقل السفلي" }));
const storedState = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
const goSettings = () => fireEvent.click(bottomNav().getByRole("button", { name: "الإعدادات" }));

describe("النسخ الاحتياطي", () => {
  it("تصدير JSON ينزّل ملفًا صالحًا بكل التطبيقات والإعدادات", async () => {
    let capturedBlob: Blob | null = null;
    let downloadName = "";
    URL.createObjectURL = vi.fn((blob: Blob) => {
      capturedBlob = blob;
      return "blob:mock";
    });
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) {
      downloadName = this.download;
    });

    renderApp();
    goSettings();
    fireEvent.click(screen.getByRole("button", { name: /تصدير JSON/ }));

    expect(capturedBlob).not.toBeNull();
    expect(downloadName).toMatch(/^wtdo-social-hub-backup-\d{4}-\d{2}-\d{2}\.json$/);
    const data = JSON.parse(await (capturedBlob as unknown as Blob).text());
    expect(data.app).toBe("wtdo-social-hub");
    expect(data.version).toBe(1);
    expect(data.apps).toHaveLength(15);
    expect(data.settings.hubName).toBe("WTDO Social Hub");
    expect(screen.getByText("تم تنزيل النسخة الاحتياطية بصيغة JSON")).toBeInTheDocument();
  });

  it("الاستيراد يطلب تأكيدًا ثم يستبدل القائمة والإعدادات", async () => {
    renderApp();
    goSettings();

    const backup = {
      app: "wtdo-social-hub",
      version: 1,
      exportedAt: new Date().toISOString(),
      apps: makeDefaultApps().slice(0, 2),
      settings: { ...storedState().settings, accent: "gold", hubName: "مركز النسخة" },
    };
    const file = new File([JSON.stringify(backup)], "backup.json", { type: "application/json" });
    fireEvent.change(screen.getByTestId("import-input"), { target: { files: [file] } });

    const dialog = await screen.findByRole("dialog", { name: "استيراد نسخة احتياطية" });
    expect(within(dialog).getByText(/تطبيقان/)).toBeInTheDocument();

    // الإلغاء لا يستبدل شيئًا
    fireEvent.click(within(dialog).getByRole("button", { name: "إلغاء" }));
    expect(storedState().apps).toHaveLength(15);

    fireEvent.change(screen.getByTestId("import-input"), { target: { files: [file] } });
    const dialog2 = await screen.findByRole("dialog", { name: "استيراد نسخة احتياطية" });
    fireEvent.click(within(dialog2).getByRole("button", { name: "استبدال واستيراد" }));

    const stored = storedState();
    expect(stored.apps).toHaveLength(2);
    expect(stored.settings.accent).toBe("gold");
    expect(stored.settings.hubName).toBe("مركز النسخة");
  });

  it("يرفض الملفات التالفة والتطبيقات ذات الروابط الخطرة دون المساس بالبيانات", async () => {
    renderApp();
    goSettings();

    const badJson = new File(["{تالف", "bad.json"], "bad.json", { type: "application/json" });
    fireEvent.change(screen.getByTestId("import-input"), { target: { files: [badJson] } });
    expect(await screen.findByText(/فشل الاستيراد: الملف ليس JSON صالحًا/)).toBeInTheDocument();

    const evil = {
      version: 1,
      apps: [{ name: "شرير", url: "javascript:alert(document.cookie)" }],
    };
    const evilFile = new File([JSON.stringify(evil)], "evil.json", { type: "application/json" });
    fireEvent.change(screen.getByTestId("import-input"), { target: { files: [evilFile] } });
    expect(await screen.findByText(/التطبيق رقم 1 غير صالح/)).toBeInTheDocument();

    expect(screen.queryByRole("dialog", { name: "استيراد نسخة احتياطية" })).not.toBeInTheDocument();
    expect(storedState().apps).toHaveLength(15);
  });

  it("استعادة الافتراضية بعد الاستيراد ترجع الـ15 تطبيقًا بتأكيد", async () => {
    renderApp();
    goSettings();
    const backup = { version: 1, apps: makeDefaultApps().slice(0, 1), settings: {} };
    const file = new File([JSON.stringify(backup)], "one.json", { type: "application/json" });
    fireEvent.change(screen.getByTestId("import-input"), { target: { files: [file] } });
    const dialog = await screen.findByRole("dialog", { name: "استيراد نسخة احتياطية" });
    fireEvent.click(within(dialog).getByRole("button", { name: "استبدال واستيراد" }));
    expect(storedState().apps).toHaveLength(1);

    fireEvent.click(screen.getByRole("button", { name: /استعادة التطبيقات الافتراضية/ }));
    const confirm = screen.getByRole("dialog", { name: "استعادة التطبيقات الافتراضية" });
    fireEvent.click(within(confirm).getByRole("button", { name: "استعادة الافتراضية" }));
    expect(storedState().apps).toHaveLength(15);
    expect(storedState().apps[0].id).toBe("whatsapp");
  });
});

describe("الإعدادات والتخصيص", () => {
  it("لون التمييز وحجم البطاقة والأوصف تنعكس فورًا وتُحفظ", () => {
    renderApp();
    goSettings();

    fireEvent.click(screen.getByRole("button", { name: "لون ذهبي" }));
    expect(storedState().settings.accent).toBe("gold");
    expect(document.documentElement.style.getPropertyValue("--hub-accent")).toBe("#D4AF37");

    fireEvent.click(screen.getByRole("button", { name: "مضغوط" }));
    expect(storedState().settings.cardSize).toBe("compact");

    fireEvent.click(screen.getByRole("switch", { name: "إظهار الأوصاف" }));
    expect(storedState().settings.showDescriptions).toBe(false);

    fireEvent.click(bottomNav().getByRole("button", { name: "الرئيسية" }));
    expect(screen.queryByText("مراسلة فورية ومكالمات")).not.toBeInTheDocument();
  });

  it("الهوية: تغيير اسم التطبيق والمالك يظهر في الواجهة", () => {
    renderApp();
    goSettings();
    fireEvent.change(screen.getByLabelText("اسم التطبيق"), { target: { value: "مركزي الرقمي" } });
    fireEvent.change(screen.getByLabelText(/اسم المالك/), { target: { value: "قائدي" } });
    fireEvent.click(screen.getByRole("button", { name: "حفظ الهوية" }));

    expect(storedState().settings.hubName).toBe("مركزي الرقمي");
    fireEvent.click(bottomNav().getByRole("button", { name: "الرئيسية" }));
    expect(screen.getByText("قائدي")).toBeInTheDocument();
  });

  it("التصنيف الافتراضي يُطبّق عند فتح اللوحة", () => {
    renderApp();
    goSettings();
    fireEvent.change(screen.getByLabelText(/التصنيف الافتراضي/), { target: { value: "favorites" } });
    fireEvent.click(bottomNav().getByRole("button", { name: "الرئيسية" }));
    expect(within(screen.getByTestId("apps-grid")).getAllByRole("button", { name: /^فتح / })).toHaveLength(4);
  });

  it("إعادة ضبط الإعدادات تبقي التطبيقات وتعيد الهوية الافتراضية", () => {
    renderApp();
    goSettings();
    fireEvent.click(screen.getByRole("button", { name: "لون ذهبي" }));
    fireEvent.click(screen.getByRole("button", { name: /إعادة ضبط الإعدادات الافتراضية/ }));
    const confirm = screen.getByRole("dialog", { name: "إعادة ضبط الإعدادات" });
    fireEvent.click(within(confirm).getByRole("button", { name: "إعادة الضبط" }));
    const stored = storedState();
    expect(stored.settings.accent).toBe("teal");
    expect(stored.settings.hubName).toBe("WTDO Social Hub");
    expect(stored.apps).toHaveLength(15);
  });
});