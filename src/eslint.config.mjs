import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const srcDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.dirname(srcDir);

const eslintConfig = defineConfig([
  {
    basePath: repoRoot,
  },
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    "**/.next/**",
    "**/out/**",
    "**/build/**",
    "**/next-env.d.ts",
    "**/node_modules/**",
  ]),
  {
    files: [
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
              message:
                "Prohibido importar 'fs' en componentes de presentación o cliente.",
            },
            {
              name: "node:fs",
              message:
                "Prohibido importar 'node:fs' en componentes de presentación o cliente.",
            },
            {
              name: "@lancedb/lancedb",
              message:
                "Prohibido importar '@lancedb/lancedb' en componentes de presentación o cliente.",
            },
            {
              name: "@prisma/client",
              message:
                "Prohibido importar '@prisma/client' en componentes de presentación o cliente.",
            },
            {
              name: "@/features/triage",
              message:
                "Prohibido importar desde el barrel raíz '@/features/triage' en componentes de UI/App. Importa directamente desde sub-rutas como '@/features/triage/components/thermal-meter'.",
            },
          ],
          patterns: [
            {
              group: ["@/features/*/server", "@/features/*/server/*"],
              message:
                "Prohibido importar la superficie de servidor de una feature desde UI/cliente (PBI-STEEL-007). Usa el barrel de dominio puro.",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
