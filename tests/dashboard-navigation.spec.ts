import { test, expect } from './fixtures';
import { readFixture } from './e2e-environment';

test.describe('Dashboard navigation', () => {
  test('opens account activity, filtered history and the existing edit form while preserving the member', async ({
    page,
  }) => {
    const fixture = readFixture();
    await page.goto(`/it/accounts?user=${fixture.userId}`);
    await page.getByTestId(`account-card-${fixture.accountId}`).click();
    await expect(page).toHaveURL(
      new RegExp(`/accounts/${fixture.accountId}\\?user=${fixture.userId}`)
    );
    await expect(
      page.getByRole('heading', { name: 'Ultimi movimenti', exact: true })
    ).toBeVisible();
    await expect(
      page.locator('#main-account-detail').getByText('E2E Seed', { exact: false }).first()
    ).toBeVisible();

    await page.getByRole('button', { name: 'Modifica conto', exact: true }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();

    await page.getByRole('link', { name: 'Vedi tutti i movimenti', exact: true }).click();
    await expect(page).toHaveURL(/\/transactions\?/);
    const ledgerUrl = new URL(page.url());
    expect(ledgerUrl.searchParams.get('account')).toBe(fixture.accountId);
    expect(ledgerUrl.searchParams.get('user')).toBe(fixture.userId);
    await page.goBack();
    await expect(page.locator('#main-account-detail')).toBeVisible();
    await page.goBack();
    await expect(page).toHaveURL(new RegExp(`/accounts\\?user=${fixture.userId}`));
  });

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
