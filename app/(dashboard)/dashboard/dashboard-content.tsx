"use client";

/**
 * Dashboard Content - Client Component
 *
 * Complete dashboard UI with all sections:
 * - Header with profile and settings
 * - User Selector for multi-user filtering
 * - Balance Section (accounts and total balance)
 * - Budget Section (budgets grouped by user)
 * - Recurring Series Section (upcoming recurring transactions)
 * - Recurring Series Form Modal
 *
 * Data is passed from Server Component for optimal performance
 * Business logic is extracted to useDashboardContent hook
 */

import { Suspense } from "react";
import { BottomNavigation, PageContainer, Header } from "@/components/layout";
import { Button } from "@/components/ui";
import {
  BalanceSectionSkeleton,
  BudgetSectionSkeleton,
  DashboardHeaderSkeleton,
  RecurringSeriesSkeleton,
  UserSelectorSkeleton,
  dashboardStyles,
  useDashboardContent,
} from "@/features/dashboard";
import UserSelector from "@/components/shared/user-selector";
import { BalanceSection } from "@/features/accounts";
import { BudgetPeriodManager, BudgetSection } from "@/features/budgets";
import { RecurringSeriesSection } from "@/features/recurring";
import type { Account, Transaction, Budget, BudgetPeriod, User, UserBudgetSummary } from "@/lib/types";
import type { RecurringTransactionSeries } from "@/lib";

/**
 * Dashboard Content Props
 */
interface DashboardContentProps {
  currentUser: User;
  groupUsers: User[];
  accounts: Account[];
  accountBalances: Record<string, number>;
  transactions: Transaction[];
  budgets: Budget[];
  budgetPeriods: Record<string, BudgetPeriod | null>;
  recurringSeries: RecurringTransactionSeries[];
  budgetsByUser: Record<string, UserBudgetSummary>;
  investmentSummary?: {
    totalReturnPercent: number;
  } | null;
}

/**
 * Dashboard Content Component
 *
 * Handles full dashboard UI with four main sections
 * Receives data from Server Component parent
 * Uses useDashboardContent hook for business logic
 */
export default function DashboardContent({
  currentUser,
  groupUsers,
  accounts,
  accountBalances,
  budgets,
  budgetPeriods,
  recurringSeries,
  budgetsByUser,
  investmentSummary,
}: DashboardContentProps) {
  // Extract all business logic to custom hook
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

  const budgetPeriodTrigger = (
    <Button variant="outline" size="sm">
      Chiudi Periodo
    </Button>
  );

  return (
    <PageContainer className={dashboardStyles.page.container}>
      {/* Mobile-First Header */}
      <Suspense fallback={<DashboardHeaderSkeleton />}>
        <Header
          isDashboard={true}
          currentUser={{ name: currentUser.name, role: currentUser.role || 'member' }}
          showActions={true}
          investmentSummary={investmentSummary}
        />
      </Suspense>

      {/* User Selector */}
      <Suspense fallback={<UserSelectorSkeleton />}>
        <UserSelector
          isLoading={false}
          currentUser={currentUser}
          users={groupUsers}
        />
      </Suspense>

      <main className={dashboardStyles.page.main}>
        {/* Balance Section - Shows default accounts based on selected user */}
        <Suspense fallback={<BalanceSectionSkeleton />}>
          <BalanceSection
            accounts={displayedDefaultAccounts}
            users={groupUsers}
            accountBalances={displayedAccountBalances}
            totalBalance={totalBalance}
            totalAccountsCount={totalAccountsCount}
            selectedUserId={selectedUserId}
            onAccountClick={handleAccountClick}
            isLoading={false}
          />
        </Suspense>

        {/* Budget Section */}
        <div className={dashboardStyles.budgetSection.container}>
          <Suspense fallback={<BudgetSectionSkeleton />}>
            <BudgetSection
              budgetsByUser={budgetsByUser}
              budgets={budgets}
              selectedViewUserId={selectedUserId}
              isLoading={false}
              headerLeading={
                <BudgetPeriodManager
                  selectedUserId={periodManagerUserId || currentUser.id}
                  currentPeriod={periodManagerData.period}
                  onUserChange={handlePeriodManagerUserChange}
                  onSuccess={handleRefresh}
                  trigger={budgetPeriodTrigger}
                  currentUser={currentUser}
                  groupUsers={groupUsers}
                />
              }
            />
          </Suspense>
        </div>

        {/* Recurring Series Section */}
        <Suspense fallback={<RecurringSeriesSkeleton />}>
          <RecurringSeriesSection
            series={recurringSeries}
            selectedUserId={isMember ? currentUser.id : selectedGroupFilter === "all" ? undefined : effectiveUserId}
            className={dashboardStyles.recurringSection.container}
            showStats={false}
            maxItems={5}
            showActions={false}
            onCreateRecurringSeries={handleCreateRecurringSeries}
            onCardClick={handleSeriesCardClick}
            onPauseRecurringSeries={handlePauseRecurringSeries}
          />
        </Suspense>
      </main>

      <BottomNavigation />
    </PageContainer>
  );
}
