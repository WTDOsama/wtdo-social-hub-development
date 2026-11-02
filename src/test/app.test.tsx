import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within, cleanup } from "@testing-library/react";
import App from "../App";
import { STORAGE_KEY } from "../store";

const renderApp = () => render(<App />);

function grid() {
  return within(screen.getByTestId("apps-grid"));
}
function cards() {
  return grid().getAllByRole("button", { name: /^فتح / });
}
function bottomNav() {
  return within(screen.getByRole("navigation", { name: "التنقل السفلي" }));
}
function storedState() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
}

describe("اللوحة الرئيسية", () => {
  it("تعرض الترحيب والتاريخ والتطبيقات الافتراضية الـ15", () => {
    renderApp();
    expect(screen.getByText(/مرحبًا،/)).toBeInTheDocument();
    expect(screen.getAllByText("WTDOsama").length).toBeGreaterThan(0);
    expect(cards()).toHaveLength(15);
    for (const name of ["واتساب", "يوتيوب", "إنستغرام", "تيك توك", "فيسبوك", "ماسنجر", "تيليجرام", "إكس (تويتر)", "جيميل", "جوجل درايف", "لينكدإن", "سناب شات", "بينتريست", "واتساب للأعمال", "يوتيوب ستوديو"]) {
      expect(grid().getByRole("button", { name: `فتح ${name}` })).toBeInTheDocument();
    }
    // التاريخ الميلادي بالعربية يظهر في الترويسة
    const today = new Intl.DateTimeFormat("ar-EG", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());
    expect(screen.getByText(today)).toBeInTheDocument();
  });

  it("البحث يصفّي فورًا بالاسم العربي أو الإنجليزي أو التصنيف، وزر المسح يعيد الكل", () => {
    renderApp();
    const search = screen.getByRole("searchbox", { name: /ابحث عن تطبيق/ });

    fireEvent.change(search, { target: { value: "واتس" } });
    expect(cards()).toHaveLength(2);

    fireEvent.change(search, { target: { value: "youtube" } });
    expect(cards()).toHaveLength(2); // يوتيوب + ستوديو (كلمات مفتاحية)

    fireEvent.change(search, { target: { value: "المراسلة" } });
    expect(cards()).toHaveLength(4);

    fireEvent.change(search, { target: { value: "لا-يوجد-شيء" } });
    expect(screen.getByText("لا توجد نتائج")).toBeInTheDocument();

    fireEvent.click(screen.getAllByRole("button", { name: "مسح البحث" })[0]);
    expect(cards()).toHaveLength(15);
  });

  it("تبويبات التصنيفات تصفّي التطبيقات بشكل صحيح", () => {
    renderApp();
    fireEvent.click(screen.getByRole("tab", { name: /المراسلة/ }));
    expect(cards()).toHaveLength(4);
    expect(grid().getByRole("button", { name: "فتح واتساب" })).toBeInTheDocument();
    expect(grid().queryByRole("button", { name: "فتح يوتيوب" })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("tab", { name: /الفيديو والترفيه/ }));
    expect(cards()).toHaveLength(2);

    fireEvent.click(screen.getByRole("tab", { name: /الإنتاجية/ }));
    expect(cards()).toHaveLength(3);

    fireEvent.click(screen.getByRole("tab", { name: /^الكل/ }));
    expect(cards()).toHaveLength(15);
  });

  it("المفضلة: تبويبات، إزالة، إضافة، وحفظ محلي", () => {
    renderApp();
    fireEvent.click(screen.getByRole("tab", { name: /المفضلة/ }));
    expect(cards()).toHaveLength(4); // واتساب، يوتيوب، إنستغرام، تيليجرام

    fireEvent.click(grid().getByRole("button", { name: "إزالة واتساب من المفضلة" }));
    expect(cards()).toHaveLength(3);
    expect(storedState().apps.find((a: { id: string }) => a.id === "whatsapp").favorite).toBe(false);

    fireEvent.click(screen.getByRole("tab", { name: /^الكل/ }));
    fireEvent.click(grid().getByRole("button", { name: "إضافة فيسبوك إلى المفضلة" }));
    fireEvent.click(screen.getByRole("tab", { name: /المفضلة/ }));
    expect(cards()).toHaveLength(4);
    expect(grid().getByRole("button", { name: "فتح فيسبوك" })).toBeInTheDocument();
  });

  it("شريط الوصول السريع يعرض المفضلة", () => {
    renderApp();
    expect(screen.getByText("وصول سريع")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "واتساب" })).toBeInTheDocument();
  });

  it("النقر على بطاقة يفتح الموقع الرسمي في تبويب آمن ويسجل الاستخدام", () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue({} as Window);
    renderApp();
    fireEvent.click(grid().getByRole("button", { name: "فتح واتساب" }));
    expect(openSpy).toHaveBeenCalledWith("https://web.whatsapp.com/", "_blank");
    expect(storedState().recentIds[0]).toBe("whatsapp");
  });

  it("التغييرات تبقى بعد إعادة التحميل (إعادة تركيب التطبيق)", () => {
    renderApp();
    fireEvent.click(grid().getByRole("button", { name: "إضافة فيسبوك إلى المفضلة" }));
    cleanup(); // محاكاة إغلاق الصفحة
    renderApp(); // إعادة فتحها — الحالة من LocalStorage
    fireEvent.click(screen.getByRole("tab", { name: /المفضلة/ }));
    expect(grid().getByRole("button", { name: "فتح فيسبوك" })).toBeInTheDocument();
    expect(cards()).toHaveLength(5);
  });

  it("لافتة عدم الاتصال تظهر وتختفي مع أحداث الشبكة", () => {
    renderApp();
    expect(screen.queryByText(/أنت غير متصل بالإنترنت/)).not.toBeInTheDocument();
    fireEvent(window, new Event("offline"));
    expect(screen.getByText(/أنت غير متصل بالإنترنت/)).toBeInTheDocument();
    fireEvent(window, new Event("online"));
    expect(screen.queryByText(/أنت غير متصل بالإنترنت/)).not.toBeInTheDocument();
  });

  it("السحب والإفلات يعيد ترتيب البطاقات ويُحفظ", () => {
    renderApp();
    const pinterest = grid().getByRole("button", { name: "فتح بينتريست" });
    const whatsapp = grid().getByRole("button", { name: "فتح واتساب" });
    const dataTransfer = { setData: vi.fn(), getData: vi.fn(() => "pinterest"), effectAllowed: "", dropEffect: "" };
    fireEvent.dragStart(pinterest, { dataTransfer });
    fireEvent.dragOver(whatsapp, { dataTransfer });
    fireEvent.drop(whatsapp, { dataTransfer });
    fireEvent.dragEnd(pinterest, { dataTransfer });
    expect(storedState().apps[0].id).toBe("pinterest");
    expect(cards()[0]).toHaveAccessibleName("فتح بينتريست");
  });

  it("التنقل السفلي يبدل الأقسام دون كسر", () => {
    renderApp();
    fireEvent.click(bottomNav().getByRole("button", { name: "مواقعي" }));
    expect(screen.getByRole("heading", { name: /مواقعي واختصاراتي/ })).toBeInTheDocument();
    fireEvent.click(bottomNav().getByRole("button", { name: "الإدارة" }));
    expect(screen.getByRole("heading", { name: /إدارة التطبيقات/ })).toBeInTheDocument();
    fireEvent.click(bottomNav().getByRole("button", { name: "الإعدادات" }));
    expect(screen.getByRole("heading", { name: /^الإعدادات/ })).toBeInTheDocument();
    fireEvent.click(bottomNav().getByRole("button", { name: "الرئيسية" }));
    expect(cards()).toHaveLength(15);
  });
});