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
import { useModalState } from "@/lib/navigation/modal-params";
import type { User, Account, Transaction, Budget, Category } from "@/lib/types";

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
  recurringSeries: RecurringTransactionSeries[];
  categories: Category[];
}

/**
 * Dashboard Content Component
 *
 * Handles full dashboard UI with four main sections
 * Receives data from Server Component parent
 */
export default function DashboardContent({
  currentUser,
  groupUsers,
  accounts,
  accountBalances,
  transactions,
  budgets,
  recurringSeries,
  categories,
}: DashboardContentProps) {
  const router = useRouter();

  // User filtering state management using shared hook
  const { selectedGroupFilter, setSelectedGroupFilter, selectedUserId } = useUserFilter();

  // Permission checks
  const { effectiveUserId, isMember } = usePermissions({
    currentUser,
    selectedUserId: selectedGroupFilter !== "all" ? selectedGroupFilter : undefined,
  });

  // Calculate budgets by user using centralized hook
  const { budgetsByUser } = useBudgetsByUser({
    groupUsers,
    budgets,
    transactions,
    currentUser,
    selectedUserId,
  });

  // Filter default accounts based on selected user and sort by balance
  // Members only see their own accounts
  const displayedDefaultAccounts = useMemo(() => {
    let accountsToDisplay: Account[] = [];
    const totalAccountCount = accounts.length;

    // Members only see their own accounts
    if (isMember) {
      const userAccounts = accounts.filter((acc) => acc.user_ids.includes(currentUser.id));

      // If only one account, show it
      if (userAccounts.length === 1) {
        accountsToDisplay = userAccounts;
      }
      // If multiple, show only default account
      else if (userAccounts.length > 1 && currentUser.default_account_id) {
        const defaultAccount = accounts.find((a) => a.id === currentUser.default_account_id);
        accountsToDisplay = defaultAccount ? [defaultAccount] : userAccounts;
      }
      // Fallback: show all user's accounts
      else {
        accountsToDisplay = userAccounts;
      }
    }
    // Admin logic (existing)
    else {
      // Case 1: Exactly 1 account in entire system → show it
      if (totalAccountCount === 1) {
        accountsToDisplay = accounts;
      }
      // Case 2: Multiple accounts → use default account logic
      else if (totalAccountCount > 1) {
        if (selectedUserId) {
          // Show only selected user's default account
          const user = groupUsers.find((u) => u.id === selectedUserId);
          if (user?.default_account_id) {
            const defaultAccount = accounts.find((a) => a.id === user.default_account_id);
            accountsToDisplay = defaultAccount ? [defaultAccount] : [];
          }
        } else {
          // Show all users' default accounts
          accountsToDisplay = AccountService.getDefaultAccounts(accounts, groupUsers);
        }
      }
    }

    // Sort accounts by balance (descending - highest first)
    return accountsToDisplay.sort((a, b) => {
      const balanceA = accountBalances[a.id] || 0;
      const balanceB = accountBalances[b.id] || 0;
      return balanceB - balanceA;
    });
  }, [selectedUserId, accounts, groupUsers, accountBalances, isMember, currentUser]);

  // Get all accounts for the selected user (or all accounts if "all" selected)
  // Using centralized account filtering hook
  const { filteredAccounts: userAccounts } = useFilteredAccounts({
    accounts,
    currentUser,
    selectedUserId,
  });

  // Calculate total account count for selected user
  const totalAccountsCount = userAccounts.length;

  // Calculate balances for displayed default accounts
  const displayedAccountBalances = useMemo(() => {
    const displayedAccountIds = new Set(displayedDefaultAccounts.map((account) => account.id));
    return Object.fromEntries(
      Object.entries(accountBalances).filter(([accountId]) => displayedAccountIds.has(accountId)),
    );
  }, [displayedDefaultAccounts, accountBalances]);

  // Calculate total balance based on selection
  const totalBalance = useMemo(() => {
    let balance = 0;

    if (selectedUserId) {
      // When a specific user is selected:
      // Sum of user's account balances + "Risparmi Casa" account balance
      const userAccountIds = userAccounts.map((a) => a.id);
      balance = userAccountIds.reduce((sum, accountId) => {
        return sum + (accountBalances[accountId] || 0);
      }, 0);

      // Find and add "Risparmi Casa" account balance
      const risparmiCasaAccount = accounts.find((a) => a.name === "Risparmi Casa");
      if (risparmiCasaAccount) {
        balance += accountBalances[risparmiCasaAccount.id] || 0;
      }
    } else {
      // When "all" is selected: Sum of all account balances
      balance = Object.values(accountBalances).reduce((sum, bal) => sum + bal, 0);
    }

    // Round to avoid floating point precision issues
    return Math.round(balance * 100) / 100;
  }, [selectedUserId, userAccounts, accounts, accountBalances]);

  // Modal state management via URL params
  const { openModal } = useModalState();

  // Handler for group filter changes
  const handleGroupFilterChange = (userId: string) => {
    setSelectedGroupFilter(userId);
  };

  // Handler for individual account card clicks
  const handleAccountClick = () => {
    router.push("/accounts");
  };

  // Handler for creating recurring series
  const handleCreateRecurringSeries = () => {
    openModal('recurring');
  };

  // Handler for clicking on a series card - navigate to transactions with Recurrent tab
  const handleSeriesCardClick = () => {
    router.push("/transactions?tab=Recurrent");
  };

  const [periodManagerUserId, setPeriodManagerUserId] = useState(
    isMember ? currentUser.id : selectedUserId || currentUser.id,
  );

  useEffect(() => {
    if (isMember) {
      setPeriodManagerUserId(currentUser.id);
      return;
    }
    if (selectedUserId) {
      setPeriodManagerUserId(selectedUserId);
    }
  }, [isMember, currentUser.id, selectedUserId]);

  const periodManagerData = useMemo(() => {
    const targetUser = groupUsers.find((u) => u.id === periodManagerUserId) || currentUser;
    const targetUserBudgets = budgets.filter((b) => b.user_id === targetUser.id && b.amount > 0);
    const targetUserPeriod = targetUser.budget_periods?.find((p) => p.is_active && !p.end_date) || null;

    return {
      targetUser,
      budgets: targetUserBudgets,
      period: targetUserPeriod,
    };
  }, [periodManagerUserId, groupUsers, currentUser, budgets]);

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
        <UserSelector
          users={groupUsers}
          currentUser={currentUser}
          selectedGroupFilter={selectedGroupFilter}
          onGroupFilterChange={handleGroupFilterChange}
          isLoading={false}
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
                  currentUser={currentUser}
                  groupUsers={groupUsers}
                  selectedUserId={periodManagerUserId}
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
