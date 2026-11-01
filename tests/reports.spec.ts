import { test, expect } from './fixtures';

test.use({ viewport: { width: 390, height: 844 } });

test('shows the requested filter and pending feedback, then restores filters with browser history', async ({
  page,
}) => {
  await page.goto('/it/reports?preset=yearly');
  await expect(page.locator('#main-reports')).toBeVisible();
  let releaseRequest!: () => void;
  const gate = new Promise<void>((resolve) => {
    releaseRequest = resolve;
  });
  await page.route('**/it/reports?*', async (route) => {
    if (route.request().url().includes('preset=monthly')) await gate;
    await route.continue();
  });
  const monthly = page.getByRole('button', { name: 'Questo mese', exact: true });
  try {
    await monthly.click();
    await expect(monthly).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByText('Aggiornamento del rapporto…', { exact: true })).toBeVisible();
    await expect(page.locator('#main-reports')).toHaveAttribute('aria-busy', 'true');
    await page.screenshot({ path: test.info().outputPath('reports-pending-mobile.png') });
  } finally {
    releaseRequest();
  }
  await expect(page).toHaveURL(/preset=monthly/);
  await expect(page.locator('#main-reports')).not.toHaveAttribute('aria-busy', 'true');
  await page.goBack();
  await expect(page.getByRole('button', { name: '12 mesi', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
  await page.goForward();
  await expect(monthly).toHaveAttribute('aria-pressed', 'true');
});

test('offers last calendar year and opens empty dates in the current month', async ({ page }) => {
  await page.goto('/it/reports?preset=monthly');
  await page.getByRole('button', { name: 'Altro', exact: true }).click();
  await page.getByRole('button', { name: 'Anno scorso', exact: true }).click();
  await expect(page).toHaveURL(/preset=last_year/);
  const previousYear = new Date().getFullYear() - 1;
  await expect(page.getByRole('status').filter({ hasText: `${previousYear}` })).toContainText(
    `${previousYear}`
  );
  await page.getByRole('button', { name: 'Anno scorso', exact: true }).click();
  await page.getByRole('button', { name: 'Da: GG/MM/AAAA', exact: true }).click();
  const month = new Intl.DateTimeFormat('it', { month: 'long' }).format(new Date());
  await expect(page.getByRole('combobox', { name: 'Seleziona mese', exact: true })).toContainText(
    month
  );
});

test('shows custom dates and only fetches budget-period details after expansion', async ({
  page,
}) => {
  let detailRequests = 0;
  page.on('request', (request) => {
    if (request.headers()['next-action'] && request.postData()?.includes('2026-10-10'))
      detailRequests++;
  });
  await page.goto('/it/reports?preset=custom&customStart=2026-10-10&customEnd=2026-10-12');
  await expect(page.locator('#main-reports')).toBeVisible();
  const timeFilters = page.getByRole('group', { name: 'Periodo del rapporto', exact: true });
  await expect(timeFilters.getByRole('button', { pressed: true })).toContainText('2026');
  await expect(page.getByRole('status').filter({ hasText: /10.*12.*2026/ })).toContainText(
    /10.*12.*2026/
  );
  expect(detailRequests).toBe(0);
  await page.screenshot({ path: test.info().outputPath('reports-custom-mobile.png') });
  await page.locator('#main-reports summary').click();
  await expect.poll(() => detailRequests).toBe(1);
  await expect(
    page.getByText('Caricamento dei periodi budget…', { exact: true })
  ).not.toBeVisible();
  await expect(
    page.getByText('Periodi non disponibili. Riprova.', { exact: true })
  ).not.toBeVisible();
  await page.locator('#main-reports summary').click();
  await expect(page.locator('#main-reports details')).not.toHaveAttribute('open');
});

test('keeps report bounds on category drill-down and return', async ({ page }) => {
  await page.goto('/it/reports?preset=monthly');
  await page.getByRole('link', { name: /E2E Food/ }).click();
  await expect(page).toHaveURL(/\/transactions\?/);
  await expect(page).toHaveURL(/dateRange=custom/);
  await expect(page).toHaveURL(/category=e2e_food/);
  await expect(page).toHaveURL(/startDate=/);
  await page.goBack();
  await expect(page.getByRole('button', { name: 'Questo mese', exact: true })).toHaveAttribute(
    'aria-pressed',
    'true'
  );
});
