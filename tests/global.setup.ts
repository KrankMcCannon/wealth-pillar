import { clerkSetup } from '@clerk/testing/playwright';
import { test as setup } from '@playwright/test';

/**
 * Fetches Clerk testing token for E2E (requires CLERK_SECRET_KEY in env).
 * Skips when credentials are absent so local runs without Clerk dev keys still work.
 */
setup('clerk global setup', async () => {
  if (!process.env.CLERK_SECRET_KEY) {
    console.warn('[global.setup] CLERK_SECRET_KEY not set — skipping clerkSetup');
    return;
  }
  await clerkSetup();
});
