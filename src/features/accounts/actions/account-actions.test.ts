import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  updateAccountAction,
  deleteAccountAction,
  recalculateAccountBalanceAction,
  createAccountAction,
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
  createAccountUseCase: vi.fn(),
}));

import { getCurrentUser } from '@/lib/auth/cached-auth';
import {
  getAccountByIdUseCase,
  updateAccountUseCase,
  deleteAccountUseCase,
  recalculateAccountBalanceUseCase,
  createAccountUseCase,
} from '@/server/use-cases/accounts/account.use-cases';
import { UsersRepository } from '@/server/repositories/users.repository';

vi.mock('@/server/repositories/users.repository', () => ({
  UsersRepository: { findByIds: vi.fn() },
}));

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

describe('account group authorization', () => {
  const input = { name: 'Main', type: 'payroll' as const, user_ids: ['member-1'], group_id: 'g1' };
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getCurrentUser).mockResolvedValue({ ...member, role: 'admin' });
    vi.mocked(getAccountByIdUseCase).mockResolvedValue(otherAccount);
    vi.mocked(UsersRepository.findByIds).mockResolvedValue([
      { id: 'member-1', group_id: 'g1' },
    ] as Awaited<ReturnType<typeof UsersRepository.findByIds>>);
  });

  it('rejects account creation in another group', async () => {
    expect((await createAccountAction({ ...input, group_id: 'g2' })).error).toBe('Permesso negato');
    expect(createAccountUseCase).not.toHaveBeenCalled();
  });

  it('rejects account owners belonging to another group, including for admins', async () => {
    vi.mocked(UsersRepository.findByIds).mockResolvedValue([
      { id: 'member-1', group_id: 'g2' },
    ] as Awaited<ReturnType<typeof UsersRepository.findByIds>>);
    expect((await createAccountAction(input)).error).toBe('Permesso negato');
    expect((await updateAccountAction('a2', { user_ids: ['member-1'] })).error).toBe(
      'Permesso negato'
    );
    expect(createAccountUseCase).not.toHaveBeenCalled();
    expect(updateAccountUseCase).not.toHaveBeenCalled();
  });

  it('rejects group changes in an untyped update payload', async () => {
    expect(
      (
        await updateAccountAction('a2', { name: 'Move', group_id: 'g2' } as Parameters<
          typeof updateAccountAction
        >[1])
      ).error
    ).toBe('Permesso negato');
    expect(updateAccountUseCase).not.toHaveBeenCalled();
  });

  it('allows valid creation for a member of the group', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(member);
    vi.mocked(createAccountUseCase).mockResolvedValue({ ...otherAccount, user_ids: ['member-1'] });
    expect((await createAccountAction(input)).error).toBeNull();
    expect(createAccountUseCase).toHaveBeenCalledWith(input);
  });
});
