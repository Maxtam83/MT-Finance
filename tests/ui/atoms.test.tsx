// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test } from "vitest";
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/atoms/alert";
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

  test("dessinent le logo en deux lettres, animables séparément", () => {
    const { container } = render(<BrandMark />);

    expect(container.querySelectorAll(".logo-letter-m > path")).toHaveLength(3);
    expect(container.querySelectorAll(".logo-letter-t > path")).toHaveLength(5);
    // Aucun style ni script intégré : la politique de sécurité les bloquerait.
    expect(container.querySelector("style, script, [style]")).toBeNull();
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
