import { test as setup } from '@playwright/test';

/**
 * Global setup for Playwright tests
 *
 * Note: Clerk authentication is now mocked via route interception
 * in tests/mocks/clerk-mock.ts. No global setup required.
 */
setup('global setup', async ({}) => {
  // No-op: Clerk mocks are applied per-test via setupClerkMocks()
  console.warn('Playwright global setup complete');
});
