import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Account, User } from '@/lib/types';
import { useAccountsContent } from './use-accounts-content';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  openModal: vi.fn(),
  user: 'u2',
}));
vi.mock('@/i18n/routing', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('@/hooks', () => ({
  useUserFilter: () => ({ selectedUserId: mocks.user, setSelectedGroupFilter: vi.fn() }),
  usePermissions: ({ currentUser }: { currentUser: User }) => ({
    isMember: currentUser.role === 'member',
  }),
  useFilteredAccounts: ({
    accounts,
    selectedUserId,
  }: {
    accounts: Account[];
    selectedUserId?: string;
  }) => ({
    filteredAccounts: selectedUserId
      ? accounts.filter((account) => account.user_ids.includes(selectedUserId))
      : accounts,
  }),
}));
vi.mock('@/lib/navigation/url-state', () => ({
  useModalState: () => ({ openModal: mocks.openModal, modal: null }),
}));

const currentUser = { id: 'u1', role: 'admin' } as User;
const account = { id: 'a1', balance: -10, type: 'cash', user_ids: ['u1', 'u2'] } as Account;

describe('useAccountsContent navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.user = 'u2';
  });

  it('opens the account detail while preserving the selected person', () => {
    const { result } = renderHook(() => useAccountsContent({ currentUser, accounts: [account] }));
    act(() => result.current.handleOpenAccount(account));
    expect(mocks.push).toHaveBeenCalledWith('/accounts/a1?user=u2');
    expect(mocks.openModal).not.toHaveBeenCalled();
  });

  it('uses the signed-in member context even when another person is in the URL', () => {
    const { result } = renderHook(() =>
      useAccountsContent({ currentUser: { ...currentUser, role: 'member' }, accounts: [account] })
    );
    act(() => result.current.handleOpenAccount(account));
    expect(mocks.push).toHaveBeenCalledWith('/accounts/a1?user=u1');
  });
});
