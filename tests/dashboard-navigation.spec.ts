import { test, expect } from './fixtures';

test.describe('Dashboard navigation', () => {
  test('keeps bottom navigation mounted while switching tabs', async ({ page }) => {
    await page.goto('/it/home');
    // The header becomes ready only after the client page sets it. Before that,
    // the prerendered anchor can legitimately perform a full document navigation.
    await expect(page.getByRole('banner').getByRole('heading', { level: 1 })).toBeVisible();

    const bottomNav = page.getByRole('navigation', { name: 'Navigazione principale' });
    await expect(bottomNav.first()).toBeVisible({ timeout: 10000 });

    const navElement = bottomNav.first();
    const navHandle = await navElement.elementHandle();
    expect(navHandle).not.toBeNull();

    await navElement.getByRole('link', { name: /Transazioni|Transactions/i }).click();
    await page.waitForURL(/\/transactions/, { timeout: 10000 });

    const stillConnected = await page.evaluate((element) => element.isConnected, navHandle);
    expect(stillConnected).toBe(true);
  });

  test('navigates to budgets with the persistent navigation', async ({ page }) => {
    await page.goto('/it/home');
    // The header becomes ready only after the client page sets it. Before that,
    // the prerendered anchor can legitimately perform a full document navigation.
    await expect(page.getByRole('banner').getByRole('heading', { level: 1 })).toBeVisible();

    await page
      .getByRole('navigation', { name: 'Navigazione principale' })
      .getByRole('link', { name: /Budget|Budgets/i })
      .click();

    await expect(page).toHaveURL(/\/budgets/, { timeout: 10000 });
    await expect(page.getByRole('navigation').first()).toBeVisible();
  });
});
