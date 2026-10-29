import { test, expect } from './fixtures';

test('switches investment tabs and updates their selected state and URL', async ({ page }) => {
  await page.goto('/it/investments');
  const sandbox = page.getByRole('tab', { name: 'Simulazione', exact: true });
  await sandbox.click();
  await expect(page).toHaveURL(/tab=sandbox/);
  await expect(sandbox).toHaveAttribute('aria-selected', 'true');
  const personal = page.getByRole('tab', { name: 'Investimenti', exact: true });
  await personal.click();
  await expect(personal).toHaveAttribute('aria-selected', 'true');
  await expect(sandbox).toHaveAttribute('aria-selected', 'false');
});

test('shows the empty holdings state and opens the investment modal', async ({ page }) => {
  await page.goto('/it/investments');
  await expect(
    page.getByRole('heading', { name: 'Le tue partecipazioni', exact: true })
  ).toBeVisible();
  await expect(page.getByRole('status')).toContainText('Nessun investimento');
  await page.getByTestId('investments-fab-add').click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await expect(page).toHaveURL(/modal=investment/);
});
