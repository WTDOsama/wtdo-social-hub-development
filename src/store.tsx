/** مخزن الحالة المركزي — حفظ محلي فوري لكل التغييرات */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { AppDraft, HubApp, HubSettings, HubState, ToastItem, ToastTone } from "./types";
import { ACCENTS, DEFAULT_SETTINGS, makeDefaultApps } from "./data/apps";
import {
  downloadBackup,
  moveById,
  nudgeById,
  stateFromRaw,
  uid,
  validateUrl,
} from "./lib/utils";

export const STORAGE_KEY = "wtdo-social-hub:v1";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface HubContextValue {
  state: HubState;
  toasts: ToastItem[];
  online: boolean;
  installReady: boolean;
  addApp: (draft: AppDraft) => HubApp;
  updateApp: (id: string, patch: Partial<AppDraft>) => void;
  deleteApp: (id: string) => void;
  toggleFavorite: (id: string) => void;
  toggleHidden: (id: string) => void;
  moveApp: (dragId: string, targetId: string) => void;
  nudgeApp: (id: string, dir: -1 | 1) => void;
  updateSettings: (patch: Partial<HubSettings>) => void;
  resetSettings: () => void;
  restoreDefaults: () => void;
  importBackup: (data: { apps: HubApp[]; settings: HubSettings }) => void;
  exportBackup: () => void;
  registerLaunch: (id: string) => void;
  notify: (message: string, tone?: ToastTone) => void;
  dismissToast: (id: number) => void;
  promptInstall: () => Promise<void>;
}

const HubContext = createContext<HubContextValue | null>(null);

function loadInitialState(): HubState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { version: 1, apps: makeDefaultApps(), settings: { ...DEFAULT_SETTINGS }, recentIds: [] };
    return stateFromRaw(JSON.parse(raw));
  } catch {
    return { version: 1, apps: makeDefaultApps(), settings: { ...DEFAULT_SETTINGS }, recentIds: [] };
  }
}

let toastSeq = 1;

