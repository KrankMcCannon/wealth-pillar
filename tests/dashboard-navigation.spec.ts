import { test, expect } from '@playwright/test';
import { setupClerkMocks } from './mocks/clerk-mock';

test.describe('Dashboard navigation', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkMocks(page);
  });

  test('keeps bottom navigation mounted while switching tabs', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');

    const bottomNav = page
      .getByRole('navigation')
      .filter({ hasText: /Home|Transazioni|Transactions/i });
    await expect(bottomNav.first()).toBeVisible({ timeout: 10000 });

    const navElement = bottomNav.first();
    const navHandle = await navElement.elementHandle();
    expect(navHandle).not.toBeNull();

    await page.getByRole('link', { name: /Transazioni|Transactions/i }).click();
    await page.waitForURL(/\/transactions/, { timeout: 10000 });

    const stillConnected = await page.evaluate((element) => element.isConnected, navHandle!);
    expect(stillConnected).toBe(true);
  });

  test('shows route loading skeleton without full page reload', async ({ page }) => {
    await page.goto('/home');
    await page.waitForLoadState('domcontentloaded');

    await page.getByRole('link', { name: /Budget|Budgets/i }).click();

    await expect(page).toHaveURL(/\/budgets/, { timeout: 10000 });
    await expect(page.getByRole('navigation').first()).toBeVisible();
  });
});
