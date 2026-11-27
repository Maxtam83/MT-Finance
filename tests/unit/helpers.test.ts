import { z } from "zod";
import { describe, expect, test } from "vitest";
import { initialActionState } from "@/actions/action-state";
import { validationFailure } from "@/actions/validation-failure";
import { getAccountTypeLabel } from "@/lib/accounts/labels";
import { ACCESS_ERROR, getAuthErrorMessage } from "@/lib/auth/errors";
import { formatDate } from "@/lib/format";
import { describeNavItem, getNavBadgeCount, getNavItems, isActivePath } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { addAllowedEmailSchema, removeAllowedEmailSchema } from "@/lib/validations/admin";
import { emailSchema, normalizeEmail } from "@/lib/validations/email";
import { jointRequestIdSchema, requestJointAccountSchema } from "@/lib/validations/joint-account";

describe("navigation", () => {
  test("réserve le lien d'administration à l'administrateur", () => {
    const hrefs = (isAdmin: boolean) => getNavItems(isAdmin).map((item) => item.href);

    expect(hrefs(true)).toContain("/admin");
    expect(hrefs(false)).not.toContain("/admin");
    expect(hrefs(false)).toHaveLength(5);
  });

  test.each([
    ["/", "/", true],
    ["/comptes", "/", false],
    ["/comptes", "/comptes", true],
    ["/comptes/1", "/comptes", true],
    ["/comptes-bis", "/comptes", false],
  ])("compare la page %s au lien %s", (pathname, href, expected) => {
    expect(isActivePath(pathname, href)).toBe(expected);
  });
});

describe("pastille de navigation", () => {
  test("ne concerne que l'entrée des comptes", () => {
    expect(getNavBadgeCount("/comptes", 2)).toBe(2);
    expect(getNavBadgeCount("/", 2)).toBe(0);
  });

  test.each([
    [0, "Comptes"],
    [1, "Comptes, 1 demande en attente"],
    [4, "Comptes, 4 demandes en attente"],
  ])("annonce %i demande(s)", (count, expected) => {
    expect(describeNavItem("Comptes", count)).toBe(expected);
  });
});

describe("libellés et formats", () => {
  test("traduit les types de compte connus et laisse les autres", () => {
    expect(getAccountTypeLabel("CHECKING")).toBe("Compte courant");
    expect(getAccountTypeLabel("AUTRE")).toBe("AUTRE");
    expect(getAccountTypeLabel("toString")).toBe("toString");
  });

  test("formate une date en français, à l'heure de Paris", () => {
    expect(formatDate(new Date("2026-11-27T23:30:00Z"))).toBe("28 novembre 2026");
  });

  test("fusionne les classes en gardant la dernière", () => {
    expect(cn("p-2", false, "p-4")).toBe("p-4");
  });
});

describe("messages d'erreur", () => {
  test("explique le refus de la liste blanche", () => {
    expect(getAuthErrorMessage(ACCESS_ERROR.emailNotAllowed)).toContain("liste blanche");
  });

  test.each([undefined, "", "inconnu", "toString", "__proto__"])(
    "reste générique pour « %s »",
    (code) => {
      expect(getAuthErrorMessage(code)).toBe("La connexion a échoué. Veuillez réessayer.");
    },
  );
});

describe("états et validations", () => {
  test("part d'un état neutre", () => {
    expect(initialActionState).toEqual({ status: "idle" });
  });

  test("reprend le premier message de validation, avec un repli", () => {
    const error = z.string({ error: "Requis." }).safeParse(1).error as z.ZodError;

    expect(validationFailure(error)).toEqual({ status: "error", message: "Requis." });
    expect(validationFailure(new z.ZodError([]))).toEqual({
      status: "error",
      message: "Saisie invalide.",
    });
  });

  test("normalise les adresses", () => {
    expect(normalizeEmail("  A@B.FR ")).toBe("a@b.fr");
    expect(emailSchema.parse("  A@B.FR ")).toBe("a@b.fr");
    expect(emailSchema.safeParse(`${"a".repeat(260)}@b.fr`).success).toBe(false);
    expect(emailSchema.safeParse(null).error?.issues[0]?.message).toBe("Adresse email requise.");
  });

  test("valide les formulaires d'administration et de compte joint", () => {
    expect(addAllowedEmailSchema.safeParse({ email: "a@b.fr" }).success).toBe(true);
    expect(removeAllowedEmailSchema.safeParse({ id: "" }).success).toBe(false);
    expect(jointRequestIdSchema.safeParse({ requestId: "a".repeat(65) }).success).toBe(false);
    expect(
      requestJointAccountSchema.safeParse({
        accountId: "c1",
        inviteeEmail: "a@b.fr",
        tagOwner: "INVITEE",
        consent: null,
      }).success,
    ).toBe(false);
  });
});
