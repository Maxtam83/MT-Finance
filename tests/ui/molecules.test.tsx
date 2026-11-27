// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LayoutDashboard } from "lucide-react";
import { beforeEach, describe, expect, test, vi } from "vitest";
import type { ActionState } from "@/actions/action-state";
import { AddPasskeyButton } from "@/components/molecules/add-passkey-button";
import { AllowedUserRow } from "@/components/molecules/allowed-user-row";
import { BottomNavLink } from "@/components/molecules/bottom-nav-link";
import { Brand } from "@/components/molecules/brand";
import { CancelRequestButton } from "@/components/molecules/cancel-request-button";
import { CardHeading } from "@/components/molecules/card-heading";
import { ConfirmAction } from "@/components/molecules/confirm-action";
import { ConsentCheckbox } from "@/components/molecules/consent-checkbox";
import { EmptyState } from "@/components/molecules/empty-state";
import { EndSharingButton } from "@/components/molecules/end-sharing-button";
import { ErrorAlert } from "@/components/molecules/error-alert";
import { FormField } from "@/components/molecules/form-field";
import { InfoList } from "@/components/molecules/info-list";
import { PageHeader } from "@/components/molecules/page-header";
import { PendingRequestsNotice } from "@/components/molecules/pending-requests-notice";
import { RadioOptionGroup } from "@/components/molecules/radio-option-group";
import { RemoveEmailButton } from "@/components/molecules/remove-email-button";
import { RequestDecision } from "@/components/molecules/request-decision";
import { SectionTitle } from "@/components/molecules/section-title";
import { SidebarLink } from "@/components/molecules/sidebar-link";
import { SignOutButton } from "@/components/molecules/sign-out-button";
import { ThemeToggle } from "@/components/molecules/theme-toggle";

const mocks = vi.hoisted(() => ({
  refresh: vi.fn(),
  reloadTo: vi.fn(),
  signOut: vi.fn(),
  addPasskey: vi.fn(),
  setTheme: vi.fn(),
  theme: { current: "dark" },
  removeAllowedEmail: vi.fn(),
  accept: vi.fn(),
  decline: vi.fn(),
  cancel: vi.fn(),
  leave: vi.fn(),
  stop: vi.fn(),
}));

vi.mock("next/navigation", () => ({ useRouter: () => ({ refresh: mocks.refresh }) }));
vi.mock("next-themes", () => ({
  useTheme: () => ({ resolvedTheme: mocks.theme.current, setTheme: mocks.setTheme }),
}));
vi.mock("@/lib/browser", () => ({ reloadTo: mocks.reloadTo }));
vi.mock("@/lib/auth/client", () => ({
  authClient: { signOut: mocks.signOut, passkey: { addPasskey: mocks.addPasskey } },
}));
vi.mock("@/actions/admin", () => ({ removeAllowedEmail: mocks.removeAllowedEmail }));
vi.mock("@/actions/joint-accounts", () => ({
  acceptJointAccountRequest: mocks.accept,
  declineJointAccountRequest: mocks.decline,
  cancelJointAccountRequest: mocks.cancel,
  leaveSharedAccount: mocks.leave,
  stopAccountSharing: mocks.stop,
}));

const done: ActionState = { status: "success", message: "Fait." };
const navItem = { href: "/", label: "Dashboard", shortLabel: "Accueil", icon: LayoutDashboard };

/** Champs reçus par une action simulée. */
const sentFields = (action: ReturnType<typeof vi.fn>) =>
  Object.fromEntries((action.mock.calls[0]?.[1] as FormData).entries());

beforeEach(() => {
  for (const mock of Object.values(mocks)) {
    if (typeof mock === "function") mock.mockReset();
  }
  mocks.theme.current = "dark";
  const { removeAllowedEmail, accept, decline, cancel, leave, stop } = mocks;
  for (const action of [removeAllowedEmail, accept, decline, cancel, leave, stop]) {
    action.mockResolvedValue(done);
  }
});

