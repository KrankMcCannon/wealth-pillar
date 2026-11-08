import { defineConfig } from '@playwright/test';
import config from './playwright.config';

// Reuse real Clerk setup, disposable PostgreSQL, build and cleanup from the full suite.
export default defineConfig({
  ...config,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: 'line',
  projects: [
    ...config.projects!.filter((project) => ['setup', 'cleanup'].includes(project.name!)),
    {
      ...config.projects!.find((project) => project.name === 'chromium')!,
      name: 'smoke',
      testMatch: ['dashboard-navigation.spec.ts', 'transactions.spec.ts', 'modals.spec.ts'],
      grep: /keeps bottom navigation mounted|creates a transaction and keeps it|updates its own transaction|opens notification import/,
    },
  ],
});
