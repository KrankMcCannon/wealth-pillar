import { mkdir, writeFile } from 'node:fs/promises';
import { clerk, clerkSetup, setupClerkTestingToken } from '@clerk/testing/playwright';
import { createClerkClient } from '@clerk/nextjs/server';
import { test as setup, expect } from '@playwright/test';
import { authFile, fixtureFile, requireE2EEnvironment } from './e2e-environment';
import { seedE2EDatabase } from './e2e-database';

setup('seed local data and authenticate a real Clerk session', async ({ page }) => {
  requireE2EEnvironment();
  const email = process.env.E2E_USER_EMAIL!;
  const client = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
  const { data } = await client.users.getUserList({ emailAddress: [email] });
  if (data.length !== 1)
    throw new Error('E2E_USER_EMAIL must identify an existing Clerk development user');
  await clerkSetup({ publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY! });
  const fixture = await seedE2EDatabase(data[0]!.id, email);
  await mkdir('playwright/.auth', { recursive: true });
  await writeFile(fixtureFile, JSON.stringify(fixture));
  await setupClerkTestingToken({ page });
  await page.goto('/it/sign-in');
  await clerk.signIn({ page, emailAddress: email });
  await page.goto('/it/home');
  await expect(page.getByRole('navigation').filter({ hasText: 'Home' })).toBeVisible();
  await page.context().storageState({ path: authFile });
});
