import { test, expect } from '@playwright/test';

const e2eUser = process.env.E2E_ADMIN_USER;
const e2ePassword = process.env.E2E_ADMIN_PASSWORD;
const hasCredentials = Boolean(e2eUser && e2ePassword);

test.describe('Admin Layout & Touch Ergonomics (PBI-ADMIN-UI-009)', () => {
  test.skip(!hasCredentials, 'Requiere credenciales E2E_ADMIN_USER y E2E_ADMIN_PASSWORD');

  test.use({
    httpCredentials:
      e2eUser && e2ePassword
        ? {
            username: e2eUser,
            password: e2ePassword,
          }
        : undefined,
  });

  const routes = ['/Admin', '/Admin/Logs', '/Admin/System', '/Admin/Cognitive', '/Admin/Context'];

  for (const route of routes) {
    test(`no desborda horizontalmente en móvil (375x812) en ${route}`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');

      const isWithinViewport = await page.evaluate(() => {
        return document.documentElement.scrollWidth <= window.innerWidth;
      });
      expect(isWithinViewport).toBe(true);
    });
  }

  const dataTableRoutes = ['/Admin/Logs', '/Admin/Cognitive', '/Admin/Context'];

  for (const route of dataTableRoutes) {
    test(`buscador de DataTable tiene ergonomía táctil (>=44px de alto y ancho completo) en móvil (375x812) en ${route}`, async ({
      page,
    }) => {
      await page.setViewportSize({ width: 375, height: 812 });
      await page.goto(route);
      await page.waitForLoadState('domcontentloaded');

      const searchInput = page.locator('input[placeholder*="Buscar"]');
      await expect(searchInput).toBeVisible();

      const box = await searchInput.boundingBox();
      expect(box).not.toBeNull();
      expect(box!.height).toBeGreaterThanOrEqual(44);

      const searchContainer = searchInput.locator('..');
      const containerBox = await searchContainer.boundingBox();
      expect(containerBox).not.toBeNull();
      // El buscador ocupa la fila dentro de su contenedor (w-full)
      expect(Math.abs(box!.width - containerBox!.width)).toBeLessThanOrEqual(2);
    });
  }

  test('admin-canvas supera 1280px en pantalla Full HD (1920x1080) en /Admin/Logs', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/Admin/Logs');
    await page.waitForLoadState('domcontentloaded');

    const canvas = page.locator('[data-testid="admin-canvas"]');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeGreaterThan(1280);
  });

  test('admin-canvas está topado a máximo 1920px en pantalla ultraancha (2200x1080) en /Admin/Logs', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 2200, height: 1080 });
    await page.goto('/Admin/Logs');
    await page.waitForLoadState('domcontentloaded');

    const canvas = page.locator('[data-testid="admin-canvas"]');
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.width).toBeLessThanOrEqual(1920);
  });
});
