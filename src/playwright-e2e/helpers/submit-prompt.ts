import { type Page } from '@playwright/test';

/**
 * Rellena el prompt y despacha vía hook E2E (solo activo en builds de Playwright).
 */
export async function submitOrchestratorPrompt(
  page: Page,
  prompt: string,
): Promise<void> {
  const field = page.getByTestId('orchestrator-prompt');
  await field.waitFor({ state: 'visible' });
  await field.fill(prompt);
  await page.waitForFunction(
    () => {
      const win = window as Window & { __bxDispatchPrompt?: () => void };
      return typeof win.__bxDispatchPrompt === 'function';
    },
    undefined,
    { timeout: 15_000 },
  );
  await page.evaluate(() => {
    const win = window as Window & { __bxDispatchPrompt?: () => void };
    win.__bxDispatchPrompt?.();
  });
}
