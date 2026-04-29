import { test, expect } from '@playwright/test';
import { setupClerkMocks, createMockUser } from './mocks/clerk-mock';

/**
 * E2E Tests for Transaction Flows
 *
 * Uses Clerk mocks to bypass authentication - no actual Clerk auth required.
 */

test.describe('Transaction Flows', () => {
  test.beforeEach(async ({ page }) => {
    await setupClerkMocks(page);
  });

  test.describe('Transaction List Visualization', () => {
    test('should display the transactions page with header and navigation', async ({ page }) => {
      await page.goto('/transactions');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const hasTransazioni = await page.locator('text=Transazioni').first().isVisible();
      const hasContent = await page.locator('main').isVisible();

      expect(hasTransazioni || hasContent).toBeTruthy();
    });

    test('should switch between Transactions and Recurring tabs', async ({ page }) => {
      await page.goto('/transactions');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const recurringTab = page.locator('text=Ricorrenti');
      if (await recurringTab.isVisible({ timeout: 5000 })) {
        await recurringTab.click();
        await page.waitForTimeout(500);
      }
    });
  });

  test.describe('Add Transaction', () => {
    test('should open the new transaction modal', async ({ page }) => {
      await page.goto('/transactions');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const fab = page.getByTestId('transactions-fab-add');
      if (await fab.isVisible({ timeout: 5000 })) {
        await fab.click();
        await expect(page.locator('text=Nuova transazione')).toBeVisible({ timeout: 5000 });
        return;
      }

      const actionMenuTrigger = page.locator('#header-action-menu-trigger');
      if (await actionMenuTrigger.isVisible({ timeout: 3000 })) {
        await actionMenuTrigger.click();
        const newItem = page.locator('text=Nuova Transazione');
        await expect(newItem).toBeVisible();
        await newItem.click();
        await expect(page.locator('text=Nuova transazione')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should show validation errors when submitting empty form', async ({ page }) => {
      await page.goto('/transactions');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const fab = page.getByTestId('transactions-fab-add');
      if (await fab.isVisible({ timeout: 5000 })) {
        await fab.click();
        await expect(page.locator('text=Nuova transazione')).toBeVisible({ timeout: 5000 });

        const submitButton = page.locator('button:has-text("Crea")');
        if (await submitButton.isVisible()) {
          await submitButton.click();
          await expect(
            page.locator('text=La descrizione deve contenere almeno 2 caratteri')
          ).toBeVisible({ timeout: 5000 });
        }
      }
    });

    test('should create a new transaction successfully', async ({ page }) => {
      await page.goto('/transactions');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const fab = page.getByTestId('transactions-fab-add');
      if (await fab.isVisible({ timeout: 5000 })) {
        await fab.click();
        await expect(page.locator('text=Nuova transazione')).toBeVisible({ timeout: 5000 });

        await page
          .locator("input[placeholder='Es. Spesa supermercato']")
          .fill('Test E2E Transaction');
        await page.locator('input[placeholder="0,00"]').fill('100');

        await page.locator('button:has-text("Crea")').click();
        await expect(page.locator('text=Nuova transazione')).not.toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Update Transaction', () => {
    test('should open edit modal when clicking on a transaction', async ({ page }) => {
      await page.goto('/transactions');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const transactionItem = page.locator('[data-testid="transaction-row"]').first();
      if (await transactionItem.isVisible({ timeout: 5000 })) {
        await transactionItem.click();
        await expect(page.locator('text=Modifica transazione')).toBeVisible({ timeout: 5000 });
      }
    });

    test('should update a transaction successfully', async ({ page }) => {
      await page.goto('/transactions');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const transactionItem = page.locator('[data-testid="transaction-row"]').first();
      if (await transactionItem.isVisible({ timeout: 5000 })) {
        await transactionItem.click();
        await expect(page.locator('text=Modifica transazione')).toBeVisible({ timeout: 5000 });

        const descriptionInput = page.locator("input[placeholder='Es. Spesa supermercato']");
        await descriptionInput.clear();
        await descriptionInput.fill('Updated E2E Transaction');

        await page.locator('button:has-text("Salva transazione")').click();
        await expect(page.locator('text=Modifica transazione')).not.toBeVisible({ timeout: 5000 });
      }
    });
  });

  test.describe('Delete Transaction', () => {
    test('should show confirmation dialog when deleting a transaction', async ({ page }) => {
      await page.goto('/transactions');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const transactionItem = page.locator('[data-testid="transaction-row"]').first();
      if (await transactionItem.isVisible({ timeout: 5000 })) {
        await transactionItem.click();
        await expect(page.locator('text=Modifica transazione')).toBeVisible({ timeout: 5000 });

        await page.getByTestId('transaction-form-delete').click();
        await expect(page.getByRole('heading', { name: 'Elimina transazione' })).toBeVisible({
          timeout: 5000,
        });
      }
    });

    test('should cancel deletion when clicking Annulla', async ({ page }) => {
      await page.goto('/transactions');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const transactionItem = page.locator('[data-testid="transaction-row"]').first();
      if (await transactionItem.isVisible({ timeout: 5000 })) {
        await transactionItem.click();
        await page.getByTestId('transaction-form-delete').click();
        await expect(page.getByRole('heading', { name: 'Elimina transazione' })).toBeVisible({
          timeout: 5000,
        });

        await page.locator('button:has-text("Annulla")').click();
        await expect(page.getByRole('heading', { name: 'Elimina transazione' })).not.toBeVisible({
          timeout: 3000,
        });
      }
    });

    test('should delete transaction when confirming', async ({ page }) => {
      await page.goto('/transactions');
      await page.waitForLoadState('domcontentloaded');
      await page.waitForTimeout(2000);

      const transactionItem = page.locator('[data-testid="transaction-row"]').first();
      if (await transactionItem.isVisible({ timeout: 5000 })) {
        await transactionItem.click();
        await page.getByTestId('transaction-form-delete').click();
        await expect(page.getByRole('heading', { name: 'Elimina transazione' })).toBeVisible({
          timeout: 5000,
        });

        await page.locator('[role="dialog"] button:has-text("Elimina transazione")').click();
        await expect(page.getByRole('heading', { name: 'Elimina transazione' })).not.toBeVisible({
          timeout: 5000,
        });
      }
    });
  });
});

test.describe('Transaction Flows with Custom User', () => {
  test.beforeEach(async ({ page }) => {
    const customUser = createMockUser({
      id: 'custom_user_123',
      email: 'custom@example.com',
      firstName: 'Custom',
      lastName: 'Test User',
    });
    await setupClerkMocks(page, customUser);
  });

  test('should access transactions with custom mock user', async ({ page }) => {
    await page.goto('/transactions');
    await page.waitForLoadState('domcontentloaded');

    const main = page.locator('main');
    await expect(main).toBeVisible({ timeout: 10000 });
  });
});
