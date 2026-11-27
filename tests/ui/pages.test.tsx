// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { isValidElement } from "react";
import type { ReactElement, ReactNode } from "react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import AdminPage from "@/app/(app)/admin/page";
import AccountsPage from "@/app/(app)/comptes/page";
import ImportPage from "@/app/(app)/import/page";
import InvestmentsPage from "@/app/(app)/investissements/page";
import AppLayout from "@/app/(app)/layout";
import DashboardPage from "@/app/(app)/page";
import RulesPage from "@/app/(app)/regles/page";
import LoginPage from "@/app/(auth)/login/page";
import RootLayout, { viewport } from "@/app/layout";
import { AppShell } from "@/components/templates/app-shell";
import { AuthTemplate } from "@/components/templates/auth-template";
import { PageTemplate } from "@/components/templates/page-template";
import { setTestEnv } from "../helpers/env";
import { RedirectSignal } from "../helpers/next";

const mocks = vi.hoisted(() => ({
  requireAuth: vi.fn(),
  requireAdmin: vi.fn(),
  getAuthSession: vi.fn(),
  listAccountSummaries: vi.fn(),
  listReceivedRequests: vi.fn(),
  countReceivedRequests: vi.fn(),
  passkeyCount: vi.fn(),
  allowedEmails: vi.fn(),
  users: vi.fn(),
  nonce: { current: null as string | null },
}));

vi.mock("next/font/google", () => ({ Inter: () => ({ variable: "police-inter" }) }));
vi.mock("next/headers", () => ({
  headers: async () => new Headers(mocks.nonce.current ? { "x-nonce": mocks.nonce.current } : {}),
}));
vi.mock("next/navigation", async () => {
  // Import différé : `vi.mock` est exécuté avant les imports du fichier.
  const helpers = await import("../helpers/next");
  return {
    ...helpers.nextNavigationMock,
    usePathname: () => "/",
    useRouter: () => ({ refresh: vi.fn() }),
  };
});
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: "dark", setTheme: vi.fn() }),
  ThemeProvider: ({ children }: { children: ReactNode }) => children,
}));
vi.mock("@/lib/auth/client", () => ({ authClient: {} }));
vi.mock("@/lib/auth/guards", () => ({
  requireAuth: mocks.requireAuth,
  requireAdmin: mocks.requireAdmin,
  getAuthSession: mocks.getAuthSession,
}));
vi.mock("@/lib/joint-accounts/queries", () => ({
  listAccountSummaries: mocks.listAccountSummaries,
  listReceivedRequests: mocks.listReceivedRequests,
  countReceivedRequests: mocks.countReceivedRequests,
}));
vi.mock("@/lib/prisma", () => ({
  prisma: {
    passkey: { count: mocks.passkeyCount },
    allowedEmail: { findMany: mocks.allowedEmails },
    user: { findMany: mocks.users },
  },
}));
vi.mock("@/actions/admin", () => ({ addAllowedEmail: vi.fn(), removeAllowedEmail: vi.fn() }));
vi.mock("@/actions/joint-accounts", () => ({}));

const session = { user: { id: "u1", email: "a@x.fr", name: null, role: "USER" as const } };

beforeEach(() => {
  setTestEnv();
  for (const mock of Object.values(mocks)) {
    if (typeof mock === "function") mock.mockReset();
  }
  mocks.nonce.current = null;
  mocks.requireAuth.mockResolvedValue(session);
  mocks.requireAdmin.mockResolvedValue(session);
  mocks.getAuthSession.mockResolvedValue(null);
  mocks.listAccountSummaries.mockResolvedValue([]);
  mocks.listReceivedRequests.mockResolvedValue([]);
  mocks.countReceivedRequests.mockResolvedValue(0);
  mocks.passkeyCount.mockResolvedValue(0);
  mocks.allowedEmails.mockResolvedValue([{ id: "w1", email: "b@x.fr" }]);
  mocks.users.mockResolvedValue([{ email: "admin@mt-finance.test" }]);
});

describe("gabarits", () => {
  test("structurent les pages protégées, publiques et leur en-tête", () => {
    render(
      <>
        <AppShell isAdmin={false} email="a@x.fr" pendingRequestCount={0}>
          <PageTemplate title="Titre" description="Intro">
            contenu
          </PageTemplate>
        </AppShell>
        <AuthTemplate>formulaire</AuthTemplate>
      </>,
    );

    expect(screen.getByRole("heading", { name: "Titre" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "MT Finance" })).toBeInTheDocument();
    expect(screen.getByText("formulaire")).toBeInTheDocument();
  });
});

