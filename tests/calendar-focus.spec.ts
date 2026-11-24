import { test, expect } from './fixtures';

test.use({ viewport: { width: 320, height: 740 } });

async function verifyCalendarFocus(
  page: import('@playwright/test').Page,
  trigger: ReturnType<import('@playwright/test').Page['getByRole']>
) {
  await trigger.click();
  const dialog = page.getByTestId('date-field-calendar');
  await expect(dialog).toBeVisible();
  for (const key of ['Tab', 'Shift+Tab'] as const) {
    await page.keyboard.press(key);
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();

  await trigger.click();
  await expect(dialog).toBeVisible();
  await page.getByTestId('calendar-overlay').click({ position: { x: 2, y: 2 } });
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth))
    .toBe(true);
}

test('contains calendar focus at 320px on Transactions and Reports', async ({ page }) => {
  await page.goto('/it/transactions');
  await page.getByRole('button', { name: 'Filtri', exact: true }).click();
  await page.getByRole('radio', { name: 'Personalizzato', exact: true }).click();
  await verifyCalendarFocus(page, page.getByRole('button', { name: /^Da/ }));

  await page.goto('/it/reports?preset=monthly');
  await page.getByRole('button', { name: 'Altro', exact: true }).click();
  await verifyCalendarFocus(page, page.getByRole('button', { name: /^Da/ }));
});
