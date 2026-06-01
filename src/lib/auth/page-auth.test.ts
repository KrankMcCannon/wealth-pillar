import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { User } from '@/lib/types';

const redirectMock = vi.fn((url: string) => {
  throw new Error(`REDIRECT:${url}`);
});

vi.mock('next/navigation', () => ({
  redirect: (url: string) => redirectMock(url),
}));

const getCurrentUserMock = vi.fn();
const getAuthMock = vi.fn();
const getGroupUsersMock = vi.fn();

vi.mock('./cached-auth', () => ({
  getCurrentUser: () => getCurrentUserMock(),
  getAuth: () => getAuthMock(),
  getGroupUsers: () => getGroupUsersMock(),
}));

import { requirePageAuth } from './page-auth';

const completeUser = {
  id: 'u1',
  group_id: 'g1',
} as User;

describe('requirePageAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    getGroupUsersMock.mockResolvedValue([completeUser]);
  });

  it('redirects to sign-in when there is no session and no user', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    getAuthMock.mockResolvedValue({ userId: null });

    await expect(requirePageAuth(Promise.resolve({ locale: 'it' }))).rejects.toThrow(
      'REDIRECT:/it/sign-in'
    );
  });

  it('redirects to onboarding when session exists but user profile is missing', async () => {
    getCurrentUserMock.mockResolvedValue(null);
    getAuthMock.mockResolvedValue({ userId: 'clerk_1' });

    await expect(requirePageAuth(Promise.resolve({ locale: 'it' }))).rejects.toThrow(
      'REDIRECT:/it/onboarding'
    );
  });

  it('redirects to onboarding when user has no group', async () => {
    getCurrentUserMock.mockResolvedValue({ id: 'u1', group_id: null } as User);

    await expect(requirePageAuth(Promise.resolve({ locale: 'it' }))).rejects.toThrow(
      'REDIRECT:/it/onboarding'
    );
  });

  it('returns user and group users when onboarding is complete', async () => {
    getCurrentUserMock.mockResolvedValue(completeUser);

    const result = await requirePageAuth(Promise.resolve({ locale: 'it' }));

    expect(result).toEqual({
      locale: 'it',
      currentUser: completeUser,
      groupUsers: [completeUser],
    });
  });
});
