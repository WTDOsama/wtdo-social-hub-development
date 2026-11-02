import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

afterEach(async () => {
  if (typeof window !== "undefined") {
    const { cleanup } = await import("@testing-library/react");
    cleanup();
    localStorage.clear();
  }
  vi.restoreAllMocks();
});

if (typeof window !== "undefined") {
  Object.defineProperty(window, "scrollTo", { value: () => {}, writable: true, configurable: true });
}