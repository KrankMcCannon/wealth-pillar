import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateAccountAction,
  deleteAccountAction,
  recalculateAccountBalanceAction,
} from './account-actions';
import type { Account, User } from '@/lib/types';

vi.mock('next-intl/server', () => ({
  getTranslations: vi.fn(async () => (key: string) => key),
}));

vi.mock('@/lib/auth/cached-auth', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/server/use-cases/accounts/account.use-cases', () => ({
  getAccountByIdUseCase: vi.fn(),
  updateAccountUseCase: vi.fn(),
  deleteAccountUseCase: vi.fn(),
  recalculateAccountBalanceUseCase: vi.fn(),
}));

import { getCurrentUser } from '@/lib/auth/cached-auth';
import {
  getAccountByIdUseCase,
  updateAccountUseCase,
  deleteAccountUseCase,
  recalculateAccountBalanceUseCase,
} from '@/server/use-cases/accounts/account.use-cases';

const member = {
  id: 'member-1',
  name: 'Member',
  email: 'member@example.com',
  role: 'member',
  group_id: 'g1',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
} as User;

const otherAccount: Account = {
  id: 'a2',
  name: 'Other',
  type: 'payroll',
  user_ids: ['member-2'],
  group_id: 'g1',
  balance: 500,
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

describe('account-actions member access', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue(member);
    vi.mocked(getAccountByIdUseCase).mockResolvedValue(otherAccount);
  });

  it('updateAccountAction denies member updating another user account', async () => {
    const result = await updateAccountAction('a2', { name: 'Hacked' });

    expect(result.data).toBeNull();
    expect(result.error).toBe('errors.noPermissionUpdate');
    expect(updateAccountUseCase).not.toHaveBeenCalled();
  });

  it('deleteAccountAction denies member deleting another user account', async () => {
    const result = await deleteAccountAction('a2');

    expect(result.data).toBeNull();
    expect(result.error).toBe('errors.noPermissionDelete');
    expect(deleteAccountUseCase).not.toHaveBeenCalled();
  });

  it('recalculateAccountBalanceAction denies member recalculating another user account', async () => {
    const result = await recalculateAccountBalanceAction('a2');

    expect(result.data).toBeNull();
    expect(result.error).toBe('errors.noPermissionUpdate');
    expect(recalculateAccountBalanceUseCase).not.toHaveBeenCalled();
  });
});
