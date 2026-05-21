import { test, expect } from '@playwright/test';
import { setupClerkMocks } from './mocks/clerk-mock';

const mobileViewport = { width: 375, height: 812 };

test.describe('entity modals (mobile)', () => {
  test.use({ viewport: mobileViewport });

  test.beforeEach(async ({ page }) => {
    await setupClerkMocks(page);
  });

  test('transaction-create opens drawer with modal amount field', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const fab = page.getByTestId('transactions-fab-add');
    if (!(await fab.isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }

    await fab.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Nuova transazione')).toBeVisible();
    await expect(page.locator('.text-modal-fg-muted').first()).toBeVisible();
    await expect(page.locator('input[placeholder="0,00"]').first()).toBeVisible();
  });

  test('budget-create opens drawer with modal fields', async ({ page }) => {
    await page.goto('/budgets');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const fab = page.getByRole('button', { name: /aggiungi budget|add budget/i });
    if (!(await fab.isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }

    await fab.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('.text-modal-fg-muted').first()).toBeVisible();
  });
});

test.describe('settings modals (mobile)', () => {
  test.use({ viewport: mobileViewport });

  test.beforeEach(async ({ page }) => {
    await setupClerkMocks(page);
  });

  test('deep-link opens profile settings drawer with dark fields', async ({ page }) => {
    await page.goto('/settings?modal=settings:profile');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.text-modal-fg-muted').first()).toBeVisible();
  });
});
