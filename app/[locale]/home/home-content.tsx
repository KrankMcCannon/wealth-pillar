'use client';

import { use, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { AppPage, ActionMenu } from '@/components/layout';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui';
import { useDashboardContent } from '@/features/dashboard';
import UserSelector from '@/components/shared/user-selector';
import { BalanceSection } from '@/features/accounts';
import { BudgetSection } from '@/features/budgets';
import { RecurringSeriesSection } from '@/features/recurring';
import { RecentActivitySection } from '@/features/transactions';
import type { User } from '@/lib/types';
import type { DashboardPageData } from '@/server/use-cases/pages/dashboard.use-case';
import { stitchHome, stitchFab } from '@/styles/home-design-foundation';

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
    balanceViewModel = { totalBalanceAll: 0, totalBalanceByUserId: {} },
  } = dashboardData;

  const t = useTranslations('HomeContent');
  const tBottomNav = useTranslations('BottomNav');
  const [userPickerOpen, setUserPickerOpen] = useState(false);

  const openUserPicker = useCallback(() => setUserPickerOpen(true), []);

  const {
    isMember,
    selectedGroupFilter,
    effectiveUserId,
    displayedDefaultAccounts,
    totalBalance,
    selectedUserId,
    handleCreateRecurringSeries,
    handleOpenRecurringTab,
  } = useDashboardContent({
    currentUser,
    groupUsers,
    accounts,
    accountBalances,
    budgetPeriods,
    recurringSeries,
    balanceViewModel,
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
    return filtered.slice(0, RECENT_ACTIVITY_MAX);
  }, [transactions, recentActivityUserId]);

  return (
    <AppPage
      currentUser={currentUser}
      isDashboard
      skipToMainHref="#main-dashboard"
      skipToMainLabel={t('skipToContent')}
      {...(showUserPicker ? { onAvatarClick: openUserPicker } : {})}
      dashboardMain
      afterMain={
        <ActionMenu
          triggerClassName={stitchHome.fab}
          triggerIconClassName={stitchFab.pageAddIcon}
          groupedSecondary
          align="center"
          triggerAriaLabel={tBottomNav('add')}
        />
      }
      beforeMain={
        showUserPicker ? (
          <Drawer open={userPickerOpen} onOpenChange={setUserPickerOpen}>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle>{t('userPickerTitle')}</DrawerTitle>
                <DrawerDescription className="sr-only">
                  {t('userPickerDescription')}
                </DrawerDescription>
              </DrawerHeader>
              <UserSelector
                currentUser={currentUser}
                users={groupUsers}
                hideTitle
                isLoading={false}
              />
            </DrawerContent>
          </Drawer>
        ) : undefined
      }
    >
      <BalanceSection
        accounts={displayedDefaultAccounts}
        totalBalance={totalBalance}
        selectedUserId={selectedUserId}
      />

      <BudgetSection budgetsByUser={budgetsByUser} selectedViewUserId={selectedUserId} />

      <RecurringSeriesSection
        series={recurringSeries}
        selectedUserId={recurringFilterUserId}
        showStats={false}
        showActions={false}
        onCreateRecurringSeries={handleCreateRecurringSeries}
        onCardClick={handleOpenRecurringTab}
        homeDashboardListLayout
        maxItems={RECURRING_MAX_ITEMS}
      />

      <RecentActivitySection transactions={recentTransactions} categories={categories} />
    </AppPage>
  );
}
