// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, test, vi } from "vitest";
import { authClient } from "@/lib/auth/client";
import { reloadTo } from "@/lib/browser";
import { ThemeProvider } from "@/providers/theme-provider";

beforeAll(() => {
  // jsdom n'implémente pas `matchMedia`, utilisé par le thème « système ».
  vi.stubGlobal("matchMedia", () => ({
    matches: false,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
});

describe("fournisseur de thème", () => {
  test("applique le thème sombre par défaut", () => {
    render(<ThemeProvider>contenu</ThemeProvider>);

    expect(screen.getByText("contenu")).toBeInTheDocument();
    expect(document.documentElement).toHaveClass("dark");
  });
});

describe("client d'authentification", () => {
  test("expose la connexion OAuth et les passkeys", () => {
    expect(authClient.signIn.passkey).toBeTypeOf("function");
    expect(authClient.signIn.social).toBeTypeOf("function");
    expect(authClient.passkey.addPasskey).toBeTypeOf("function");
  });
});

describe("rechargement complet", () => {
  test("demande la navigation au navigateur sans lever d'erreur", () => {
    // jsdom ne navigue pas vers une ancre différente de page : il le signale seulement.
    expect(() => reloadTo("#ancre")).not.toThrow();
    expect(window.location.hash).toBe("#ancre");
  });
});
