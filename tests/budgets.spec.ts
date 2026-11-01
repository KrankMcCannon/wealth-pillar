import { test, expect } from './fixtures';

test('shows cycle context, exposes its action and links to scoped history', async ({ page }) => {
  await page.goto('/it/budgets');
  await expect(
    page.getByRole('heading', { name: 'Budget di E2E User', exact: true })
  ).toBeVisible();
  await page.getByRole('button', { name: /azioni del periodo/i }).click();
  await page.getByRole('menuitem', { name: 'Nuovo ciclo', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('E2E User');
  await expect(page.getByRole('dialog')).toContainText('Il nuovo ciclo inizia');
  await page.getByRole('button', { name: 'Annulla', exact: true }).click();
  await page.getByRole('link', { name: 'Storico periodi', exact: true }).click();
  await expect(page).toHaveURL(/member=/);
  await expect(page.locator('#budget-periods')).toHaveAttribute('open', '');
});
test('explains partial transaction days and shows the included categories', async ({ page }) => {
  await page.goto('/it/budgets');
  await page.getByRole('link', { name: /Apri dettagli budget: E2E Food Budget/ }).click();
  await expect(page.getByText('Budget di E2E User', { exact: true })).toBeVisible();
  await expect(page.getByText(/Ultime 8 transazioni di 120/)).toBeVisible();
  await expect(page.getByRole('heading', { name: /giornata mostrata in parte/ })).toBeVisible();
  await page.getByText('Categorie incluse (1)', { exact: true }).click();
  await page.getByRole('searchbox', { name: 'Cerca categorie incluse' }).fill('NoSuchCategory');
  await expect(page.getByText('Nessuna categoria trovata.', { exact: true })).toBeVisible();
  await page.getByRole('link', { name: 'Vedi tutte le 120 transazioni', exact: true }).click();
  await expect(page).toHaveURL(/categories=e2e_food/);
});
test('makes the trend available with keyboard values and a data table', async ({ page }) => {
  await page.goto('/it/budgets');
  await page.getByText('Andamento del periodo', { exact: true }).click();
  const slider = page.getByRole('slider', { name: 'Giorno da consultare' });
  await slider.focus();
  await page.keyboard.press('Home');
  await expect(slider).toHaveValue('0');
  await page.getByText('Dati giornalieri', { exact: true }).click();
  await expect(page.getByRole('table')).toBeVisible();
  await expect(page.getByRole('columnheader', { name: 'Uscite nette cumulative' })).toBeVisible();
});
test('previews the annual allowance before saving', async ({ page }) => {
  await page.goto('/it/budgets');
  await page.getByRole('link', { name: /Apri dettagli budget: E2E Food Budget/ }).click();
  await page.getByRole('button', { name: 'Modifica budget', exact: true }).click();
  const dialog = page.getByRole('dialog');
  await dialog.getByText('Obiettivo annuo (quota 1/12)', { exact: true }).click();
  await dialog.getByRole('textbox', { name: 'Obiettivo annuo', exact: true }).fill('1200');
  await expect(dialog).toContainText('100,00');
  await expect(dialog).toContainText('non un accantonamento');
  await dialog.getByRole('button', { name: 'Annulla', exact: true }).click();
});
test('keeps budgets and detail readable at narrow widths, in both themes and with zoom', async ({
  page,
}, testInfo) => {
  for (const locale of ['it', 'en']) {
    await page.addInitScript(
      (theme) => localStorage.setItem('wp-theme', theme),
      locale === 'en' ? 'dark' : 'light'
    );
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(`/${locale}/budgets`);
      await expect(page.getByTestId('budgets-fab-add')).toBeVisible();
      await expect(
        page.getByRole('heading', { name: locale === 'it' ? 'Budget' : 'Budgets', exact: true })
      ).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
      await page.screenshot({ path: testInfo.outputPath(`budgets-${locale}-${width}.png`) });
      const card = page.locator('a[href*="/budgets/"]').first();
      await card.click();
      await expect(page.locator('#main-budget-detail')).toBeVisible();
      await expect
        .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
        .toBe(true);
    }
  }
  await page.setViewportSize({ width: 640, height: 900 });
  await page.goto('/en/budgets');
  await page.locator('html').evaluate((e) => {
    e.style.zoom = '2';
  });
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
    .toBe(true);
});

test('creates a shared-category envelope with a long name and exposes the over-limit state', async ({
  page,
}) => {
  await page.goto('/it/budgets');
  await page.getByTestId('budgets-fab-add').click();
  const form = page.getByRole('dialog');
  await form.getByRole('textbox', { name: 'Importo', exact: true }).fill('10');
  await form
    .getByRole('textbox', { name: 'Descrizione', exact: true })
    .fill('Budget per le spese ricorrenti della famiglia con descrizione molto lunga');
  await form.getByRole('button', { name: /^Categorie/ }).click();
  const picker = page
    .getByRole('dialog')
    .filter({ has: page.getByRole('heading', { name: 'Categorie', exact: true }) });
  await picker.getByText('E2E Food · E2E Food Budget', { exact: true }).click();
  await picker.getByRole('button', { name: 'Chiudi finestra', exact: true }).click();
  await expect(form).toContainText('Categorie condivise con: E2E Food Budget');
  await form.getByRole('button', { name: 'Crea Budget', exact: true }).click();
  await expect(form).toBeHidden();
  await page.reload();
  await expect(page.getByText('Limite superato', { exact: true })).toBeVisible();
  const card = page.getByRole('link', { name: /Apri dettagli budget: Budget per le spese/ });
  await expect(card).toHaveAccessibleName(/Superato di/);
});
test('keeps cycle management available after deleting every envelope', async ({ page }) => {
  await page.goto('/it/budgets');
  for (let i = 0; i < 3; i++) {
    const cards = page.getByRole('link', { name: /Apri dettagli budget:/ });
    if ((await cards.count()) === 0) break;
    await cards.first().click();
    await page.getByRole('button', { name: 'Modifica budget', exact: true }).click();
    await page.getByRole('button', { name: 'Eliminare il budget?', exact: true }).click();
    const confirmation = page
      .getByRole('dialog')
      .filter({ has: page.getByRole('heading', { name: 'Eliminare il budget?', exact: true }) });
    await confirmation.getByRole('button', { name: 'Elimina', exact: true }).click();
    await expect(confirmation).toBeHidden();
    await page.goto('/it/budgets');
  }
  await expect(page.getByRole('link', { name: /Apri dettagli budget:/ })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Nuovo ciclo', exact: true })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Storico periodi', exact: true })).toBeVisible();
});
