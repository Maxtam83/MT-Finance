import { readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { LETTER_M, LETTER_T, LOGO_COLORS, LOGO_GRADIENT_AXIS, LOGO_PEN } from "@/lib/brand-logo";

/** Lit un fichier du projet à partir de sa racine. */
const readSource = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), "utf8");

const icon = readSource("src/app/icon.svg");
const styles = readSource("src/app/globals.css");

type Point = readonly [number, number];

/**
 * Longueur d'un tracé SVG fait de déplacements (M), de droites (L) et de courbes
 * (C), en coordonnées absolues. Les courbes sont découpées en petits segments.
 */
function pathLength(d: string): number {
  let position: Point = [0, 0];
  let total = 0;

  for (const [, command, args = ""] of d.matchAll(/([A-Za-z])([^A-Za-z]*)/g)) {
    const values = (args.match(/-?\d+(\.\d+)?/g) ?? []).map(Number);
    const at = (index: number): Point => [values[index] ?? 0, values[index + 1] ?? 0];
    const distance = (from: Point, to: Point) => Math.hypot(to[0] - from[0], to[1] - from[1]);

    if (command === "M") {
      position = at(0);
    } else if (command === "L") {
      total += distance(position, at(0));
      position = at(0);
    } else if (command === "C") {
      const [start, first, second, end] = [position, at(0), at(2), at(4)];
      for (let step = 1; step <= 100; step += 1) {
        const t = step / 100;
        const mix = (axis: 0 | 1) =>
          (1 - t) ** 3 * start[axis] +
          3 * (1 - t) ** 2 * t * first[axis] +
          3 * (1 - t) * t ** 2 * second[axis] +
          t ** 3 * end[axis];
        const next: Point = [mix(0), mix(1)];
        total += distance(position, next);
        position = next;
      }
    } else {
      // Mieux vaut échouer que mesurer à tort une commande non prise en charge.
      throw new Error(`commande de tracé non mesurée : ${command}`);
    }
  }

  return total;
}

/** Valeur numérique d'une propriété dans le bloc d'une classe de `globals.css`. */
function styleValue(className: string, property: string): number {
  const block = new RegExp(`\\.${className} \\{([^}]*)\\}`).exec(styles)?.[1] ?? "";
  return Number(new RegExp(`${property}: (\\d+);`).exec(block)?.[1]);
}

describe("dessin du logo", () => {
  test("reprend à l'identique les tracés de l'icône fournie", () => {
    const paths = [...Object.values(LETTER_M), ...LETTER_T.body, LETTER_T.shine, LETTER_T.shade];
    const iconPaths = [...icon.matchAll(/ d="([^"]+)"/g)].map(([, d]) => d);

    expect(paths).toEqual(iconPaths);
  });

  test("reprend les couleurs et le dégradé de l'icône fournie", () => {
    for (const color of Object.values(LOGO_COLORS)) {
      expect(icon).toContain(`="${color}"`);
    }
    for (const [axis, value] of Object.entries(LOGO_GRADIENT_AXIS)) {
      expect(icon).toContain(`${axis}="${value}"`);
    }
  });
});

describe("styles de l'animation d'ouverture", () => {
  test.each(["stem", "bar"] as const)("la plume « %s » est tracée sur toute sa longueur", (stroke) => {
    const dash = styleValue(`splash-pen-${stroke}`, "stroke-dasharray");

    // Un motif plus court que le trait laisserait un morceau du « T » découvert.
    expect(dash).toBeGreaterThanOrEqual(pathLength(LOGO_PEN[stroke].d));
    expect(styleValue(`splash-pen-${stroke}`, "stroke-dashoffset")).toBe(dash);
  });

  test("refuse de mesurer une commande de tracé inconnue", () => {
    expect(() => pathLength("M0 0Q1 1 2 2")).toThrow("Q");
  });

  test("se terminent toutes en 2 secondes", () => {
    // Chaque raccourci `animation` : sa durée, puis son éventuel délai.
    const ends = [...styles.matchAll(/animation: splash-[^;]+;/g)].map(([declaration]) => {
      const times = [...declaration.matchAll(/(?<=\s)(\d*\.?\d+)s(?=[\s;])/g)];
      return times.reduce((sum, [, seconds]) => sum + Number(seconds), 0);
    });

    expect(ends).toHaveLength(9);
    expect(Math.max(...ends)).toBeCloseTo(2);
  });

  test("sont désactivées pour qui limite les animations", () => {
    expect(styles).toMatch(
      /@media \(prefers-reduced-motion: reduce\) \{\s*\.splash \{\s*display: none;\s*\}\s*\}/,
    );
  });
});
