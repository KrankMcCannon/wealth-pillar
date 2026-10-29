import { randomUUID } from 'node:crypto';
import { test, expect } from './fixtures';

test('shows the seeded ledger and loads another page', async ({ page }) => {
  await page.goto('/it/transactions');
  await expect(page.getByTestId('transactions-fab-add')).toBeVisible();
  const rows = page.locator('[data-testid^="transaction-row-"]');
  await expect(rows.first()).toBeVisible();
  const before = await rows.count();
  await page.getByRole('button', { name: /altre|more/i }).click();
  await expect.poll(() => rows.count()).toBeGreaterThan(before);
});

test('switches recurring tabs and opens the recurring creation form', async ({ page }) => {
  await page.goto('/it/transactions');
  await page.getByRole('tab', { name: 'Ricorrenti' }).click();
  await expect(page).toHaveURL(/tab=Recurrent/);
  await expect(page.getByText('E2E Recurring', { exact: true })).toBeVisible();
  await expect(page.locator('button:has(svg.lucide-play)')).toHaveCount(0);
  await page.getByTestId('recurring-fab-add').click();
  await expect(page).toHaveURL(/modal=recurring/);
  await expect(page.getByRole('dialog')).toBeVisible();
});

test('deep-links to the recurring tab with real seeded content', async ({ page }) => {
  await page.goto('/it/transactions?tab=Recurrent');
  await expect(page.getByRole('tab', { name: 'Ricorrenti' })).toHaveAttribute(
    'aria-selected',
    'true'
  );
  await expect(page.getByText('E2E Recurring', { exact: true })).toBeVisible();
});

test('requires valid input in the transaction form', async ({ page }) => {
  await page.goto('/it/transactions');
  await page.getByTestId('transactions-fab-add').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('radiogroup', { name: 'Tipo' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Crea transazione', exact: true }).click();
  await expect(dialog.getByText('La descrizione deve contenere almeno 2 caratteri')).toBeVisible();
});

test('creates a transaction and keeps it after a reload', async ({ page }) => {
  const description = `E2E Created ${randomUUID()}`;
  await page.goto('/it/transactions');
  await page.getByTestId('transactions-fab-add').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Descrizione', { exact: true }).fill(description);
  await dialog.locator('input[placeholder="0,00"]').fill('10');
  await dialog.getByRole('combobox', { name: 'Seleziona categoria' }).click();
  await page.getByRole('option', { name: 'E2E Food', exact: true }).click();
  await dialog.getByRole('button', { name: 'Crea transazione', exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(page.getByText(description, { exact: true })).toBeVisible();
});

test('updates its own transaction, cancels deletion and then deletes it persistently', async ({
  page,
  transaction,
}) => {
  await page.goto('/it/transactions');
  const row = page.getByTestId(`transaction-row-${transaction.id}`);
  await expect(row).toBeVisible();
  await row.click();
  const updated = `${transaction.description} Updated`;
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Descrizione', { exact: true }).fill(updated);
  await dialog.getByRole('button', { name: 'Salva transazione', exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(page.getByText(updated, { exact: true })).toBeVisible();
  await row.click();
  await page.getByTestId('transaction-form-delete').click();
  const confirmation = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Elimina transazione', exact: true }) });
  await expect(confirmation).toBeVisible();
  await confirmation.getByRole('button', { name: 'Annulla', exact: true }).click();
  await expect(confirmation).toBeHidden();
  await page.getByTestId('transaction-form-delete').click();
  await confirmation.getByRole('button', { name: 'Elimina transazione', exact: true }).click();
  await expect(confirmation).toBeHidden();
  await page.reload();
  await expect(row).toHaveCount(0);
});
