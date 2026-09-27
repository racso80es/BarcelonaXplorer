import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
  {
    files: [
      "app/**/page.tsx",
      "app/**/layout.tsx",
      "components/**/*.tsx",
      "features/**/components/**/*.tsx",
      "src/app/**/page.tsx",
      "src/app/**/layout.tsx",
      "src/components/**/*.tsx",
      "src/features/**/components/**/*.tsx",
    ],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "fs",
              message: "Prohibido importar 'fs' en componentes de presentación o cliente.",
            },
            {
              name: "node:fs",
              message: "Prohibido importar 'node:fs' en componentes de presentación o cliente.",
            },
            {
              name: "@lancedb/lancedb",
              message: "Prohibido importar '@lancedb/lancedb' en componentes de presentación o cliente.",
            },
            {
              name: "@prisma/client",
              message: "Prohibido importar '@prisma/client' en componentes de presentación o cliente.",
            },
            {
              name: "@/features/triage",
              message: "Prohibido importar desde el barrel raíz '@/features/triage' en componentes de UI/App. Importa directamente desde sub-rutas como '@/features/triage/components/thermal-meter'.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
