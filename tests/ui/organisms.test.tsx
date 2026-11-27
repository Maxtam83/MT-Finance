// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, test, vi } from "vitest";
import { AccessManagementCard } from "@/components/organisms/access-management-card";
import { AccountCard } from "@/components/organisms/account-card";
import { AccountsSection } from "@/components/organisms/accounts-section";
import { AppSidebar } from "@/components/organisms/app-sidebar";
import { BottomNav } from "@/components/organisms/bottom-nav";
import { LoginCard } from "@/components/organisms/login-card";
import { MobileHeader } from "@/components/organisms/mobile-header";
import { PasskeyCard } from "@/components/organisms/passkey-card";
import { ReceivedRequestsSection } from "@/components/organisms/received-requests-section";
import { SessionCard } from "@/components/organisms/session-card";
import { ShareAccountForm } from "@/components/organisms/share-account-form";
import { SignInPanel } from "@/components/organisms/sign-in-panel";
import { SplashScreen } from "@/components/organisms/splash-screen";
import type { AccountSummary, ReceivedRequest } from "@/lib/joint-accounts/queries";

const mocks = vi.hoisted(() => ({
  reloadTo: vi.fn(),
  social: vi.fn(),
  passkey: vi.fn(),
  addAllowedEmail: vi.fn(),
  requestJointAccount: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => "/comptes",
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("next-themes", () => ({ useTheme: () => ({ resolvedTheme: "dark", setTheme: vi.fn() }) }));
vi.mock("@/lib/browser", () => ({ reloadTo: mocks.reloadTo }));
vi.mock("@/lib/auth/client", () => ({
  authClient: { signIn: { social: mocks.social, passkey: mocks.passkey } },
}));
vi.mock("@/actions/admin", () => ({
  addAllowedEmail: mocks.addAllowedEmail,
  removeAllowedEmail: vi.fn(),
}));
vi.mock("@/actions/joint-accounts", () => ({
  requestJointAccount: mocks.requestJointAccount,
  acceptJointAccountRequest: vi.fn(),
  declineJointAccountRequest: vi.fn(),
  cancelJointAccountRequest: vi.fn(),
  leaveSharedAccount: vi.fn(),
  stopAccountSharing: vi.fn(),
}));
// La lecture en base n'est pas nécessaire : seuls les types sont utilisés ici.
vi.mock("@/lib/joint-accounts/queries", () => ({}));

const account: AccountSummary = {
  id: "c1",
  name: "Compte courant commun",
  type: "CHECKING",
  isOwner: true,
  joint: null,
  pendingRequest: null,
};

const request: ReceivedRequest = {
  id: "r1",
  requesterEmail: "alice@x.fr",
  accountName: "Compte partagé",
  accountType: "SAVINGS",
  tagOwner: "INVITEE",
  expiresAt: new Date("2026-12-04T12:00:00Z"),
};

/** Champs reçus par une action simulée. */
const sentFields = (action: ReturnType<typeof vi.fn>) =>
  Object.fromEntries((action.mock.calls[0]?.[1] as FormData).entries());

beforeEach(() => {
  for (const mock of Object.values(mocks)) mock.mockReset();
});

describe("liste blanche", () => {
  /** Saisit une adresse et envoie le formulaire. */
  const submitEmail = async () => {
    const user = userEvent.setup();
    render(<AccessManagementCard users={[{ allowedEmailId: null, email: "a@x.fr", isRegistered: true }]} />);
    await user.type(screen.getByLabelText("Adresse email à autoriser"), "nouveau@x.fr");
    await user.click(screen.getByRole("button", { name: "Autoriser" }));
  };

  test("vide le champ après un succès", async () => {
    mocks.addAllowedEmail.mockResolvedValue({ status: "success", message: "Ajouté." });

    await submitEmail();

    expect(await screen.findByText("Ajouté.")).toBeInTheDocument();
    expect(sentFields(mocks.addAllowedEmail)).toEqual({ email: "nouveau@x.fr" });
    await waitFor(() => expect(screen.getByLabelText("Adresse email à autoriser")).toHaveValue(""));
  });

  test("garde la saisie après un échec", async () => {
    mocks.addAllowedEmail.mockResolvedValue({ status: "error", message: "Refusé." });

    await submitEmail();

    expect(await screen.findByText("Refusé.")).toBeInTheDocument();
    expect(screen.getByLabelText("Adresse email à autoriser")).toHaveValue("nouveau@x.fr");
  });
});

describe("demande de compte joint", () => {
  test("prévient du détachement des tags avant l'envoi", () => {
    render(<ShareAccountForm accountId="c1" />);

    expect(screen.getByText(/vos tags seront détachés/)).toHaveTextContent("sans retour possible");
  });

  /** Remplit puis envoie la demande, avec ou sans accord. */
  const submit = async ({ consent }: { consent: boolean }) => {
    mocks.requestJointAccount.mockResolvedValue({ status: "success", message: "Envoyée." });
    const user = userEvent.setup();
    render(<ShareAccountForm accountId="c1" />);
    await user.type(screen.getByLabelText("Adresse email de l'autre personne"), "b@x.fr");
    if (consent) await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Envoyer la demande" }));
    await screen.findByText("Envoyée.");
  };

  test("transmet le compte, l'adresse, le référent et l'accord", async () => {
    await submit({ consent: true });

    expect(sentFields(mocks.requestJointAccount)).toEqual({
      accountId: "c1",
      inviteeEmail: "b@x.fr",
      tagOwner: "REQUESTER",
      consent: "on",
    });
  });

  test("ne transmet aucun accord si la case n'est pas cochée", async () => {
    await submit({ consent: false });

    expect(sentFields(mocks.requestJointAccount)).not.toHaveProperty("consent");
  });
});

describe("cartes de compte", () => {
  test("propose le partage au propriétaire d'un compte personnel", () => {
    render(<AccountCard account={account} />);

    expect(screen.getByText("Transformer en compte joint")).toBeInTheDocument();
  });

  test("ne propose rien à qui n'est pas propriétaire", () => {
    render(<AccountCard account={{ ...account, isOwner: false }} />);

    expect(screen.queryByText("Transformer en compte joint")).not.toBeInTheDocument();
  });

  test("montre une demande en attente et permet de l'annuler", () => {
    render(
      <AccountCard
        account={{
          ...account,
          pendingRequest: { id: "r1", inviteeEmail: "b@x.fr", expiresAt: request.expiresAt },
        }}
      />,
    );

    expect(screen.getByText(/Demande envoyée à b@x.fr/)).toHaveTextContent("4 décembre 2026");
    expect(screen.getByRole("button", { name: "Annuler la demande" })).toBeInTheDocument();
    expect(screen.queryByText("Transformer en compte joint")).not.toBeInTheDocument();
  });

  test.each([
    [true, "Arrêter le partage"],
    [false, "Quitter le compte joint"],
  ])("permet à chacun de mettre fin au partage (propriétaire : %s)", (isOwner, label) => {
    render(
      <AccountCard
        account={{ ...account, isOwner, joint: { sharedWith: "b@x.fr", tagOwner: "Vous" } }}
      />,
    );

    expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
  });

  test("décrit un compte joint", () => {
    render(<AccountCard account={{ ...account, joint: { sharedWith: "b@x.fr", tagOwner: "Vous" } }} />);

    expect(screen.getByText("Compte joint")).toBeInTheDocument();
    expect(screen.getByText("b@x.fr")).toBeInTheDocument();
  });

  test("liste les comptes ou explique leur absence", () => {
    const { rerender } = render(<AccountsSection accounts={[]} />);
    expect(screen.getByText(/Aucun compte pour le moment/)).toBeInTheDocument();

    rerender(<AccountsSection accounts={[account]} />);
    expect(screen.getByText("Compte courant commun")).toBeInTheDocument();
  });
});

describe("demandes reçues", () => {
  test("n'affiche rien sans demande", () => {
    const { container } = render(<ReceivedRequestsSection requests={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  test.each([
    ["INVITEE" as const, "Vous"],
    ["REQUESTER" as const, "alice@x.fr"],
  ])("montre de quoi décider, référent %s", (tagOwner, expected) => {
    render(<ReceivedRequestsSection requests={[{ ...request, tagOwner }]} />);

    expect(screen.getByText("Compte partagé")).toBeInTheDocument();
    expect(screen.getByText(expected)).toBeInTheDocument();
    expect(screen.getByText(/accéderez à tout l'historique/)).toBeInTheDocument();
    // La personne invitée est prévenue du détachement avant de valider.
    expect(screen.queryByText(/seront détachés, sans retour possible/) !== null).toBe(
      tagOwner === "INVITEE",
    );
    expect(screen.getByRole("button", { name: "Accepter" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Refuser" })).toBeInTheDocument();
  });
});

describe("navigation", () => {
  test.each([true, false])("affiche l'administration selon le rôle (%s)", (isAdmin) => {
    render(
      <>
        <AppSidebar isAdmin={isAdmin} email="a@x.fr" pendingRequestCount={0} />
        <BottomNav isAdmin={isAdmin} pendingRequestCount={0} />
        <MobileHeader />
      </>,
    );

    expect(screen.queryAllByRole("link", { name: "Administration" })).toHaveLength(isAdmin ? 2 : 0);
    for (const link of screen.getAllByRole("link", { name: "Comptes" })) {
      expect(link).toHaveAttribute("aria-current", "page");
    }
  });
});

describe("demandes en attente dans la navigation", () => {
  test("sont signalées sur « Comptes » seulement, sur ordinateur et sur mobile", () => {
    render(
      <>
        <AppSidebar isAdmin={false} email="a@x.fr" pendingRequestCount={2} />
        <BottomNav isAdmin={false} pendingRequestCount={2} />
      </>,
    );

    expect(
      screen.getAllByRole("link", { name: "Comptes, 2 demandes en attente" }),
    ).toHaveLength(2);
    expect(screen.getAllByText("2")).toHaveLength(2);
    expect(screen.getAllByRole("link", { name: "Import" })).toHaveLength(2);
  });
});

describe("animation d'ouverture", () => {
  test("montre le logo sans le faire lire par les lecteurs d'écran", () => {
    const { container } = render(<SplashScreen />);

    const splash = container.querySelector("[data-slot='splash-screen']");
    expect(splash).toHaveClass("splash");
    expect(splash).toHaveAttribute("aria-hidden", "true");
    expect(splash?.querySelector("[data-slot='animated-brand-mark']")).not.toBeNull();
    expect(splash?.querySelector(".splash-wordmark")).toHaveTextContent("Finance");
  });
});

describe("cartes d'accueil", () => {
  test.each(["ADMIN" as const, "USER" as const])("rappelle le rôle %s", (role) => {
    render(<SessionCard email="a@x.fr" role={role} />);

    expect(screen.getByText(role)).toBeInTheDocument();
    expect(screen.getByText("a@x.fr")).toBeInTheDocument();
  });

  test.each([
    [0, /Aucune passkey enregistrée/],
    [2, "Passkeys enregistrées : 2."],
  ])("compte %i passkey(s)", (count, expected) => {
    render(<PasskeyCard passkeyCount={count} />);

    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});

describe("connexion", () => {
  /** Affiche le panneau et clique sur le bouton demandé. */
  const click = async (name: string) => {
    render(<SignInPanel providers={["github", "google"]} initialError={null} />);
    await userEvent.setup().click(screen.getByRole("button", { name }));
  };

  test("affiche le motif d'un refus et les fournisseurs configurés", () => {
    render(<LoginCard providers={["github"]} initialError="Accès refusé." />);

    expect(screen.getByRole("alert")).toHaveTextContent("Accès refusé.");
    expect(screen.queryByRole("button", { name: "Continuer avec Google" })).not.toBeInTheDocument();
  });

  test("redirige vers le fournisseur avec un retour d'erreur sur /login", async () => {
    mocks.social.mockResolvedValue({ error: null });

    await click("Continuer avec GitHub");

    expect(mocks.social).toHaveBeenCalledWith({
      provider: "github",
      callbackURL: "/",
      errorCallbackURL: "/login",
    });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  test("signale l'échec du fournisseur", async () => {
    mocks.social.mockResolvedValue({ error: { code: "access_denied" } });

    await click("Continuer avec Google");

    expect(screen.getByRole("alert")).toHaveTextContent("La connexion a été annulée.");
  });

  test.each([[{ data: {}, error: null }], [undefined]])(
    "recharge l'accueil après une passkey acceptée (%o)",
    async (result) => {
      mocks.passkey.mockResolvedValue(result);

      await click("Se connecter avec une passkey");

      expect(mocks.reloadTo).toHaveBeenCalledWith("/");
    },
  );

  test.each([
    [{ code: "EMAIL_NOT_ALLOWED" }, /liste blanche/],
    [{ message: "sans code" }, /La connexion a échoué/],
  ])("explique le refus d'une passkey %o", async (error, expected) => {
    mocks.passkey.mockResolvedValue({ data: null, error });

    await click("Se connecter avec une passkey");

    expect(screen.getByRole("alert")).toHaveTextContent(expected);
    expect(mocks.reloadTo).not.toHaveBeenCalled();
  });
});
