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
 */

import { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BottomNavigation, PageContainer, Header } from "@/components/layout";
import { useUserFilter, usePermissions, useFilteredAccounts, useBudgetsByUser } from "@/hooks";
import { Button } from "@/components/ui";
import { RecurringTransactionSeries } from "@/src/lib";
import {
  BalanceSectionSkeleton,
  BudgetSectionSkeleton,
  DashboardHeaderSkeleton,
  RecurringSeriesSkeleton,
  UserSelectorSkeleton,
  dashboardStyles,
} from "@/features/dashboard";
import UserSelector from "@/components/shared/user-selector";
import { BalanceSection } from "@/features/accounts";
import { BudgetPeriodManager, BudgetSection } from "@/features/budgets";
import { RecurringSeriesSection } from "@/features/recurring";
import { AccountService } from "@/lib/services";
import { useModalState } from "@/lib/navigation/url-state";
import type { Account, Transaction, Budget } from "@/lib/types";
import { useCurrentUser, useGroupUsers, useAccounts } from "@/stores/reference-data-store";

/**
 * Dashboard Content Props
 */
interface DashboardContentProps {
  accountBalances: Record<string, number>;
  transactions: Transaction[];
  budgets: Budget[];
  recurringSeries: RecurringTransactionSeries[];
}

/**
 * Dashboard Content Component
 *
 * Handles full dashboard UI with four main sections
 * Receives data from Server Component parent
 */
export default function DashboardContent({
  accountBalances,
  transactions,
  budgets,
  recurringSeries,
}: DashboardContentProps) {
  // 1. All hooks must be called at the top of the component, unconditionally
  const currentUser = useCurrentUser();
  const groupUsers = useGroupUsers();
  const accounts = useAccounts();
  const router = useRouter();
  const { selectedGroupFilter, selectedUserId } = useUserFilter();

  // Permission checks - handles null currentUser internally
  const { effectiveUserId, isMember } = usePermissions({
    currentUser: currentUser || ({ id: '', name: '', role: 'member' } as any),
    selectedUserId: selectedGroupFilter !== "all" ? selectedGroupFilter : undefined,
  });

  // Calculate budgets - handles null currentUser internally
  const { budgetsByUser } = useBudgetsByUser({
    groupUsers,
    budgets,
    transactions,
    currentUser: currentUser || ({ id: '', name: '', role: 'member' } as any),
    selectedUserId,
  });

  // Modal state management
  const { openModal } = useModalState();

  // Filter default accounts - useMemo is a hook, must be called unconditionally
  const displayedDefaultAccounts = useMemo(() => {
    if (!currentUser) return [];

    let accountsToDisplay: Account[] = [];
    const totalAccountCount = accounts.length;

    if (isMember) {
      const userAccounts = accounts.filter((acc) => acc.user_ids.includes(currentUser.id));
      if (userAccounts.length === 1) {
        accountsToDisplay = userAccounts;
      } else if (userAccounts.length > 1 && currentUser.default_account_id) {
        const defaultAccount = accounts.find((a) => a.id === currentUser.default_account_id);
        accountsToDisplay = defaultAccount ? [defaultAccount] : userAccounts;
      } else {
        accountsToDisplay = userAccounts;
      }
    } else {
      if (totalAccountCount === 1) {
        accountsToDisplay = accounts;
      } else if (totalAccountCount > 1) {
        if (selectedUserId) {
          const user = groupUsers.find((u) => u.id === selectedUserId);
          if (user?.default_account_id) {
            const defaultAccount = accounts.find((a) => a.id === user.default_account_id);
            accountsToDisplay = defaultAccount ? [defaultAccount] : [];
          }
        } else {
          accountsToDisplay = AccountService.getDefaultAccounts(accounts, groupUsers);
        }
      }
    }

    return accountsToDisplay.sort((a, b) => {
      const balanceA = accountBalances[a.id] || 0;
      const balanceB = accountBalances[b.id] || 0;
      return balanceB - balanceA;
    });
  }, [selectedUserId, accounts, groupUsers, accountBalances, isMember, currentUser]);

  // Account filtering hook
  const { filteredAccounts: userAccounts } = useFilteredAccounts({
    accounts,
    currentUser,
    selectedUserId,
  });

  const totalAccountsCount = userAccounts.length;

  const displayedAccountBalances = useMemo(() => {
    const displayedAccountIds = new Set(displayedDefaultAccounts.map((account) => account.id));
    return Object.fromEntries(
      Object.entries(accountBalances).filter(([accountId]) => displayedAccountIds.has(accountId)),
    );
  }, [displayedDefaultAccounts, accountBalances]);

  const totalBalance = useMemo(() => {
    let balance = 0;
    if (selectedUserId) {
      const userAccountIds = userAccounts.map((a) => a.id);
      balance = userAccountIds.reduce((sum, accountId) => sum + (accountBalances[accountId] || 0), 0);
      const risparmiCasaAccount = accounts.find((a) => a.name === "Risparmi Casa");
      if (risparmiCasaAccount) balance += accountBalances[risparmiCasaAccount.id] || 0;
    } else {
      balance = Object.values(accountBalances).reduce((sum, bal) => sum + bal, 0);
    }
    return Math.round(balance * 100) / 100;
  }, [selectedUserId, userAccounts, accounts, accountBalances]);

  // State hooks
  const [periodManagerUserId, setPeriodManagerUserId] = useState<string | undefined>(
    isMember ? currentUser?.id : selectedUserId || currentUser?.id,
  );

  // Effects
  useEffect(() => {
    if (isMember && currentUser) {
      setPeriodManagerUserId(currentUser.id);
      return;
    }
    if (selectedUserId) {
      setPeriodManagerUserId(selectedUserId);
    }
  }, [isMember, currentUser, selectedUserId]);

  const periodManagerData = useMemo(() => {
    const targetUser = groupUsers.find((u) => u.id === periodManagerUserId) || currentUser;
    if (!targetUser) return { targetUser: null, budgets: [], period: null };

    const targetUserBudgets = budgets.filter((b) => b.user_id === targetUser.id && b.amount > 0);
    const targetUserPeriod = targetUser.budget_periods?.find((p) => p.is_active && !p.end_date) || null;

    return {
      targetUser,
      budgets: targetUserBudgets,
      period: targetUserPeriod,
    };
  }, [periodManagerUserId, groupUsers, currentUser, budgets]);

  // Handlers
  const handleAccountClick = () => router.push("/accounts");
  const handleCreateRecurringSeries = () => openModal('recurring');
  const handleSeriesCardClick = () => router.push("/transactions?tab=Recurrent");

  // 2. ONLY NOW check if we have the data needed to render. 
  // If currentUser is missing, return null or a loader, but all hooks have been called.
  if (!currentUser) {
    return null;
  }

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
          className="mb-6"
        />
      </Suspense>

      {/* User Selector */}
      <Suspense fallback={<UserSelectorSkeleton />}>
        <UserSelector isLoading={false} />
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

        <div className={dashboardStyles.divider} />

        {/* Budget Section */}
        <div className="bg-[#F8FAFC]">
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
                  transactions={transactions}
                  userBudgets={periodManagerData.budgets}
                  onUserChange={setPeriodManagerUserId}
                  onSuccess={() => router.refresh()}
                  trigger={budgetPeriodTrigger}
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
          />
        </Suspense>
      </main>

      <BottomNavigation />
    </PageContainer>
  );
}