describe("affichage", () => {
  test("nomme l'application, la page, la section et la carte", () => {
    render(
      <>
        <Brand />
        <PageHeader title="Page" description="Intro" />
        <SectionTitle title="Section" />
        <CardHeading icon="i" title="Carte" description="Détail" />
        <EmptyState message="Rien ici" />
        <ErrorAlert message="Erreur" />
        <InfoList items={[{ term: "Clé", value: "Valeur" }]} />
      </>,
    );

    expect(screen.getByText("Finance")).toHaveTextContent("MT Finance");
    expect(document.querySelector("[data-slot='brand-mark']")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("heading", { level: 1, name: "Page" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Section" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "Carte" })).toBeInTheDocument();
    expect(screen.getByText("Rien ici")).toBeInTheDocument();
    expect(screen.getByRole("alert")).toHaveTextContent("Erreur");
    expect(screen.getByText("Valeur")).toBeInTheDocument();
  });

  test("associe un champ à son libellé et affiche l'élément voisin", () => {
    render(<FormField id="mail" label="Email" trailing={<span>suite</span>} />);

    expect(screen.getByLabelText("Email")).toHaveAttribute("autocomplete", "off");
    expect(screen.getByText("suite")).toBeInTheDocument();
  });

  test.each([["Aide"], [undefined]])("propose des choix, avec ou sans aide (%s)", (hint) => {
    render(
      <RadioOptionGroup
        name="n"
        legend="Choix"
        options={[{ value: "a", label: "Premier" }]}
        defaultValue="a"
        hint={hint}
      />,
    );

    expect(screen.getByRole("radio", { name: "Premier" })).toBeChecked();
    expect(screen.queryByText("Aide") !== null).toBe(hint !== undefined);
  });

  test("ne coche jamais l'accord à l'avance", () => {
    render(<ConsentCheckbox name="consent" label="J'accepte" />);

    expect(screen.getByRole("checkbox", { name: "J'accepte" })).not.toBeChecked();
  });

  test.each([true, false])("signale le lien actif (%s)", (isActive) => {
    render(
      <>
        <SidebarLink item={navItem} isActive={isActive} />
        <BottomNavLink item={navItem} isActive={isActive} />
      </>,
    );

    for (const link of screen.getAllByRole("link", { name: "Dashboard" })) {
      expect(link.getAttribute("aria-current")).toBe(isActive ? "page" : null);
    }
  });

  test.each([
    [1, "1", "Dashboard, 1 demande en attente"],
    [12, "9+", "Dashboard, 12 demandes en attente"],
  ])("affiche la pastille « %i » sur un lien", (count, text, name) => {
    render(
      <>
        <SidebarLink item={navItem} isActive={false} badgeCount={count} />
        <BottomNavLink item={navItem} isActive={false} badgeCount={count} />
      </>,
    );

    expect(screen.getAllByRole("link", { name })).toHaveLength(2);
    expect(screen.getAllByText(text)).toHaveLength(2);
  });

  test.each([
    [0, null],
    [1, "Une demande de compte joint attend votre validation."],
    [3, "3 demandes de compte joint attendent votre validation."],
  ])("signale %i demande(s) en attente", (count, message) => {
    const { container } = render(<PendingRequestsNotice count={count} />);

    if (message === null) expect(container).toBeEmptyDOMElement();
    else expect(screen.getByText(message)).toBeInTheDocument();
  });

  test("ne permet pas de retirer l'administrateur", () => {
    render(
      <ul>
        <AllowedUserRow allowedEmailId={null} email="admin@x.fr" isRegistered />
        <AllowedUserRow allowedEmailId="w1" email="a@x.fr" isRegistered={false} />
      </ul>,
    );

    expect(screen.getByText("Administrateur")).toBeInTheDocument();
    expect(screen.getByText("Inscrit")).toBeInTheDocument();
    expect(screen.getByText("En attente")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });
});

describe("actions confirmées", () => {
  test("n'envoie rien avant la confirmation, et permet de renoncer", async () => {
    const user = userEvent.setup();
    const action = vi.fn().mockResolvedValue({ status: "error", message: "Impossible." });
    render(
      <ConfirmAction
        action={action}
        fields={{ id: "42" }}
        triggerLabel="Supprimer"
        warning="Attention"
        confirmLabel="Confirmer"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Supprimer" }));
    await user.click(screen.getByRole("button", { name: "Annuler" }));
    expect(action).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Supprimer" }));
    await user.click(screen.getByRole("button", { name: "Confirmer" }));

    expect(await screen.findByText("Impossible.")).toBeInTheDocument();
    expect(sentFields(action)).toEqual({ id: "42" });
  });

  test("retire un accès seulement après confirmation", async () => {
    const user = userEvent.setup();
    render(<RemoveEmailButton id="w1" email="a@x.fr" />);

    await user.click(screen.getByRole("button", { name: "Retirer l'accès de a@x.fr" }));
    expect(screen.getByText("Ses sessions seront fermées.")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Retirer l'accès" }));

    expect(sentFields(mocks.removeAllowedEmail)).toEqual({ id: "w1" });
  });

  test.each([
    ["Annuler la demande", "Confirmer l'annulation", "cancel" as const, <CancelRequestButton key="c" requestId="r1" />],
    ["Accepter", "Valider le compte joint", "accept" as const, <RequestDecision key="a" requestId="r1" />],
    ["Refuser", "Confirmer le refus", "decline" as const, <RequestDecision key="d" requestId="r1" />],
  ])("transmet la décision « %s »", async (trigger, confirm, action, element) => {
    const user = userEvent.setup();
    render(element);

    await user.click(screen.getByRole("button", { name: trigger }));
    await user.click(screen.getByRole("button", { name: confirm }));

    expect(sentFields(mocks[action])).toEqual({ requestId: "r1" });
  });
});

describe("fin du partage", () => {
  test.each([
    [true, "Arrêter le partage", "Confirmer l'arrêt du partage", /b@x.fr perdra l'accès/, "stop" as const],
    [false, "Quitter le compte joint", "Confirmer mon départ", /Vous perdrez l'accès/, "leave" as const],
  ])(
    "propriétaire : %s — annonce les conséquences avant d'agir",
    async (isOwner, trigger, confirm, warning, action) => {
      const user = userEvent.setup();
      render(<EndSharingButton accountId="c1" isOwner={isOwner} sharedWith="b@x.fr" />);

      await user.click(screen.getByRole("button", { name: trigger }));
      expect(screen.getByText(warning)).toBeInTheDocument();
      expect(mocks[action]).not.toHaveBeenCalled();
      await user.click(screen.getByRole("button", { name: confirm }));

      expect(sentFields(mocks[action])).toEqual({ accountId: "c1" });
    },
  );
});

describe("thème", () => {
  test.each([
    ["dark", "light"],
    ["light", "dark"],
  ])("passe de %s à %s", async (current, next) => {
    mocks.theme.current = current;
    render(<ThemeToggle />);

    await userEvent.setup().click(screen.getByRole("button"));

    expect(mocks.setTheme).toHaveBeenCalledWith(next);
  });
});

describe("déconnexion", () => {
  test("recharge la page de connexion après succès", async () => {
    mocks.signOut.mockResolvedValue({ error: null });
    render(<SignOutButton showLabel />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Se déconnecter" }));

    expect(mocks.reloadTo).toHaveBeenCalledWith("/login");
  });

  test("reste sur la page si le serveur refuse", async () => {
    mocks.signOut.mockResolvedValue({ error: { message: "x" } });
    render(<SignOutButton />);

    await userEvent.setup().click(screen.getByRole("button", { name: "Se déconnecter" }));

    expect(mocks.reloadTo).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toBeEnabled();
  });
});

describe("ajout d'une passkey", () => {
  /** Clique sur le bouton d'ajout. */
  const add = async () => {
    render(<AddPasskeyButton />);
    await userEvent.setup().click(screen.getByRole("button", { name: "Ajouter une passkey" }));
  };

  test("confirme et rafraîchit la page", async () => {
    mocks.addPasskey.mockResolvedValue({ data: {}, error: null });

    await add();

    expect(screen.getByText("Passkey ajoutée.")).toBeInTheDocument();
    expect(mocks.refresh).toHaveBeenCalled();
  });

  test.each([
    [{ code: "SESSION_NOT_FRESH" }, /déconnectez-vous puis reconnectez-vous/],
    [{ message: "sans code" }, /La connexion a échoué/],
  ])("explique l'échec %o", async (error, expected) => {
    mocks.addPasskey.mockResolvedValue({ data: null, error });

    await add();

    expect(screen.getByText(expected)).toBeInTheDocument();
    expect(mocks.refresh).not.toHaveBeenCalled();
  });
});
