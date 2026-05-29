import { describe, it, expect, vi } from 'vitest';
import { Suspense } from 'react';
import { render, screen, act } from '@testing-library/react';
import HomeContent from '../../../../app/[locale]/home/home-content';
import type { DashboardPageData } from '@/server/use-cases/pages/dashboard.use-case';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

vi.mock('@/hooks', () => ({
  useUserFilter: () => ({ selectedGroupFilter: 'all', selectedUserId: undefined }),
  usePermissions: () => ({ effectiveUserId: 'u1', isMember: true }),
}));

vi.mock('@/lib/navigation/url-state', () => ({
  useModalState: () => ({ openModal: vi.fn() }),
}));

vi.mock('@/components/layout', () => ({
  AppPage: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="app-page">{children}</div>
  ),
  ActionMenu: () => <div data-testid="action-menu" />,
}));

vi.mock('@/components/ui', () => ({
  Drawer: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DrawerDescription: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('@/components/shared/user-selector', () => ({
  default: () => <div data-testid="user-selector" />,
}));

vi.mock('@/features/accounts', () => ({
  BalanceSection: () => <section data-testid="balance-section" />,
}));

vi.mock('@/features/budgets', () => ({
  BudgetSection: () => <section data-testid="budget-section" />,
}));

vi.mock('@/features/recurring', () => ({
  RecurringSeriesSection: () => <section data-testid="recurring-section" />,
}));

vi.mock('@/features/transactions', () => ({
  RecentActivitySection: () => <section data-testid="recent-activity-section" />,
}));

const currentUser = {
  id: 'u1',
  name: 'Alex',
  email: 'alex@example.com',
  role: 'member',
  group_id: 'g1',
  created_at: '2024-01-01',
  updated_at: '2024-01-01',
};

const dashboardData: DashboardPageData = {
  accounts: [],
  transactions: [
    {
      id: 'tx1',
      user_id: 'u1',
      group_id: 'g1',
      amount: -10,
      category: 'food',
      date: '2024-06-01',
      type: 'expense',
      account_id: 'a1',
      description: 'Lunch',
      created_at: '2024-06-01',
      updated_at: '2024-06-01',
    },
  ],
  budgetPeriods: { u1: null },
  recurringSeries: [],
  categories: [],
  accountBalances: {},
  budgetsByUser: {},
  balanceViewModel: {
    totalBalanceAll: 0,
    spendableBalanceAll: 0,
    reserveBalanceAll: 0,
    totalBalanceByUserId: {},
    spendableByUserId: {},
    reserveByUserId: {},
  },
  netSavingsAll: { deposits: 0, withdrawals: 0, net: 0 },
  netSavingsByUserId: {},
};

describe('HomeContent', () => {
  it('renders all four home sections', async () => {
    const dashboardDataPromise = Promise.resolve(dashboardData);
    await act(async () => {
      render(
        <Suspense fallback={<div data-testid="loading" />}>
          <HomeContent
            currentUser={currentUser as never}
            groupUsers={[currentUser as never]}
            dashboardDataPromise={dashboardDataPromise}
          />
        </Suspense>
      );
    });

    expect(await screen.findByTestId('app-page')).toBeInTheDocument();
    expect(screen.getByTestId('balance-section')).toBeInTheDocument();
    expect(screen.getByTestId('budget-section')).toBeInTheDocument();
    expect(screen.getByTestId('recurring-section')).toBeInTheDocument();
    expect(screen.getByTestId('recent-activity-section')).toBeInTheDocument();
  });
});
