import { test, expect } from '@playwright/test';

test.describe('Escenario 3: Centinela perimetral /Admin', () => {
  test('rechaza /Admin/System sin Basic Auth con HTTP 401', async ({ page }) => {
    const response = await page.goto('/Admin/System');
    expect(response?.status()).toBe(401);
    expect(response?.headers()['www-authenticate']).toContain(
      'BarcelonaXplorer Admin',
    );
    await expect(page.getByText('Authentication required.')).toBeVisible();
  });

  test('normaliza /admin/system hacia /Admin/system con HTTP 308', async ({
    request,
    baseURL,
  }) => {
    const response = await request.get(`${baseURL}/admin/system`, {
      maxRedirects: 0,
    });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toMatch(/\/Admin\/system/i);
  });
});
