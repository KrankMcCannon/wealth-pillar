import { describe, it, expect, vi, beforeEach } from 'vitest';
import { redirect } from 'next/navigation';
import { resolvePageContext } from '@/lib/auth/page-auth';

vi.mock('next/navigation', () => ({
  redirect: vi.fn((path: string) => {
    throw new Error(`REDIRECT:${path}`);
  }),
}));

vi.mock('next-intl/server', () => ({
  getTranslations: async () => (key: string) => key,
}));

vi.mock('@/lib/auth/cached-auth', () => ({
  getCurrentUser: vi.fn(),
  getGroupUsers: vi.fn(),
  getAuth: vi.fn(),
}));

vi.mock('@/lib/auth/clerk-session', () => ({
  isOnboardingComplete: vi.fn(() => true),
}));

vi.mock('@/lib/utils/with-timeout', () => ({
  withTimeout: async <T>(promise: Promise<T>, _ms: number, fallback: T) =>
    promise.catch(() => fallback),
}));

vi.mock('@/lib/utils/permissions', () => ({
  getSelectableUsers: (_user: unknown, users: unknown[]) => users,
}));

import { getCurrentUser, getGroupUsers } from '@/lib/auth/cached-auth';

const mockUser = {
  id: 'u1',
  name: 'Alex',
  email: 'alex@example.com',
  role: 'member',
  group_id: 'g1',
};

describe('resolvePageContext', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns auth context with group id', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(mockUser as never);
    vi.mocked(getGroupUsers).mockResolvedValue([mockUser] as never);

    const result = await resolvePageContext(Promise.resolve({ locale: 'it' }));

    expect(result).toMatchObject({
      locale: 'it',
      currentUser: mockUser,
      groupId: 'g1',
    });
  });

  it('redirects when user is missing', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null);

    await expect(resolvePageContext(Promise.resolve({ locale: 'it' }))).rejects.toThrow(
      'REDIRECT:/it/sign-in'
    );
    expect(redirect).toHaveBeenCalledWith('/it/sign-in');
  });
});
