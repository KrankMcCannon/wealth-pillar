'use client';

import { use, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  BottomNavigation,
  PageContainer,
  Header,
  HomeDashboardMain,
  SkipToMainLink,
} from '@/components/layout';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui';
import { useDashboardContent } from '@/features/dashboard';
import UserSelector from '@/components/shared/user-selector';
import { BalanceSection } from '@/features/accounts';
import { BudgetSection } from '@/features/budgets';
import { RecurringSeriesSection } from '@/features/recurring';
import { RecentActivitySection } from '@/features/transactions';
import type { User } from '@/lib/types';
import type { DashboardPageData } from '@/server/use-cases/pages/dashboard.use-case';

const RECURRING_MAX_ITEMS = 5;
const RECENT_ACTIVITY_MAX = 5;

interface HomeContentProps {
  currentUser: User;
  groupUsers: User[];
  dashboardDataPromise: Promise<DashboardPageData>;
}

export default function HomeContent({
  currentUser,
  groupUsers,
  dashboardDataPromise,
}: HomeContentProps) {
  const dashboardData = use(dashboardDataPromise);
  const {
    accounts = [],
    accountBalances = {},
    budgetPeriods = {},
    recurringSeries = [],
    budgetsByUser = {},
    transactions = [],
    categories = [],
  } = dashboardData;

  const t = useTranslations('HomeContent');
  const [userPickerOpen, setUserPickerOpen] = useState(false);

  const headerCurrentUser = useMemo(
    () => ({
      ...(currentUser.name != null ? { name: currentUser.name } : {}),
      role: currentUser.role || 'member',
    }),
    [currentUser.name, currentUser.role]
  );

  const openUserPicker = useCallback(() => setUserPickerOpen(true), []);

  const {
    isMember,
    selectedGroupFilter,
    effectiveUserId,
    displayedDefaultAccounts,
    totalBalance,
    selectedUserId,
    handleCreateRecurringSeries,
    handleSeriesCardClick,
    handlePauseRecurringSeries,
  } = useDashboardContent({
    currentUser,
    groupUsers,
    accounts,
    accountBalances,
    budgetPeriods,
    recurringSeries,
  });

  const showUserPicker =
    (currentUser.role === 'admin' || currentUser.role === 'superadmin') && groupUsers.length > 1;

  const recurringSeriesUserId = selectedGroupFilter === 'all' ? undefined : effectiveUserId;
  const recurringFilterUserId = isMember ? currentUser.id : recurringSeriesUserId;

  const recentActivityUserId = isMember
    ? currentUser.id
    : selectedGroupFilter === 'all'
      ? undefined
      : effectiveUserId;

  const recentTransactions = useMemo(() => {
    const filtered = recentActivityUserId
      ? transactions.filter((tx) => tx.user_id === recentActivityUserId)
      : transactions;
    return [...filtered]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, RECENT_ACTIVITY_MAX);
  }, [transactions, recentActivityUserId]);

  return (
    <PageContainer>
      <SkipToMainLink href="#main-dashboard">{t('skipToContent')}</SkipToMainLink>

      <Header
        isDashboard
        currentUser={headerCurrentUser}
        {...(showUserPicker && { onAvatarClick: openUserPicker })}
      />

      {showUserPicker && (
        <Drawer open={userPickerOpen} onOpenChange={setUserPickerOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t('userPickerTitle')}</DrawerTitle>
            </DrawerHeader>
            <UserSelector
              currentUser={currentUser}
              users={groupUsers}
              hideTitle
              isLoading={false}
            />
          </DrawerContent>
        </Drawer>
      )}

      <HomeDashboardMain>
        <BalanceSection
          accounts={displayedDefaultAccounts}
          totalBalance={totalBalance}
          selectedUserId={selectedUserId}
          isLoading={false}
        />

        <BudgetSection
          budgetsByUser={budgetsByUser}
          selectedViewUserId={selectedUserId}
          isLoading={false}
        />

        <RecurringSeriesSection
          series={recurringSeries}
          selectedUserId={recurringFilterUserId}
          showStats={false}
          showActions={false}
          onCreateRecurringSeries={handleCreateRecurringSeries}
          onCardClick={handleSeriesCardClick}
          onPauseRecurringSeries={handlePauseRecurringSeries}
          homeDashboardListLayout
          maxItems={RECURRING_MAX_ITEMS}
        />

        <RecentActivitySection transactions={recentTransactions} categories={categories} />
      </HomeDashboardMain>

      <BottomNavigation />
    </PageContainer>
  );
}
