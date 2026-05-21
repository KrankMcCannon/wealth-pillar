import { test, expect } from '@playwright/test';

test.describe('settings modals (mobile)', () => {
  test.use({ viewport: { width: 375, height: 812 } });

  test('deep-link opens profile settings drawer', async ({ page }) => {
    await page.goto('/settings?modal=settings:profile');
    await expect(page.getByRole('dialog')).toBeVisible();
  });
});
