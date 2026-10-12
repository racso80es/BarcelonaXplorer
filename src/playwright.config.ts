import crypto from 'crypto';
import { defineConfig, devices } from '@playwright/test';

/**
 * Motor E2E — Soberanía de contexto bajo src/ (PBI-QA-E2E-002, PBI-ADMIN-UI-009).
 * webServer: build de producción (no next dev) para fidelidad del Edge Runtime.
 * El servidor standalone no publica `.next/static` ni `public` por sí solo:
 * sin esa copia el HTML llega, el cliente no hidrata y el hook E2E no existe.
 */
const e2eUser = process.env.E2E_ADMIN_USER;
const e2ePassword = process.env.E2E_ADMIN_PASSWORD;

let adminEnvPrefix = '';
if (e2eUser && e2ePassword) {
  const hash = crypto.createHash('sha256').update(e2ePassword).digest('hex');
  adminEnvPrefix = `ADMIN_USER=${JSON.stringify(e2eUser)} ADMIN_PASSWORD_HASH=${JSON.stringify(hash)} `;
}

export default defineConfig({
  testDir: './playwright-e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:3099',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command:
      `${adminEnvPrefix}NEXT_PUBLIC_E2E_DISPATCH_HOOK=1 npm run build && rm -rf .next/standalone/.next/static .next/standalone/public && mkdir -p .next/standalone/.next && cp -a .next/static .next/standalone/.next/static && cp -a public .next/standalone/public && ${adminEnvPrefix}PORT=3099 node .next/standalone/server.js`,
    url: 'http://localhost:3099',
    reuseExistingServer: !process.env.CI && !process.env.BX_AUDIT,
    timeout: 300_000,
  },
});
