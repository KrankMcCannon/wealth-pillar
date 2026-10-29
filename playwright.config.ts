import { defineConfig, devices } from '@playwright/test';
import { authFile, e2eBaseURL } from './tests/e2e-environment';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  testIgnore: '**/integration/**',
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  ...(process.env.CI ? { workers: 1 as const } : {}),
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.E2E_COVERAGE
    ? [
        ['html'],
        [
          'monocart-reporter',
          {
            name: 'E2E Coverage Report',
            outputFile: './coverage/e2e/index.html',
            coverage: {
              enable: true,
              reportDir: './coverage/e2e',
            },
          },
        ],
      ]
    : 'html',

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: e2eBaseURL,

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    // Global setup for Clerk authentication
    {
      name: 'setup',
      teardown: 'cleanup',
      testMatch: /global\.setup\.ts/,
    },

    { name: 'cleanup', testMatch: /global\.teardown\.ts/ },

    {
      name: 'chromium',
      use: { storageState: authFile, ...devices['Desktop Chrome'] },
      dependencies: ['setup'],
    },

    {
      name: 'firefox',
      use: { storageState: authFile, ...devices['Desktop Firefox'] },
      dependencies: ['setup'],
    },

    {
      name: 'webkit',
      use: { storageState: authFile, ...devices['Desktop Safari'] },
      dependencies: ['setup'],
    },

    /* Test against mobile viewports. */
    {
      name: 'Mobile Chrome',
      use: { storageState: authFile, ...devices['Pixel 5'] },
      dependencies: ['setup'],
    },
    {
      name: 'Mobile Safari',
      use: { storageState: authFile, ...devices['iPhone 12'] },
      dependencies: ['setup'],
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { storageState: authFile, ...devices['Desktop Edge'], channel: 'msedge' },
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { storageState: authFile, ...devices['Desktop Chrome'], channel: 'chrome' },
    //   dependencies: ['setup'],
    // },
  ],

  /* Run your local dev server before starting the tests.
   */
  webServer: {
    command: 'pnpm build && pnpm exec next start --hostname localhost --port 3100',
    wait: { stdout: /Ready in/ },
    env: {
      DATABASE_URL: process.env.DATABASE_URL || 'postgres://127.0.0.1/wealth_pillar_e2e',
      NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '',
      CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY || '',
    },
    reuseExistingServer: false,
    timeout: 180000,
  },
});
