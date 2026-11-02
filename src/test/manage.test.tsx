import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, within } from "@testing-library/react";
import App from "../App";
import { STORAGE_KEY } from "../store";

const renderApp = () => render(<App />);
const bottomNav = () => within(screen.getByRole("navigation", { name: "التنقل السفلي" }));
const storedState = () => JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
const goManage = () => fireEvent.click(bottomNav().getByRole("button", { name: "الإدارة" }));

function fillForm({ name, url, category }: { name: string; url: string; category?: string }) {
  fireEvent.change(screen.getByLabelText(/اسم التطبيق/), { target: { value: name } });
  fireEvent.change(screen.getByLabelText(/الرابط/), { target: { value: url } });
  if (category) fireEvent.change(screen.getByLabelText(/التصنيف/), { target: { value: category } });
}

describe("إدارة التطبيقات — إضافة/تحرير/حذف/إخفاء/ترتيب", () => {
  it("إضافة تطبيق جديد باسم ورابط وتصنيف، مع حفظ فوري وظهور في اللوحة", () => {
    renderApp();
    goManage();
    fireEvent.click(screen.getByRole("button", { name: /تطبيق جديد/ }));
    expect(screen.getByRole("dialog", { name: "إضافة تطبيق جديد" })).toBeInTheDocument();

    fillForm({ name: "ديسكورد", url: "discord.com", category: "messaging" });
    fireEvent.click(screen.getByRole("button", { name: "إضافة التطبيق" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByText("تمت إضافة «ديسكورد» بنجاح")).toBeInTheDocument();
    const stored = storedState();
    expect(stored.apps).toHaveLength(16);
    const added = stored.apps.find((a: { name: string }) => a.name === "ديسكورد");
    expect(added.url).toBe("https://discord.com/"); // أُضيف https تلقائيًا
    expect(added.category).toBe("messaging");

    fireEvent.click(bottomNav().getByRole("button", { name: "الرئيسية" }));
    expect(within(screen.getByTestId("apps-grid")).getByRole("button", { name: "فتح ديسكورد" })).toBeInTheDocument();
  });

  it("يرفض الروابط الخطرة والاسم الفارغ ولا يحفظ شيئًا", () => {
    renderApp();
    goManage();
    fireEvent.click(screen.getByRole("button", { name: /تطبيق جديد/ }));

    fillForm({ name: "اختبار", url: "javascript:alert(1)" });
    fireEvent.click(screen.getByRole("button", { name: "إضافة التطبيق" }));
    expect(screen.getByRole("alert")).toHaveTextContent("يُقبل فقط روابط http أو https");
    expect(screen.getByRole("dialog")).toBeInTheDocument();

    fillForm({ name: "", url: "ftp://files.com" });
    fireEvent.click(screen.getByRole("button", { name: "إضافة التطبيق" }));
    expect(screen.getByText("أدخل اسم التطبيق")).toBeInTheDocument();

    expect(storedState().apps).toHaveLength(15); // لم يُحفظ شيء
  });

  it("تحرير اسم تطبيق قائم ينعكس في اللوحة والتخزين", () => {
    renderApp();
    goManage();
    fireEvent.click(screen.getByRole("button", { name: "تحرير واتساب" }));
    const nameInput = screen.getByLabelText(/اسم التطبيق/) as HTMLInputElement;
    expect(nameInput.value).toBe("واتساب");
    fireEvent.change(nameInput, { target: { value: "واتساب بلس" } });
    fireEvent.click(screen.getByRole("button", { name: "حفظ التعديلات" }));

    expect(screen.getByText("واتساب بلس")).toBeInTheDocument();
    expect(storedState().apps.find((a: { id: string }) => a.id === "whatsapp").name).toBe("واتساب بلس");

    fireEvent.click(bottomNav().getByRole("button", { name: "الرئيسية" }));
    expect(within(screen.getByTestId("apps-grid")).getByRole("button", { name: "فتح واتساب بلس" })).toBeInTheDocument();
  });

  it("الحذف يطلب تأكيدًا ثم يزيل التطبيق نهائيًا", () => {
    renderApp();
    goManage();
    fireEvent.click(screen.getByRole("button", { name: "حذف تيك توك" }));
    expect(screen.getByRole("dialog", { name: "حذف التطبيق" })).toBeInTheDocument();

    // الإلغاء لا يحذف
    fireEvent.click(screen.getByRole("button", { name: "إلغاء" }));
    expect(storedState().apps).toHaveLength(15);

    fireEvent.click(screen.getByRole("button", { name: "حذف تيك توك" }));
    fireEvent.click(screen.getByRole("button", { name: "حذف نهائي" }));
    expect(storedState().apps).toHaveLength(14);
    expect(screen.queryByText("تيك توك")).not.toBeInTheDocument();
  });

  it("الإخفاء يزيل التطبيق من اللوحة مع بقائه في الإدارة", () => {
    renderApp();
    goManage();
    fireEvent.click(screen.getByRole("button", { name: "إخفاء يوتيوب" }));
    expect(screen.getByText("مخفي")).toBeInTheDocument();
    expect(storedState().apps.find((a: { id: string }) => a.id === "youtube").hidden).toBe(true);

    fireEvent.click(bottomNav().getByRole("button", { name: "الرئيسية" }));
    const grid = within(screen.getByTestId("apps-grid"));
    expect(grid.queryByRole("button", { name: "فتح يوتيوب" })).not.toBeInTheDocument();
    expect(grid.getByRole("button", { name: "فتح يوتيوب ستوديو" })).toBeInTheDocument();
  });

  it("أسهم الترتيب تغيّر المواضع وتُحفظ", () => {
    renderApp();
    goManage();
    fireEvent.click(screen.getByRole("button", { name: "تحريك واتساب لأسفل" }));
    const ids = storedState().apps.map((a: { id: string }) => a.id);
    expect(ids[0]).toBe("whatsapp-business");
    expect(ids[1]).toBe("whatsapp");
  });
});

describe("مواقعي واختصاراتي", () => {
  it("اقتراح جاهز يعبئ النموذج ثم يُحفظ ويظهر في القسم", () => {
    renderApp();
    fireEvent.click(bottomNav().getByRole("button", { name: "مواقعي" }));
    expect(screen.getByText("أضف موقعك الأول")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /GitHub/ }));
    const nameInput = screen.getByLabelText(/اسم التطبيق/) as HTMLInputElement;
    expect(nameInput.value).toBe("GitHub");
    expect((screen.getByLabelText(/الرابط/) as HTMLInputElement).value).toBe("https://github.com/");
    fireEvent.click(screen.getByRole("button", { name: "إضافة التطبيق" }));

    expect(within(screen.getByTestId("sites-grid")).getByRole("button", { name: "فتح GitHub" })).toBeInTheDocument();
    expect(storedState().apps).toHaveLength(16);
    // شارة الاقتراح نفسها اختفت بعد الإضافة (البطاقة اسمها «فتح GitHub»)
    expect(screen.queryByRole("button", { name: "GitHub" })).not.toBeInTheDocument();
  });

  it("إضافة موقع مخصص يدويًا بتصنيف مواقع افتراضيًا", () => {
    renderApp();
    fireEvent.click(bottomNav().getByRole("button", { name: "مواقعي" }));
    fireEvent.click(screen.getAllByRole("button", { name: /إضافة موقع/ })[0]);
    expect((screen.getByLabelText(/التصنيف/) as HTMLSelectElement).value).toBe("websites");
    fillForm({ name: "لوحة التحكم", url: "https://admin.example.com" });
    fireEvent.click(screen.getByRole("button", { name: "إضافة التطبيق" }));
    expect(within(screen.getByTestId("sites-grid")).getByRole("button", { name: "فتح لوحة التحكم" })).toBeInTheDocument();
    expect(storedState().apps.find((a: { name: string }) => a.name === "لوحة التحكم").category).toBe("websites");
  });

  it("إطلاق موقع مخصص يفتح رابطه الرسمي في تبويب آمن", () => {
    const openSpy = vi.spyOn(window, "open").mockReturnValue({} as Window);
    renderApp();
    fireEvent.click(bottomNav().getByRole("button", { name: "مواقعي" }));
    fireEvent.click(screen.getAllByRole("button", { name: /إضافة موقع/ })[0]);
    fillForm({ name: "لوحة التحكم", url: "https://admin.example.com" });
    fireEvent.click(screen.getByRole("button", { name: "إضافة التطبيق" }));
    fireEvent.click(within(screen.getByTestId("sites-grid")).getByRole("button", { name: "فتح لوحة التحكم" }));
    expect(openSpy).toHaveBeenCalledWith("https://admin.example.com/", "_blank");
  });
});