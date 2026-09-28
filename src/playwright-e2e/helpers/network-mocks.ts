import type { Page, Route } from '@playwright/test';
import {
  ignitionEnvelope,
  triageDispatchBaseDto,
  triageDispatchSaturatedDto,
} from '../fixtures/routes.fixture';

const MOCK_LATENCY_MS = 10;

export type OrchestratorMockProfile = 'base-inline' | 'saturated-inline';

async function fulfillJson(route: Route, status: number, body: unknown): Promise<void> {
  await new Promise((resolve) => {
    setTimeout(resolve, MOCK_LATENCY_MS);
  });
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

/**
 * Cortafuegos del Oráculo: intercepta ignition, triage y (opcionalmente) stream SSE.
 */
export async function installOrchestratorNetworkMocks(
  page: Page,
  profile: OrchestratorMockProfile,
): Promise<void> {
  await page.route(/\/api\/triage\/ignition(?:\?.*)?$/, async (route) => {
    if (route.request().method() !== 'GET') {
      await route.fallback();
      return;
    }
    await fulfillJson(route, 200, ignitionEnvelope);
  });

  await page.route(/\/api\/triage(?:\?.*)?$/, async (route) => {
    if (route.request().method() !== 'POST') {
      await route.fallback();
      return;
    }
    if (profile === 'saturated-inline') {
      await fulfillJson(route, 200, triageDispatchSaturatedDto);
      return;
    }
    await fulfillJson(route, 200, triageDispatchBaseDto);
  });
}
