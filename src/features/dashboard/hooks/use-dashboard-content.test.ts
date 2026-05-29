import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useDashboardContent } from './use-dashboard-content';
import type { DashboardBalanceViewModel } from '@/server/use-cases/accounts/account.logic';

vi.mock('@/hooks', () => ({
  useUserFilter: () => ({ selectedGroupFilter: 'all', selectedUserId: undefined }),
  usePermissions: () => ({ effectiveUserId: 'u1', isMember: true }),
}));

vi.mock('@/lib/navigation/url-state', () => ({
  useModalState: () => ({ openModal: vi.fn() }),
}));

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const balanceViewModel: DashboardBalanceViewModel = {
  totalBalanceAll: 1000,
  spendableBalanceAll: 800,
  reserveBalanceAll: 200,
  totalBalanceByUserId: { u1: 1000 },
  spendableByUserId: { u1: 800 },
  reserveByUserId: { u1: 200 },
};

const currentUser = {
  id: 'u1',
  name: 'Alex',
  email: 'alex@example.com',
  role: 'member',
} as const;

describe('useDashboardContent', () => {
  it('returns only spendable and reserve balances (no totalBalance, no netSavings)', () => {
    const { result } = renderHook(() =>
      useDashboardContent({
        currentUser: currentUser as never,
        balanceViewModel,
      })
    );

    expect(result.current.spendableBalance).toBe(800);
    expect(result.current.reserveBalance).toBe(200);
    expect(result.current.isMember).toBe(true);
    expect(result.current).not.toHaveProperty('totalBalance');
    expect(result.current).not.toHaveProperty('netSavings');
    expect(result.current).not.toHaveProperty('displayedDefaultAccounts');
  });
});
