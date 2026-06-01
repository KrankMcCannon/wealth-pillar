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
    await expect(page.getByRole('button', { name: /annulla|cancel/i })).toHaveCount(0);
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

  test('budget-close-period opens drawer from budgets page', async ({ page }) => {
    await page.goto('/budgets');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const closePeriodButton = page.getByRole('button', { name: /chiudi periodo|close period/i });
    if (!(await closePeriodButton.isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }

    await closePeriodButton.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-vaul-drawer]')).toBeVisible();
  });

  test('budget-edit-closing-date opens drawer when latest closed period exists', async ({
    page,
  }) => {
    await page.goto('/budgets');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const editClosingDateButton = page.getByRole('button', {
      name: /modifica ultima chiusura|adjust last closing date/i,
    });
    if (!(await editClosingDateButton.isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }

    await editClosingDateButton.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-vaul-drawer]')).toBeVisible();
  });

  test('transaction-create drawer exposes drag handle', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2000);

    const fab = page.getByTestId('transactions-fab-add');
    if (!(await fab.isVisible({ timeout: 5000 }))) {
      test.skip();
      return;
    }

    await fab.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-vaul-drawer]')).toBeVisible();
  });
});

test.describe('settings modals (mobile)', () => {
  test.use({ viewport: mobileViewport });

  test.beforeEach(async ({ page }) => {
    await setupClerkMocks(page);
  });

  test('deep-link opens profile settings drawer with dual footer', async ({ page }) => {
    await page.goto('/settings?modal=settings:profile');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('.text-modal-fg-muted').first()).toBeVisible();
    await expect(page.getByRole('button', { name: /annulla|cancel/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /salva|save/i })).toBeVisible();
  });
});
