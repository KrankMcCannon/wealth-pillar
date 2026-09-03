'use client';

import { use, useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui';
import { HomeDashboardMain } from '@/components/layout';
import { usePageHeader } from '@/hooks/use-page-header';
import { useDashboardContent } from '@/features/dashboard';
import UserSelector from '@/components/shared/user-selector';
import { BalanceSection } from '@/features/accounts';
import { BudgetSection } from '@/features/budgets';
import { RecurringSeriesSection } from '@/features/recurring';
import { RecentActivitySection } from '@/features/transactions';
import type { User } from '@/lib/types';
import type { DashboardPageData } from '@/server/use-cases/pages/dashboard.use-case';

const RECURRING_MAX_ITEMS = 5;

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
    recurringSeries = [],
    budgetsByUser = {},
    recentActivityByScope,
    categories = [],
    balanceViewModel = {
      totalBalanceAll: 0,
      spendableBalanceAll: 0,
      reserveBalanceAll: 0,
      totalBalanceByUserId: {},
      spendableByUserId: {},
      reserveByUserId: {},
    },
  } = dashboardData;

  const t = useTranslations('HomeContent');
  const [userPickerOpen, setUserPickerOpen] = useState(false);

  const openUserPicker = useCallback(() => setUserPickerOpen(true), []);

  const {
    isMember,
    selectedGroupFilter,
    effectiveUserId,
    spendableBalance,
    reserveBalance,
    selectedUserId,
    handleCreateRecurringSeries,
    handleOpenRecurringTab,
  } = useDashboardContent({
    currentUser,
    balanceViewModel,
  });

  const showUserPicker =
    (currentUser.role === 'admin' || currentUser.role === 'superadmin') && groupUsers.length > 1;

  usePageHeader({
    isDashboard: true,
    ...(showUserPicker ? { onAvatarClick: openUserPicker } : {}),
  });

  const recurringSeriesUserId = selectedGroupFilter === 'all' ? undefined : effectiveUserId;
  const recurringFilterUserId = isMember ? currentUser.id : recurringSeriesUserId;

  const recentActivityUserId = isMember
    ? currentUser.id
    : selectedGroupFilter === 'all'
      ? undefined
      : effectiveUserId;

  const recentTransactions = useMemo(() => {
    if (recentActivityUserId) {
      return recentActivityByScope.byUserId[recentActivityUserId] ?? [];
    }
    return recentActivityByScope.all;
  }, [recentActivityByScope, recentActivityUserId]);

  return (
    <>
      {showUserPicker ? (
        <Drawer open={userPickerOpen} onOpenChange={setUserPickerOpen}>
          <DrawerContent>
            <DrawerHeader>
              <DrawerTitle>{t('userPickerTitle')}</DrawerTitle>
              <DrawerDescription className="sr-only">
                {t('userPickerDescription')}
              </DrawerDescription>
            </DrawerHeader>
            <UserSelector currentUser={currentUser} users={groupUsers} hideTitle />
          </DrawerContent>
        </Drawer>
      ) : null}
      <HomeDashboardMain>
        <BalanceSection
          spendableBalance={spendableBalance}
          reserveBalance={reserveBalance}
          selectedUserId={selectedUserId}
        />

        <BudgetSection
          budgetsByUser={budgetsByUser}
          selectedViewUserId={isMember ? currentUser.id : selectedUserId}
        />

        <RecurringSeriesSection
          series={recurringSeries}
          selectedUserId={recurringFilterUserId}
          showStats={false}
          onCreateRecurringSeries={handleCreateRecurringSeries}
          onCardClick={handleOpenRecurringTab}
          homeDashboardListLayout
          maxItems={RECURRING_MAX_ITEMS}
        />

        <RecentActivitySection transactions={recentTransactions} categories={categories} />
      </HomeDashboardMain>
    </>
  );
}