export function HubProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<HubState>(loadInitialState);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [online, setOnline] = useState<boolean>(typeof navigator === "undefined" ? true : navigator.onLine);
  const [installReady, setInstallReady] = useState(false);
  const installEventRef = useRef<BeforeInstallPromptEvent | null>(null);
  const quotaWarnedRef = useRef(false);

  /* حفظ محلي فوري */
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      if (!quotaWarnedRef.current) {
        quotaWarnedRef.current = true;
        setToasts((prev) => [
          ...prev,
          { id: toastSeq++, message: "تعذر الحفظ محليًا — مساحة التخزين ممتلئة", tone: "error" },
        ]);
      }
    }
  }, [state]);

  /* لون التمييز المختار */
  useEffect(() => {
    const accent = ACCENTS[state.settings.accent] ?? ACCENTS.teal;
    document.documentElement.style.setProperty("--hub-accent", accent.accent);
    document.documentElement.style.setProperty("--hub-accent-deep", accent.deep);
  }, [state.settings.accent]);

  /* حالة الاتصال */
  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  /* دعم تثبيت PWA */
  useEffect(() => {
    const onPrompt = (event: Event) => {
      event.preventDefault();
      installEventRef.current = event as BeforeInstallPromptEvent;
      setInstallReady(true);
    };
    const onInstalled = () => {
      installEventRef.current = null;
      setInstallReady(false);
      setToasts((prev) => [...prev, { id: toastSeq++, message: "تم تثبيت WTDO Social Hub بنجاح 🎉", tone: "success" }]);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const notify = useCallback((message: string, tone: ToastTone = "success") => {
    const id = toastSeq++;
    setToasts((prev) => [...prev.slice(-3), { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3800);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addApp = useCallback((draft: AppDraft): HubApp => {
    const check = validateUrl(draft.url);
    const app: HubApp = {
      id: uid(),
      name: draft.name.trim().slice(0, 80),
      url: check.ok ? check.url : draft.url,
      description: draft.description.trim() ? draft.description.trim().slice(0, 160) : undefined,
      category: draft.category,
      icon: draft.icon,
      favorite: draft.favorite,
      hidden: draft.hidden,
      androidPackage: draft.androidPackage,
      createdAt: Date.now(),
    };
    setState((prev) => ({ ...prev, apps: [...prev.apps, app] }));
    return app;
  }, []);

  const updateApp = useCallback((id: string, patch: Partial<AppDraft>) => {
    setState((prev) => ({
      ...prev,
      apps: prev.apps.map((app) => {
        if (app.id !== id) return app;
        const next = { ...app, ...patch } as HubApp;
        if (patch.name !== undefined) next.name = patch.name.trim().slice(0, 80);
        if (patch.url !== undefined) {
          const check = validateUrl(patch.url);
          next.url = check.ok ? check.url : app.url;
        }
        if (patch.description !== undefined) {
          next.description = patch.description.trim() ? patch.description.trim().slice(0, 160) : undefined;
        }
        return next;
      }),
    }));
  }, []);

  const deleteApp = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      apps: prev.apps.filter((app) => app.id !== id),
      recentIds: prev.recentIds.filter((recent) => recent !== id),
    }));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      apps: prev.apps.map((app) => (app.id === id ? { ...app, favorite: !app.favorite } : app)),
    }));
  }, []);

  const toggleHidden = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      apps: prev.apps.map((app) => (app.id === id ? { ...app, hidden: !app.hidden } : app)),
    }));
  }, []);

  const moveApp = useCallback((dragId: string, targetId: string) => {
    setState((prev) => ({ ...prev, apps: moveById(prev.apps, dragId, targetId) }));
  }, []);

  const nudgeApp = useCallback((id: string, dir: -1 | 1) => {
    setState((prev) => ({ ...prev, apps: nudgeById(prev.apps, id, dir) }));
  }, []);

  const updateSettings = useCallback((patch: Partial<HubSettings>) => {
    setState((prev) => ({ ...prev, settings: { ...prev.settings, ...patch } }));
  }, []);

  const resetSettings = useCallback(() => {
    setState((prev) => ({ ...prev, settings: { ...DEFAULT_SETTINGS } }));
  }, []);

  const restoreDefaults = useCallback(() => {
    setState((prev) => ({ ...prev, apps: makeDefaultApps(), recentIds: [] }));
  }, []);

  const importBackup = useCallback((data: { apps: HubApp[]; settings: HubSettings }) => {
    setState({ version: 1, apps: data.apps, settings: data.settings, recentIds: [] });
  }, []);

  const exportBackup = useCallback(() => {
    try {
      downloadBackup(state);
      notify("تم تنزيل النسخة الاحتياطية بصيغة JSON");
    } catch {
      notify("تعذر إنشاء النسخة الاحتياطية", "error");
    }
  }, [state, notify]);

  const registerLaunch = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      recentIds: [id, ...prev.recentIds.filter((recent) => recent !== id)].slice(0, 8),
    }));
  }, []);

  const promptInstall = useCallback(async () => {
    const event = installEventRef.current;
    if (!event) return;
    try {
      await event.prompt();
      const choice = await event.userChoice;
      if (choice.outcome === "accepted") notify("جارٍ تثبيت التطبيق…");
    } catch {
      notify("تعذر بدء التثبيت — استخدم قائمة المتصفح", "info");
    }
    installEventRef.current = null;
    setInstallReady(false);
  }, [notify]);

  const value = useMemo<HubContextValue>(
    () => ({
      state,
      toasts,
      online,
      installReady,
      addApp,
      updateApp,
      deleteApp,
      toggleFavorite,
      toggleHidden,
      moveApp,
      nudgeApp,
      updateSettings,
      resetSettings,
      restoreDefaults,
      importBackup,
      exportBackup,
      registerLaunch,
      notify,
      dismissToast,
      promptInstall,
    }),
    [state, toasts, online, installReady, addApp, updateApp, deleteApp, toggleFavorite, toggleHidden, moveApp, nudgeApp, updateSettings, resetSettings, restoreDefaults, importBackup, exportBackup, registerLaunch, notify, dismissToast, promptInstall]
  );

  return <HubContext.Provider value={value}>{children}</HubContext.Provider>;
}

export function useHub(): HubContextValue {
  const ctx = useContext(HubContext);
  if (!ctx) throw new Error("useHub يجب استخدامه داخل HubProvider");
  return ctx;
}