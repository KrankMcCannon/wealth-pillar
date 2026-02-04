import { Page } from '@playwright/test';

/**
 * Mock Clerk Authentication for Playwright E2E Tests
 *
 * This module provides route-based mocking for Clerk authentication,
 * similar to jest.mock() but for Playwright. It intercepts Clerk API
 * requests and returns mocked responses.
 */

export interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  imageUrl?: string;
}

const DEFAULT_MOCK_USER: MockUser = {
  id: 'user_2sSlXyZ', // Random Clerk ID format since it doesn't match UUID
  email: 'ex@mple.com',
  firstName: 'E2E',
  lastName: 'Admin Test',
  imageUrl: 'https://via.placeholder.com/150',
  // Supabase ID: 487d9942-bd17-45e3-9f8e-da1b95ce4689
};

/**
 * Mock Clerk session response
 */
function createMockSession(user: MockUser) {
  return {
    object: 'session',
    id: 'sess_e2e_test_12345',
    status: 'active',
    expire_at: Date.now() + 86400000, // 24 hours from now
    abandon_at: Date.now() + 604800000, // 7 days from now
    last_active_at: Date.now(),
    last_active_organization_id: null,
    actor: null,
    user: {
      object: 'user',
      id: user.id,
      external_id: null,
      primary_email_address_id: 'idn_e2e_test_email',
      primary_phone_number_id: null,
      primary_web3_wallet_id: null,
      username: null,
      first_name: user.firstName,
      last_name: user.lastName,
      profile_image_url: user.imageUrl || '',
      image_url: user.imageUrl || '',
      has_image: !!user.imageUrl,
      public_metadata: {},
      private_metadata: {},
      unsafe_metadata: {},
      email_addresses: [
        {
          object: 'email_address',
          id: 'idn_e2e_test_email',
          email_address: user.email,
          verification: {
            status: 'verified',
            strategy: 'from_oauth_google',
          },
          linked_to: [],
        },
      ],
      phone_numbers: [],
      web3_wallets: [],
      external_accounts: [],
      created_at: Date.now() - 86400000,
      updated_at: Date.now(),
      last_sign_in_at: Date.now(),
      banned: false,
      locked: false,
      lockout_expires_in_seconds: null,
      verification_attempts_remaining: 100,
      delete_self_enabled: true,
      create_organization_enabled: true,
      two_factor_enabled: false,
      totp_enabled: false,
      backup_code_enabled: false,
    },
    public_user_data: {
      first_name: user.firstName,
      last_name: user.lastName,
      profile_image_url: user.imageUrl || '',
      image_url: user.imageUrl || '',
      has_image: !!user.imageUrl,
      identifier: user.email,
    },
    created_at: Date.now() - 3600000,
    updated_at: Date.now(),
  };
}

/**
 * Mock Clerk client response
 */
function createMockClient(user: MockUser) {
  const session = createMockSession(user);
  return {
    object: 'client',
    id: 'client_e2e_test_12345',
    sessions: [session],
    sign_in: null,
    sign_up: null,
    last_active_session_id: session.id,
    created_at: Date.now() - 86400000,
    updated_at: Date.now(),
  };
}

/**
 * Setup Clerk mocks for a Playwright page
 *
 * This intercepts all Clerk API requests and returns mocked responses,
 * allowing tests to run without actual Clerk authentication.
 *
 * @param page - Playwright page instance
 * @param user - Optional mock user data (uses default if not provided)
 *
 * @example
 * ```typescript
 * test.beforeEach(async ({ page }) => {
 *   await setupClerkMocks(page);
 * });
 * ```
 */
export async function setupClerkMocks(page: Page, user: MockUser = DEFAULT_MOCK_USER) {
  const mockClient = createMockClient(user);
  const mockSession = createMockSession(user);

  // Mock Clerk API endpoints
  await page.route('**/*clerk*/**', async (route) => {
    const url = route.request().url();

    // Client endpoint - returns current session info
    if (url.includes('/v1/client')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClient),
      });
      return;
    }

    // Session endpoint
    if (url.includes('/v1/sessions')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSession),
      });
      return;
    }

    // User endpoint
    if (url.includes('/v1/me') || url.includes('/v1/users')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockSession.user),
      });
      return;
    }

    // Touch endpoint (keep-alive)
    if (url.includes('/v1/client/touch')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(mockClient),
      });
      return;
    }

    // Environment/config endpoint
    if (url.includes('/v1/environment')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          auth_config: {
            single_session_mode: true,
          },
          display_config: {
            application_name: 'Wealth Pillar',
          },
          user_settings: {
            sign_in: {
              second_factor: {
                required: false,
              },
            },
          },
        }),
      });
      return;
    }

    // For any other Clerk requests, return success
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true }),
    });
  });

  // Set Clerk cookies to simulate authenticated state
  await page.context().addCookies([
    {
      name: '__client_uat',
      value: String(Date.now()),
      domain: 'localhost',
      path: '/',
    },
    {
      name: '__session',
      value: 'mock_session_token_e2e_test',
      domain: 'localhost',
      path: '/',
    },
  ]);
}

/**
 * Clear Clerk mocks and cookies
 */
export async function clearClerkMocks(page: Page) {
  await page.unrouteAll({ behavior: 'ignoreErrors' });
  await page.context().clearCookies();
}

/**
 * Create a custom mock user
 */
export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
  return { ...DEFAULT_MOCK_USER, ...overrides };
}
