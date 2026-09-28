import { test, expect } from '@playwright/test';
import { installOrchestratorNetworkMocks } from './helpers/network-mocks';
import { submitOrchestratorPrompt } from './helpers/submit-prompt';

test.describe('Escenario 1: Orquestación determinista (inline itinerary)', () => {
  test.beforeEach(async ({ page }) => {
    await installOrchestratorNetworkMocks(page, 'base-inline');
  });

  test('renderiza HybridCanvas sin llamadas externas al generar ruta', async ({ page }) => {
    const leakedHosts: string[] = [];
    page.on('request', (request) => {
      const host = new URL(request.url()).host;
      if (host !== 'localhost:3000') {
        leakedHosts.push(request.url());
      }
    });

    await page.goto('/orchestrator');

    const prompt =
      'Ruta de 4 horas por el Gótico para 2 personas buscando tapas';
    await submitOrchestratorPrompt(page, prompt);

    await expect(page.getByTestId('canvas-safety-banner')).toBeVisible({
      timeout: 30_000,
    });
    await expect(page.getByTestId('anti-trap-warnings-wp-e2e-1')).toBeVisible();
    expect(leakedHosts).toEqual([]);
  });
});
