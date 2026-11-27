import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";

// Démonte les composants rendus entre deux tests d'interface.
afterEach(async () => {
  if (typeof document === "undefined") return;
  const { cleanup } = await import("@testing-library/react");
  cleanup();
});
