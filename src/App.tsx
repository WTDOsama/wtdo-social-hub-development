import { useCallback, useState } from "react";
import type { ViewId } from "./types";
import { HubProvider, useHub } from "./store";
import { BottomNav, Footer, MobileTopBar, OfflineBanner, Sidebar } from "./components/layout";
import { Toasts } from "./components/ui";
import { Dashboard } from "./views/Dashboard";
import { Manage } from "./views/Manage";
import { Sites } from "./views/Sites";
import { Settings } from "./views/Settings";

function Shell() {
  const [view, setView] = useState<ViewId>("dashboard");
  const { online } = useHub();

  const navigate = useCallback((next: ViewId) => {
    setView(next);
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="flex min-h-dvh">
      <div className="ambient" aria-hidden />
      <Sidebar view={view} onNavigate={navigate} />
      <main className="mx-auto w-full min-w-0 max-w-[1500px] flex-1 px-4 pb-28 pt-5 sm:px-6 lg:px-10 lg:pb-10 lg:pt-8">
        <MobileTopBar onNavigate={navigate} />
        {!online && <OfflineBanner />}
        {view === "dashboard" && <Dashboard onNavigate={navigate} />}
        {view === "sites" && <Sites onNavigate={navigate} />}
        {view === "manage" && <Manage />}
        {view === "settings" && <Settings />}
        <Footer />
      </main>
      <BottomNav view={view} onNavigate={navigate} />
      <Toasts />
    </div>
  );
}

export default function App() {
  return (
    <HubProvider>
      <Shell />
    </HubProvider>
  );
}