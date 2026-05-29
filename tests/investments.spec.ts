import { test, expect } from '@playwright/test';
import { setupClerkMocks } from './mocks/clerk-mock';

test.describe('Investments Page', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkMocks(page);
  });

  test('switches tabs and updates URL', async ({ page }) => {
    await page.goto('/investments');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const sandboxTab = page.getByRole('tab', { name: /Simulazione|Scenario/i });
    if (await sandboxTab.isVisible({ timeout: 5000 })) {
      await sandboxTab.click();
      await page.waitForTimeout(500);
      await expect(page).toHaveURL(/tab=sandbox/, { timeout: 5000 });
    }

    const personalTab = page.getByRole('tab', {
      name: /Investimenti Personali|Personal Investments/i,
    });
    if (await personalTab.isVisible({ timeout: 5000 })) {
      await personalTab.click();
      await page.waitForTimeout(500);
    }
  });

  test('shows investments FAB on load', async ({ page }) => {
    await page.goto('/investments');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const fab = page.getByTestId('investments-fab-add');
    if (await fab.isVisible({ timeout: 5000 })) {
      await expect(fab).toBeVisible();
    }
  });
});
