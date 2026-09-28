import { test, expect } from '@playwright/test';
import { installOrchestratorNetworkMocks } from './helpers/network-mocks';
import { WAYPOINT_ID_E2E } from './fixtures/routes.fixture';
import { submitOrchestratorPrompt } from './helpers/submit-prompt';

test.describe('Escenario 2: Saturación térmica S+ Grade', () => {
  test.beforeEach(async ({ page }) => {
    await installOrchestratorNetworkMocks(page, 'saturated-inline');
  });

  test('muestra medidor, banner S+, escudo anti-trampas y enlace CPA', async ({
    page,
  }) => {
    await page.goto('/orchestrator');

    await submitOrchestratorPrompt(
      page,
      'Ruta S+ por el Born con máxima saturación',
    );

    await expect(page.getByTestId('thermal-meter')).toBeVisible();
    await expect(page.getByTestId('canvas-s-grade-banner')).toBeVisible({
      timeout: 30_000,
    });
    await expect(
      page.getByTestId(`anti-trap-warnings-${WAYPOINT_ID_E2E}`),
    ).toBeVisible();
    await expect(
      page.getByTestId(`recommended-alternatives-${WAYPOINT_ID_E2E}`),
    ).toBeVisible();

    const affiliateLink = page.getByRole('link', { name: 'Asegurar Entrada' });
    await expect(affiliateLink).toBeVisible();
    await expect(affiliateLink).toHaveAttribute('href', /civitatis\.com/);
  });
});
