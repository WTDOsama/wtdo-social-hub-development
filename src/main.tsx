import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

/* تسجيل Service Worker لدعم PWA والعمل دون اتصال (في نسخة الإنتاج فقط) */
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* بيئات لا تدعم SW — التطبيق يعمل بشكل طبيعي بدونها */
    });
  });
}