describe("pages protégées", () => {
  test.each([
    ["Comptes", AccountsPage],
    ["Règles & Tags", RulesPage],
    ["Import", ImportPage],
    ["Investissements", InvestmentsPage],
    ["Dashboard", DashboardPage],
  ])("« %s » exige une session avant de s'afficher", async (title, Page) => {
    render(await Page());

    expect(mocks.requireAuth).toHaveBeenCalled();
    expect(screen.getByRole("heading", { level: 1, name: title })).toBeInTheDocument();
  });

  test.each([AccountsPage, RulesPage, ImportPage, InvestmentsPage, DashboardPage, AppLayout])(
    "n'affichent rien quand la session est refusée",
    async (Page) => {
      mocks.requireAuth.mockRejectedValue(new RedirectSignal("/login"));

      await expect(Page({ children: null })).rejects.toBeInstanceOf(RedirectSignal);
      expect(mocks.listAccountSummaries).not.toHaveBeenCalled();
    },
  );

  test("signale dans la navigation les demandes de la personne connectée", async () => {
    mocks.countReceivedRequests.mockResolvedValue(3);

    render(await AppLayout({ children: "contenu" }));

    expect(mocks.countReceivedRequests).toHaveBeenCalledWith("a@x.fr");
    expect(
      screen.getAllByRole("link", { name: "Comptes, 3 demandes en attente" }),
    ).toHaveLength(2);
  });

  test("lit les comptes et demandes de la seule personne connectée", async () => {
    await AccountsPage();

    expect(mocks.listReceivedRequests).toHaveBeenCalledWith("a@x.fr");
    expect(mocks.listAccountSummaries).toHaveBeenCalledWith("u1");
  });

  test("signale sur l'accueil les demandes en attente", async () => {
    mocks.countReceivedRequests.mockResolvedValue(1);

    render(await DashboardPage());

    expect(screen.getByRole("alert")).toHaveTextContent("attend votre validation");
    expect(mocks.passkeyCount).toHaveBeenCalledWith({ where: { userId: "u1" } });
  });

  test.each([
    ["ADMIN" as const, 2],
    ["USER" as const, 0],
  ])("adapte la navigation au rôle %s", async (role, adminLinks) => {
    mocks.requireAuth.mockResolvedValue({ user: { ...session.user, role } });

    render(await AppLayout({ children: "contenu" }));

    expect(screen.queryAllByRole("link", { name: "Administration" })).toHaveLength(adminLinks);
  });
});

describe("administration", () => {
  test("liste l'administrateur puis les adresses, avec leur état", async () => {
    render(await AdminPage());

    const rows = screen.getAllByRole("listitem").map((row) => row.textContent);
    expect(rows).toEqual([
      expect.stringContaining("admin@mt-finance.testAdministrateurInscrit"),
      expect.stringContaining("b@x.frEn attente"),
    ]);
  });

  test("ne propose plus aucune liaison de compte", async () => {
    render(await AdminPage());

    expect(screen.queryByText(/compte joint/i)).not.toBeInTheDocument();
  });

  test("ne lit rien si la personne n'est pas administratrice", async () => {
    mocks.requireAdmin.mockRejectedValue(new RedirectSignal("/"));

    await expect(AdminPage()).rejects.toEqual(new RedirectSignal("/"));
    expect(mocks.allowedEmails).not.toHaveBeenCalled();
  });
});

describe("page de connexion", () => {
  /** Affiche la page avec les paramètres d'URL donnés. */
  const renderLogin = async (searchParams: { error?: string | string[] } = {}) =>
    render(await LoginPage({ searchParams: Promise.resolve(searchParams) }));

  test("renvoie à l'accueil une personne déjà connectée", async () => {
    mocks.getAuthSession.mockResolvedValue(session);

    await expect(renderLogin()).rejects.toEqual(new RedirectSignal("/"));
  });

  test.each([["EMAIL_NOT_ALLOWED"], [["EMAIL_NOT_ALLOWED", "autre"]]])(
    "affiche le refus passé dans l'URL (%o)",
    async (error) => {
      await renderLogin({ error });

      expect(screen.getByRole("alert")).toHaveTextContent("liste blanche");
    },
  );

  test("n'affiche aucune erreur par défaut", async () => {
    await renderLogin();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Continuer avec GitHub" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continuer avec Google" })).not.toBeInTheDocument();
  });

  test("ne propose que Google quand lui seul est configuré", async () => {
    vi.resetModules();
    setTestEnv({
      GITHUB_CLIENT_ID: "",
      GITHUB_CLIENT_SECRET: "",
      GOOGLE_CLIENT_ID: "g",
      GOOGLE_CLIENT_SECRET: "s",
    });
    const { default: FreshLoginPage } = await import("@/app/(auth)/login/page");

    render(await FreshLoginPage({ searchParams: Promise.resolve({}) }));

    expect(screen.getByRole("button", { name: "Continuer avec Google" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Continuer avec GitHub" })).not.toBeInTheDocument();
  });
});

describe("mise en page racine", () => {
  test.each([["jeton-de-test"], [null]])(
    "transmet au thème le jeton de la CSP (%s)",
    async (nonce) => {
      mocks.nonce.current = nonce;

      const tree = (await RootLayout({ children: "contenu" })) as ReactElement<{
        children: ReactElement<{ children: ReactElement<{ nonce?: string }> }>;
      }>;

      expect(tree.props.children.props.children.props.nonce).toBe(nonce ?? undefined);
    },
  );

  test("déclare la langue, la police et les couleurs du thème", async () => {
    const tree = await RootLayout({ children: "contenu" });

    expect(isValidElement(tree)).toBe(true);
    const html = tree as ReactElement<{ lang: string; className: string }>;
    expect(html.props).toMatchObject({ lang: "fr", className: "police-inter" });
    expect(viewport.themeColor).toEqual([
      { media: "(prefers-color-scheme: light)", color: "#f5f8fc" },
      { media: "(prefers-color-scheme: dark)", color: "#06090d" },
    ]);
  });
});
