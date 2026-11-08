import { test, expect } from './fixtures';

const mobileViewport = { width: 375, height: 812 };

test.describe('entity modals (mobile)', () => {
  test.use({ viewport: mobileViewport });

  test('transaction-create opens drawer with modal amount field', async ({ page }) => {
    await page.goto('/it/transactions');

    const fab = page.getByTestId('transactions-fab-add');
    await expect(fab).toBeVisible();

    await fab.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(
      page.getByRole('heading', { name: 'Nuova transazione', exact: true })
    ).toBeVisible();
    await expect(page.locator('input[placeholder="0,00"]').first()).toBeVisible();
    await expect(page.getByRole('radiogroup', { name: /Tipo|Type/i })).toBeVisible();
    await expect(page.getByRole('radio', { name: /Uscita|Expense/i })).toBeChecked();
    await expect(page.getByRole('button', { name: /annulla|cancel/i })).toBeVisible();
  });

  test('budget-create opens drawer with modal fields', async ({ page }) => {
    await page.goto('/it/budgets');

    const fab = page.getByRole('button', { name: /aggiungi budget|add budget/i });
    await expect(fab).toBeVisible();

    await fab.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('heading', { name: 'Nuovo budget', exact: true })).toBeVisible();
    await expect(page.locator('input[placeholder="0,00"]').first()).toBeVisible();
  });

  test('budget-close-period opens drawer from budgets page', async ({ page }) => {
    await page.goto('/it/budgets');

    await page.getByRole('button', { name: /azioni del periodo|period actions/i }).click();
    await page.getByRole('menuitem', { name: /nuovo periodo|new period/i }).click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-vaul-drawer]')).toBeVisible();
  });

  test('budget-edit-closing-date opens drawer when latest closed period exists', async ({
    page,
  }) => {
    await page.goto('/it/budgets');

    const periodActions = page.getByRole('button', { name: /azioni del periodo|period actions/i });
    await expect(periodActions).toBeVisible();

    await periodActions.click();
    const editClosingDateItem = page.getByRole('menuitem', {
      name: /modifica ultima chiusura|adjust last closing date/i,
    });
    await expect(editClosingDateItem).toBeVisible({ timeout: 5000 });
    await editClosingDateItem.click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-vaul-drawer]')).toBeVisible();
  });

  test('transaction-create drawer exposes drag handle', async ({ page }) => {
    await page.goto('/it/transactions');

    const fab = page.getByTestId('transactions-fab-add');
    await expect(fab).toBeVisible();

    await fab.click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-vaul-drawer]')).toBeVisible();
  });
});

test.describe('settings modals (mobile)', () => {
  test.use({ viewport: mobileViewport });

  test('deep-link opens profile settings drawer with dual footer', async ({ page }) => {
    await page.goto('/it/settings?modal=settings:profile');
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /annulla|cancel/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /salva|save/i })).toBeVisible();
  });
});

test('opens notification import with the standard settings panel and no fixed category', async ({
  page,
}, testInfo) => {
  for (const width of [320, 390, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/it/settings');
    await page.getByRole('button', { name: 'Importa dalle notifiche, Revolut' }).click();
    await expect(page).toHaveURL(/modal=settings%3Anotifications|modal=settings:notifications/);
    const dialog = page.getByRole('dialog');
    await expect(
      dialog.getByRole('heading', { name: 'Importa dalle notifiche', exact: true })
    ).toBeVisible();
    await expect(dialog.getByLabel('Nome del dispositivo')).toBeVisible();
    await expect(dialog.getByRole('combobox', { name: 'Categoria predefinita' })).toHaveCount(0);
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
      .toBe(true);
    await expect
      .poll(() =>
        dialog.evaluate((element) => {
          const bounds = element.getBoundingClientRect();
          return (
            bounds.top >= 0 &&
            bounds.bottom <= innerHeight + 1 &&
            element.scrollWidth <= element.clientWidth
          );
        })
      )
      .toBe(true);
    await dialog
      .getByRole('button', { name: 'Collega dispositivo', exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      dialog.getByRole('button', { name: 'Collega dispositivo', exact: true })
    ).toBeInViewport();
    await page.screenshot({ path: testInfo.outputPath(`notification-settings-${width}.png`) });
    await dialog.getByRole('button', { name: 'Chiudi finestra', exact: true }).click();
  }
  await page.goto('/it/settings?modal=settings:notifications');
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Nome del dispositivo').fill('E2E notification device');
  await dialog.getByRole('combobox', { name: 'Conto Revolut EUR', exact: true }).click();
  await page.getByRole('option', { name: 'E2E Account', exact: true }).click();
  await dialog.getByRole('button', { name: 'Collega dispositivo', exact: true }).click();
  await expect(dialog.getByText('Copia ora il token:', { exact: false })).toBeVisible();
  await expect(dialog.getByText('E2E notification device', { exact: true })).toBeVisible();
});
