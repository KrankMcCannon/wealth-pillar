import { describe, it, expect, vi } from 'vitest';
import { Suspense } from 'react';
import { render, screen, act } from '@testing-library/react';
import HomeContent from '../../../../app/[locale]/(dashboard)/home/home-content';
import type { DashboardPageData } from '@/server/use-cases/pages/dashboard.use-case';

vi.mock('next-intl', () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => 'en',
}));

vi.mock('@/i18n/routing', () => ({
  useRouter: () => ({ push: vi.fn() }),
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock('@/hooks', () => ({
  useUserFilter: () => ({
    selectedGroupFilter: 'all',
    selectedUserId: undefined,
    setSelectedGroupFilter: vi.fn(),
  }),
  usePermissions: () => ({ effectiveUserId: 'u1', isMember: true }),
}));

vi.mock('@/lib/navigation/url-state', () => ({
  useModalState: () => ({ openModal: vi.fn() }),
}));

vi.mock('@/hooks/use-page-header', () => ({
  usePageHeader: vi.fn(),
}));

vi.mock('@/components/layout', () => ({
  HomeDashboardMain: ({ children }: { children: React.ReactNode }) => (
    <main data-testid="home-main">{children}</main>
  ),
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

const adminUser = { ...currentUser, role: 'admin' };
const otherUser = { ...currentUser, id: 'u2', name: 'Sam', email: 'sam@example.com' };

const dashboardData: DashboardPageData = {
  accounts: [],
  recentActivityByScope: {
    all: [
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
        created_at: '2024-01-01',
        updated_at: '2024-01-01',
      },
    ],
    byUserId: {
      u1: [
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
          created_at: '2024-01-01',
          updated_at: '2024-01-01',
        },
      ],
    },
  },
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
};

async function renderHome(user: typeof currentUser, groupUsers: Array<typeof currentUser>) {
  const dashboardDataPromise = Promise.resolve(dashboardData);
  await act(async () => {
    render(
      <Suspense fallback={<div data-testid="loading" />}>
        <HomeContent
          currentUser={user as never}
          groupUsers={groupUsers as never}
          dashboardDataPromise={dashboardDataPromise}
        />
      </Suspense>
    );
  });
}

describe('HomeContent', () => {
  it('renders the briefing sections without a header user picker', async () => {
    await renderHome(currentUser, [currentUser]);

    expect(await screen.findByTestId('home-main')).toBeInTheDocument();
    expect(screen.getByText('spendableLabel')).toBeInTheDocument();
    expect(screen.getByText('spendableHint')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /spendableViewAll/ }).getAttribute('href')).toBe(
      '/accounts'
    );
    expect(screen.getAllByRole('heading').map((heading) => heading.textContent)).toEqual([
      'budgetTitle',
      'upcomingTitle',
      'recentActivityTitle',
    ]);
    expect(screen.queryByTestId('action-menu')).not.toBeInTheDocument();
    expect(screen.queryByRole('region', { name: 'contextLabel' })).not.toBeInTheDocument();
  });

  it('shows the shared user filter chips for an admin with multiple members', async () => {
    await renderHome(adminUser, [adminUser, otherUser]);

    expect(await screen.findByRole('region', { name: 'contextLabel' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: 'selectUserAria' })).toHaveLength(3);
    expect(screen.getByText('all')).toBeInTheDocument();
    expect(screen.getByText('Alex')).toBeInTheDocument();
    expect(screen.getByText('Sam')).toBeInTheDocument();
  });
});
