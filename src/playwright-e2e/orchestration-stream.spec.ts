import { test, expect } from '@playwright/test';
import { installOrchestratorNetworkMocks } from './helpers/network-mocks';
import { submitOrchestratorPrompt } from './helpers/submit-prompt';

test.describe('Escenario 1 (variante): Orquestación vía SSE POST /api/orchestrator/stream', () => {
  test.beforeEach(async ({ page }) => {
    await installOrchestratorNetworkMocks(page, 'stream-base');
  });

  test('renderiza HybridCanvas consumiendo eventos SSE tipados', async ({ page }) => {
    await page.goto('/orchestrator');

    await submitOrchestratorPrompt(
      page,
      'Ruta por streaming SSE determinista',
    );

    await expect(page.getByTestId('canvas-safety-banner')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId('anti-trap-warnings-wp-e2e-1')).toBeVisible();
  });
});
