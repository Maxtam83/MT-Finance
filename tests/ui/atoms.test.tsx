// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/atoms/alert";
import { AnimatedBrandMark } from "@/components/atoms/animated-brand-mark";
import { Badge } from "@/components/atoms/badge";
import { BrandMark } from "@/components/atoms/brand-mark";
import { Button } from "@/components/atoms/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/atoms/card";
import { Checkbox } from "@/components/atoms/checkbox";
import { FormMessage } from "@/components/atoms/form-message";
import { HaloBackground } from "@/components/atoms/halo-background";
import { IconTile } from "@/components/atoms/icon-tile";
import { Input } from "@/components/atoms/input";
import { Label } from "@/components/atoms/label";
import { RadioGroup, RadioGroupItem } from "@/components/atoms/radio-group";

describe("atomes", () => {
  test("composent un encadré avec titre, texte et action", () => {
    render(
      <Alert variant="destructive">
        <AlertTitle>Titre</AlertTitle>
        <AlertDescription>Détail</AlertDescription>
        <AlertAction>Action</AlertAction>
      </Alert>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("TitreDétailAction");
  });

  test("composent une carte complète", () => {
    render(
      <Card size="sm">
        <CardHeader>
          <CardTitle>Titre</CardTitle>
          <CardDescription>Description</CardDescription>
          <CardAction>Action</CardAction>
        </CardHeader>
        <CardContent>Contenu</CardContent>
        <CardFooter>Pied</CardFooter>
      </Card>,
    );

    for (const text of ["Titre", "Description", "Action", "Contenu", "Pied"]) {
      expect(screen.getByText(text)).toBeInTheDocument();
    }
  });

  test("affichent étiquette, bouton et champ libellé", () => {
    render(
      <>
        <Badge>Étiquette</Badge>
        <Button>Envoyer</Button>
        <Label htmlFor="champ">Nom</Label>
        <Input id="champ" />
      </>,
    );

    expect(screen.getByText("Étiquette")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Envoyer" })).toBeEnabled();
    expect(screen.getByLabelText("Nom")).toBeInTheDocument();
  });

  test("permettent de cocher et de choisir", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Checkbox aria-label="Accord" />
        <RadioGroup defaultValue="a">
          <RadioGroupItem value="a" aria-label="A" />
          <RadioGroupItem value="b" aria-label="B" />
        </RadioGroup>
      </>,
    );

    await user.click(screen.getByRole("checkbox", { name: "Accord" }));
    await user.click(screen.getByRole("radio", { name: "B" }));

    expect(screen.getByRole("checkbox", { name: "Accord" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "B" })).toBeChecked();
  });

  test("cachent les éléments décoratifs aux lecteurs d'écran", () => {
    const { container } = render(
      <>
        <BrandMark />
        <HaloBackground />
        <IconTile>icône</IconTile>
      </>,
    );

    expect(container.querySelectorAll(":scope > [aria-hidden='true']")).toHaveLength(3);
  });

  test("donnent à chaque logo son propre dégradé", () => {
    const { container } = render(
      <>
        <BrandMark />
        <BrandMark className="h-32" />
      </>,
    );

    const logos = [...container.querySelectorAll("[data-slot='brand-mark']")];
    const gradients = logos.map((logo) => logo.querySelector("linearGradient")?.id);

    expect(new Set(gradients).size).toBe(2);
    logos.forEach((logo, index) => {
      expect(logo.querySelector("path[fill^='url']")).toHaveAttribute(
        "fill",
        `url(#${gradients[index]})`,
      );
    });
    expect(logos[1]).toHaveClass("h-32");
  });

  test("dessinent le logo fixe en deux lettres, sans animation", () => {
    const { container } = render(<BrandMark />);

    expect(container.querySelectorAll("[data-letter='m'] > path")).toHaveLength(3);
    expect(container.querySelectorAll("[data-letter='t'] > path")).toHaveLength(5);
    expect(container.querySelector("[class*='splash-'], mask")).toBeNull();
    // Aucun style ni script intégré : la politique de sécurité les bloquerait.
    expect(container.querySelector("style, script, [style]")).toBeNull();
  });

  test("préparent le tracé du logo animé", () => {
    const { container } = render(<AnimatedBrandMark />);
    const classNames = (selector: string) =>
      [...container.querySelectorAll(selector)].map((element) => element.getAttribute("class"));

    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    // Les trois traits du « M » s'animent séparément.
    expect(classNames("[data-letter='m'] > path")).toEqual([
      "splash-m-left",
      "splash-m-diagonal",
      "splash-m-right",
    ]);
    // Le « T » n'est découvert que par les deux traits de plume.
    expect(classNames("mask > path")).toEqual(["splash-pen-stem", "splash-pen-bar"]);
    expect(container.querySelector("[data-letter='t']")).toHaveAttribute(
      "mask",
      `url(#${container.querySelector("mask")?.id})`,
    );
    // Le reflet est limité au contour des huit tracés du logo.
    expect(container.querySelectorAll("[id$='-shape'] > path")).toHaveLength(8);
    expect(container.querySelector("g[clip-path] .splash-glint")).not.toBeNull();
    expect(container.querySelector("style, script, [style]")).toBeNull();
  });

  test("rattachent chaque référence du logo animé à son propre dessin", () => {
    const { container } = render(
      <>
        <AnimatedBrandMark />
        <AnimatedBrandMark className="h-32" />
      </>,
    );

    const logos = [...container.querySelectorAll("[data-slot='animated-brand-mark']")];
    const ids = [...container.querySelectorAll("[id]")].map((element) => element.id);

    // Quatre définitions par logo : dégradé, reflet, plume et contour.
    expect(new Set(ids).size).toBe(8);
    for (const logo of logos) {
      const references = [...logo.querySelectorAll("*")]
        .flatMap((element) => [...element.attributes])
        .flatMap((attribute) => attribute.value.match(/url\(#([^)]+)\)/)?.[1] ?? []);

      expect(references).toHaveLength(4);
      for (const reference of references) {
        expect(logo.querySelector(`[id="${reference}"]`)).not.toBeNull();
      }
    }
    expect(logos[1]).toHaveClass("h-32");
  });

  test("annoncent le résultat d'un formulaire", () => {
    const { container, rerender } = render(<FormMessage state={{ status: "idle" }} />);
    expect(container.querySelector("p")).toBeEmptyDOMElement();

    rerender(<FormMessage state={{ status: "error", message: "Raté" }} />);
    expect(screen.getByText("Raté")).toHaveClass("text-destructive");

    rerender(<FormMessage state={{ status: "success", message: "Fait" }} />);
    expect(screen.getByText("Fait")).toHaveClass("text-success");
  });
});
