import { defineConfig, globalIgnores } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import nextTypescript from "eslint-config-next/typescript";
import jsdoc from "eslint-plugin-jsdoc";

/** Atomic Design : une couche n'importe jamais une couche située au-dessus d'elle. */
const atomicLayers = [
  { layer: "atoms", forbidden: ["molecules", "organisms", "templates"] },
  { layer: "molecules", forbidden: ["organisms", "templates"] },
  { layer: "organisms", forbidden: ["templates"] },
];

const atomicDesignRules = atomicLayers.map(({ layer, forbidden }) => ({
  files: [`src/components/${layer}/**/*.{ts,tsx}`],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: [
          {
            group: forbidden.map((name) => `@/components/${name}/*`),
            message: `Atomic Design : un fichier de « ${layer} » ne peut pas importer une couche supérieure.`,
          },
          {
            group: ["../*"],
            message: "Utilisez l'alias @/ pour que les règles de couches s'appliquent.",
          },
        ],
      },
    ],
  },
}));

export default defineConfig([
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  ...atomicDesignRules,
  {
    // Toute fonction nommée du code applicatif doit être décrite (en français).
    files: ["src/**/*.{ts,tsx}", "scripts/**/*.ts"],
    plugins: { jsdoc },
    rules: {
      "jsdoc/require-jsdoc": [
        "error",
        {
          require: {
            FunctionDeclaration: true,
            MethodDefinition: true,
            ClassDeclaration: true,
          },
          // Les fonctions fléchées nommées au premier niveau comptent aussi.
          contexts: [
            "Program > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression",
            "ExportNamedDeclaration > VariableDeclaration > VariableDeclarator > ArrowFunctionExpression",
          ],
          enableFixer: false,
        },
      ],
      "jsdoc/require-description": "error",
    },
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "next-env.d.ts",
    "src/generated/**",
  ]),
]);
