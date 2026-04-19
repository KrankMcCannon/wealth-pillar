'use client';

/**
 * Home Content - Client Component
 *
 * Dashboard: header, filtro utenti, saldi, budget, ricorrenze (un solo mount),
 * bottom navigation. Dati dal Server Component; logica in useDashboardContent.
 */

import { use } from 'react';
import { useTranslations } from 'next-intl';
import {
  BottomNavigation,
  PageContainer,
  Header,
  HomeDashboardGrid,
  HomeDashboardMain,
  SkipToMainLink,
} from '@/components/layout';
import { homeDashboardLayoutStyles } from '@/components/layout/theme/home-dashboard-layout-styles';
import { Button } from '@/components/ui';
import { dashboardStyles, useDashboardContent } from '@/features/dashboard';
import UserSelector from '@/components/shared/user-selector';
import { BalanceSection } from '@/features/accounts';
import { BudgetPeriodManager, BudgetSection } from '@/features/budgets';
import { RecurringSeriesSection } from '@/features/recurring';
import { useMediaQuery } from '@/hooks/use-media-query';
import type { User } from '@/lib/types';
import type { DashboardPageData } from '@/server/use-cases/pages/dashboard.use-case';
import { cn } from '@/lib/utils';

const RECURRING_MAX_MOBILE = 5;

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
    budgets = [],
    budgetPeriods = {},
    recurringSeries = [],
    budgetsByUser = {},
    investments = {},
  } = dashboardData;

  const investmentSummary = investments[currentUser.id]?.summary ?? null;

  const t = useTranslations('HomeContent');
  const isDesktop = useMediaQuery('(min-width: 768px)');
  const recurringMaxItems = isDesktop ? undefined : RECURRING_MAX_MOBILE;

  const {
    isMember,
    selectedGroupFilter,
    effectiveUserId,
    displayedDefaultAccounts,
    displayedAccountBalances,
    totalBalance,
    totalAccountsCount,
    selectedUserId,
    periodManagerUserId,
    periodManagerData,
    handleAccountClick,
    handleCreateRecurringSeries,
    handleSeriesCardClick,
    handlePauseRecurringSeries,
    handlePeriodManagerUserChange,
    handleRefresh,
  } = useDashboardContent({
    currentUser,
    groupUsers,
    accounts,
    accountBalances,
    budgets,
    budgetPeriods,
    recurringSeries,
    budgetsByUser,
  });

  const closePeriodHintId = 'home-close-period-hint';

  const budgetPeriodTrigger = (
    <Button variant="outline" size="sm">
      {t('closePeriodButton')}
    </Button>
  );

  const recurringSeriesUserId = selectedGroupFilter === 'all' ? undefined : effectiveUserId;
  const recurringFilterUserId = isMember ? currentUser.id : recurringSeriesUserId;

  const recurringProps = {
    series: recurringSeries,
    selectedUserId: recurringFilterUserId,
    showStats: false as const,
    showActions: false as const,
    onCreateRecurringSeries: handleCreateRecurringSeries,
    onCardClick: handleSeriesCardClick,
    onPauseRecurringSeries: handlePauseRecurringSeries,
  };

  return (
    <PageContainer>
      <SkipToMainLink href="#main-dashboard">{t('skipToContent')}</SkipToMainLink>

      <Header
        isDashboard
        currentUser={{ name: currentUser.name, role: currentUser.role || 'member' }}
        showActions
        investmentSummary={investmentSummary}
      />

      <UserSelector isLoading={false} currentUser={currentUser} users={groupUsers} />

      <HomeDashboardMain>
        <HomeDashboardGrid
          asideAriaLabel={t('recurringAsideLabel')}
          primary={
            <>
              <section
                aria-labelledby="home-dashboard-heading"
                className={homeDashboardLayoutStyles.heroSection}
              >
                <h1 id="home-dashboard-heading" className={homeDashboardLayoutStyles.heroTitle}>
                  {t('checkFinancesHeading')}
                </h1>
                <p className={homeDashboardLayoutStyles.heroLead}>{t('checkFinancesLead')}</p>
              </section>

              <BalanceSection
                accounts={displayedDefaultAccounts}
                accountBalances={displayedAccountBalances}
                totalBalance={totalBalance}
                totalAccountsCount={totalAccountsCount}
                selectedUserId={selectedUserId}
                onAccountClick={handleAccountClick}
                isLoading={false}
              />

              <BudgetSection
                budgetsByUser={budgetsByUser}
                budgets={budgets}
                selectedViewUserId={selectedUserId}
                isLoading={false}
                headerLeading={
                  <div className="flex min-w-0 flex-col items-stretch gap-1 sm:items-end">
                    <BudgetPeriodManager
                      selectedUserId={periodManagerUserId || currentUser.id}
                      currentPeriod={periodManagerData.period}
                      onUserChange={handlePeriodManagerUserChange}
                      onSuccess={handleRefresh}
                      trigger={budgetPeriodTrigger}
                      triggerAriaDescribedBy={closePeriodHintId}
                      currentUser={currentUser}
                      groupUsers={groupUsers}
                    />
                    <details
                      className={cn(
                        'group sm:max-w-68 sm:justify-self-end',
                        homeDashboardLayoutStyles.periodCloseDetails
                      )}
                    >
                      <summary
                        id={closePeriodHintId}
                        className={homeDashboardLayoutStyles.periodCloseSummary}
                      >
                        <span className={homeDashboardLayoutStyles.periodCloseSummaryLabel}>
                          {t('closePeriodSummary')}
                        </span>
                      </summary>
                      <p
                        className={cn(
                          homeDashboardLayoutStyles.periodCloseHint,
                          'mt-0 border-t border-border/30 px-1.5 pb-2 pt-2 sm:px-1 sm:pb-1.5'
                        )}
                      >
                        {t('closePeriodHint')}
                      </p>
                    </details>
                  </div>
                }
              />
            </>
          }
          aside={
            <div className={dashboardStyles.recurringSection.container}>
              <RecurringSeriesSection
                {...recurringProps}
                homeDashboardListLayout
                {...(typeof recurringMaxItems === 'number' ? { maxItems: recurringMaxItems } : {})}
              />
            </div>
          }
        />
      </HomeDashboardMain>

      <BottomNavigation />
    </PageContainer>
  );
}
