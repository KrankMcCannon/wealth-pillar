import { randomUUID } from 'node:crypto';
import { test, expect } from './fixtures';

test('shows the seeded ledger and loads another page', async ({ page }) => {
  await page.goto('/it/transactions');
  await expect(page.locator('[data-testid="transactions-fab-add"]:visible')).toBeVisible();
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
  await page.locator('[data-testid="transactions-fab-add"]:visible').click();
  const dialog = page.getByRole('dialog');
  await expect(dialog.getByRole('radiogroup', { name: 'Tipo' })).toBeVisible();
  await dialog.getByRole('button', { name: 'Crea transazione', exact: true }).click();
  await expect(dialog.getByText('La descrizione deve contenere almeno 2 caratteri')).toBeVisible();
});

test('creates a transaction and keeps it after a reload', async ({ page }) => {
  const description = `E2E Created ${randomUUID()}`;
  await page.goto('/it/budgets');
  const budget = page.getByRole('link', { name: /Apri dettagli budget: E2E Food Budget/ });
  await expect(budget).toContainText('120,00');
  await page.goto('/it/accounts');
  await expect(page.getByRole('main')).toContainText('10.000,00');
  await page.goto('/it/transactions');
  await page.locator('[data-testid="transactions-fab-add"]:visible').click();
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Descrizione', { exact: true }).fill(description);
  await dialog.locator('input[placeholder="0,00"]').fill('10');
  await dialog.getByRole('combobox', { name: 'Seleziona categoria' }).click();
  await page.getByRole('option', { name: 'E2E Food', exact: true }).click();
  await dialog.getByRole('button', { name: 'Crea transazione', exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(
    page.locator('[data-testid^="transaction-row-"]:visible').filter({ hasText: description })
  ).toHaveCount(1);
  await page.goto('/it/budgets');
  await expect(budget).toContainText(/Speso:\s*130,00/);
  await page.goto('/it/home');
  await expect(page.getByRole('main')).toContainText('9.990,00');
  await page.goto('/it/accounts');
  await expect(page.getByRole('main')).toContainText('9.990,00');
});

test('updates its own transaction, cancels deletion and then deletes it persistently', async ({
  page,
  transaction,
}) => {
  await page.goto(`/it/transactions?q=${encodeURIComponent(transaction.description)}`);
  const row = page.locator(`[data-testid="transaction-row-${transaction.id}"]:visible`);
  await expect(row).toBeVisible();
  await row.click();
  const updated = `${transaction.description} Updated`;
  const dialog = page.getByRole('dialog');
  await dialog.getByLabel('Descrizione', { exact: true }).fill(updated);
  await dialog.getByRole('button', { name: 'Salva transazione', exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await expect(row).toContainText(updated);
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

test('keeps both tabs readable on mobile and desktop and recovers from an empty search', async ({
  page,
}, testInfo) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto('/it/transactions');
    await expect(page.getByRole('tabpanel', { name: 'Transazioni', exact: true })).toBeVisible();
    await expect(page.locator('[data-testid^="transaction-row-"]').first()).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    await expect(page.getByRole('heading', { name: 'Transazioni', exact: true })).toBeVisible();
    await expect(page.getByText('Totale caricato', { exact: true })).toBeVisible();
    await page.screenshot({ path: testInfo.outputPath(`transactions-${width}.png`) });
    await page.getByRole('tab', { name: 'Ricorrenti', exact: true }).click();
    await expect(page.getByText(/Mensile.*E2E Account/)).toBeVisible();
    await page.getByRole('radio', { name: 'In pausa 0', exact: true }).click();
    await expect(
      page.getByText('Non ci sono serie in pausa con questa prospettiva.')
    ).toBeVisible();
    await page.getByRole('button', { name: 'Mostra tutte le serie', exact: true }).click();
    await page.screenshot({ path: testInfo.outputPath(`recurring-${width}.png`) });
  }
  await page.getByRole('tab', { name: 'Transazioni', exact: true }).click();
  await page.getByRole('searchbox').fill('NoSuchTransactionUnique');
  await expect(page.getByText('Nessun risultato con i filtri applicati.')).toBeVisible();
  await page.getByRole('button', { name: 'Azzera filtri', exact: true }).click();
  await expect(page.locator('[data-testid^="transaction-row-"]').first()).toBeVisible();
});

test('keeps recurring URL filters and supports pause, undo and reload', async ({ page }) => {
  await page.goto('/it/transactions?tab=Recurrent&recurringSearch=E2E&recurringStatus=active');
  await expect(page.getByRole('searchbox', { name: 'Cerca ricorrenze' })).toHaveValue('E2E');
  await page.getByRole('button', { name: 'Azioni per E2E Recurring' }).click();
  await page.getByRole('menuitem', { name: 'Pausa', exact: true }).click();
  await expect(page.getByText('E2E Recurring', { exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Annulla', exact: true }).click();
  await expect(page.getByText('E2E Recurring', { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('radio', { name: 'Attivi 1', exact: true })).toBeChecked();
  await page.getByRole('tab', { name: 'Transazioni', exact: true }).click();
  await page.getByRole('searchbox').fill('E2E Seed');
  await expect(page).toHaveURL(/recurringSearch=E2E/);
  await page.getByRole('tab', { name: 'Ricorrenti', exact: true }).click();
  await expect(page.getByRole('searchbox', { name: 'Cerca ricorrenze' })).toHaveValue('E2E');
});

test('keeps 1500 import rows keyboard reachable and retains preview decisions', async ({
  page,
}) => {
  test.setTimeout(90000);
  await page.goto('/it/transactions');
  await page.getByRole('button', { name: 'Importa', exact: true }).click();
  const header =
    'Tipo,Prodotto,Data di inizio,Data di completamento,Descrizione,Importo,Costo,Valuta,State,Saldo';
  const rows = Array.from(
    { length: 1500 },
    (_, i) =>
      `Pagamento con carta,Attuale,2026-10-01 12:00:00,2026-10-01 12:00:00,Import Fixture ${i},-1.00,0.00,EUR,COMPLETATO,100.00`
  );
  await page.locator('#import-file-input').setInputFiles({
    name: 'fixture.csv',
    mimeType: 'text/csv',
    buffer: Buffer.from([header, ...rows].join('\n')),
  });
  await page.getByRole('button', { name: 'Continua', exact: true }).click();
  await expect(
    page.getByText("1500 di 1500 righe selezionate per l'import", { exact: true })
  ).toBeVisible();
  const checkboxes = page.getByRole('checkbox');
  await expect(checkboxes).toHaveCount(50);
  const labels = await checkboxes.evaluateAll((items) =>
    items.map((item) => item.getAttribute('aria-label'))
  );
  expect(new Set(labels).size).toBe(50);
  await checkboxes.first().focus();
  await page.keyboard.press('Space');
  await expect(checkboxes.first()).not.toBeChecked();
  await page.getByRole('button', { name: 'Indietro', exact: true }).click();
  await page.getByRole('button', { name: 'Continua', exact: true }).click();
  await expect(
    page.getByText("1499 di 1500 righe selezionate per l'import", { exact: true })
  ).toBeVisible();
  await expect(checkboxes.first()).not.toBeChecked();
  await page.getByRole('button', { name: 'Successiva', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByText('Pagina 2 di 30', { exact: true })).toBeVisible();
  await expect(checkboxes).toHaveCount(50);
  await expect(
    page.getByText("1499 di 1500 righe selezionate per l'import", { exact: true })
  ).toBeFocused();
  await page.getByRole('button', { name: 'Deseleziona tutte', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByText("0 di 1500 righe selezionate per l'import", { exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: 'Seleziona tutte (1500)', exact: true }).focus();
  await page.keyboard.press('Enter');
  await expect(
    page.getByText("1500 di 1500 righe selezionate per l'import", { exact: true })
  ).toBeVisible();
});

test('reflows in English, dark mode, reduced motion and 200 percent zoom', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'reduce' });
  await page.addInitScript(() => localStorage.setItem('wp-theme', 'dark'));
  for (const width of [320, 640]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/en/transactions');
    await expect(page.locator('html')).toHaveClass(/dark/);
    await expect(page.getByRole('heading', { name: 'Transactions', exact: true })).toBeVisible();
    if (width === 640)
      await page.locator('html').evaluate((element) => {
        element.style.zoom = '2';
      });
    await expect(page.locator('[data-testid^="transaction-row-"]').first()).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    await expect(page.locator('[data-testid^="transaction-row-"]').first()).toContainText(
      /€\d+\.\d{2}/
    );
    const labelsFit = await page
      .getByRole('navigation', { name: 'Primary navigation' })
      .locator('a')
      .evaluateAll((links) =>
        links.every((link) => {
          const label = link.querySelector('span:last-child');
          return (
            !label || label.getBoundingClientRect().width <= link.getBoundingClientRect().width
          );
        })
      );
    expect(labelsFit).toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`transactions-en-dark-${width}.png`) });
    await page.getByRole('tab', { name: 'Recurring', exact: true }).click();
    await expect(page.getByText('E2E Recurring', { exact: true })).toBeVisible();
    await expect
      .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
      .toBe(true);
    await page.screenshot({ path: testInfo.outputPath(`recurring-en-dark-${width}.png`) });
  }
});
