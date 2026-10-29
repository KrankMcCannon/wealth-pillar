import { readFileSync, existsSync } from 'node:fs';
import { config } from 'dotenv';

// Deliberately separate from the app's .env, which may point at real household data.
config({ path: '.env.e2e', quiet: true });
export const authFile = 'playwright/.auth/user.json';
export const fixtureFile = 'playwright/.auth/fixture.json';
export const e2eBaseURL = 'http://localhost:3100';
export function requireE2EEnvironment() {
  const url = new URL(process.env.DATABASE_URL || 'postgres://invalid/invalid');
  if (
    !['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) ||
    url.pathname !== '/wealth_pillar_e2e'
  )
    throw new Error('E2E requires a local PostgreSQL database named wealth_pillar_e2e in .env.e2e');
  if (
    !process.env.CLERK_SECRET_KEY?.startsWith('sk_test_') ||
    !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.startsWith('pk_test_')
  )
    throw new Error('E2E requires Clerk development keys in .env.e2e');
  if (!process.env.E2E_USER_EMAIL)
    throw new Error('Set E2E_USER_EMAIL to a dedicated existing Clerk test user');
}
export function readFixture(): {
  groupId: string;
  userId: string;
  accountId: string;
  email: string;
} {
  if (!existsSync(fixtureFile)) throw new Error('E2E setup did not produce a seeded fixture');
  return JSON.parse(readFileSync(fixtureFile, 'utf8'));
}
