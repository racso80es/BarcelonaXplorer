import { defineConfig, devices } from '@playwright/test';

/**
 * Motor E2E — Soberanía de contexto bajo src/ (PBI-QA-E2E-002).
 * webServer: build de producción (no next dev) para fidelidad del Edge Runtime.
 */
export default defineConfig({
  testDir: './playwright-e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  timeout: 60_000,
  use: {
    baseURL: 'http://localhost:3000',
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
      'NEXT_PUBLIC_E2E_DISPATCH_HOOK=1 npm run build && PORT=3000 node .next/standalone/server.js',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 300_000,
  },
});
