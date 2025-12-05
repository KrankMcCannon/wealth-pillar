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

import { Suspense, useMemo, useState } from "react";
import { Settings, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { BottomNavigation, PageContainer } from "@/components/layout";
import { useUserFilter } from "@/hooks";
import { Button, IconContainer, Text } from "@/components/ui";
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
import { BudgetSection } from "@/features/budgets";
import { RecurringSeriesForm, RecurringSeriesSection } from "@/features/recurring";
import { AccountService, BudgetService } from "@/lib/services";
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

  // Calculate budgets by user using BudgetService
  const budgetsByUser = useMemo(() => {
    return BudgetService.buildBudgetsByUser(groupUsers, budgets, transactions);
  }, [groupUsers, budgets, transactions]);

  // Filter default accounts based on selected user and sort by balance
  const displayedDefaultAccounts = useMemo(() => {
    let accountsToDisplay: Account[] = [];
    const totalAccountCount = accounts.length;

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

    // Sort accounts by balance (descending - highest first)
    return accountsToDisplay.sort((a, b) => {
      const balanceA = accountBalances[a.id] || 0;
      const balanceB = accountBalances[b.id] || 0;
      return balanceB - balanceA;
    });
  }, [selectedUserId, accounts, groupUsers, accountBalances]);

  // Get all accounts for the selected user (or all accounts if "all" selected)
  const userAccounts = useMemo(() => {
    if (selectedUserId) {
      return AccountService.filterAccountsByUser(accounts, selectedUserId);
    }
    return accounts;
  }, [selectedUserId, accounts]);

  // Calculate total account count for selected user
  const totalAccountsCount = userAccounts.length;

  // Calculate balances for displayed default accounts
  const displayedAccountBalances = useMemo(() => {
    const displayedAccountIds = new Set(displayedDefaultAccounts.map((account) => account.id));
    return Object.fromEntries(
      Object.entries(accountBalances).filter(([accountId]) => displayedAccountIds.has(accountId))
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
      const risparmiCasaAccount = accounts.find((a) => a.name === 'Risparmi Casa');
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

  // State management for recurring series modal
  const [isRecurringFormOpen, setIsRecurringFormOpen] = useState(false);
  const [selectedSeries, setSelectedSeries] = useState<RecurringTransactionSeries | undefined>(undefined);
  const [formMode, setFormMode] = useState<'create' | 'edit' | undefined>(undefined);

  // Handler for group filter changes
  const handleGroupFilterChange = (userId: string) => {
    setSelectedGroupFilter(userId);
  };

  // Handler for individual account card clicks
  const handleAccountClick = () => {
    router.push('/accounts');
  };

  // Handler for creating recurring series
  const handleCreateRecurringSeries = () => {
    setSelectedSeries(undefined);
    setFormMode('create');
    setIsRecurringFormOpen(true);
  };

  // Handler for editing recurring series (used in modal)
  const handleEditRecurringSeries = (series: RecurringTransactionSeries) => {
    setSelectedSeries(series);
    setFormMode('edit');
    setIsRecurringFormOpen(true);
  };

  // Handler for clicking on a series card - navigate to transactions with Recurrent tab
  const handleSeriesCardClick = () => {
    router.push('/transactions?tab=Recurrent');
  };

  // Handler for settings navigation
  const handleSettingsClick = () => {
    router.push('/settings');
  };

  return (
    <PageContainer className={dashboardStyles.page.container}>
      {/* Mobile-First Header */}
      <Suspense fallback={<DashboardHeaderSkeleton />}>
        <header className={dashboardStyles.header.container}>
          <div className={dashboardStyles.header.inner}>
            {/* Left - User Profile */}
            <div className={dashboardStyles.header.section.left}>
              <IconContainer size="sm" color="primary" className={dashboardStyles.header.section.profileIcon}>
                <Settings className="h-4 w-4" />
              </IconContainer>
              <div className={dashboardStyles.header.section.profileName}>
                <Text variant="heading" size="sm">
                  {currentUser.name}
                </Text>
                <Text variant="muted" size="xs" className="font-semibold">
                  Premium Plan
                </Text>
              </div>
            </div>

            {/* Right - Actions */}
            <div className={dashboardStyles.header.section.right}>
              <Button variant="ghost" size="sm" className={dashboardStyles.header.button}>
                <Bell className={dashboardStyles.header.section.notificationIcon} />
              </Button>
              <Button variant="ghost" size="sm" className={dashboardStyles.header.button} onClick={handleSettingsClick}>
                <Settings className={dashboardStyles.header.section.settingsIcon} />
              </Button>
            </div>
          </div>
        </header>
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
            />
          </Suspense>
        </div>

        {/* Recurring Series Section */}
        <Suspense fallback={<RecurringSeriesSkeleton />}>
          <RecurringSeriesSection
            series={recurringSeries}
            selectedUserId={selectedUserId}
            className={dashboardStyles.recurringSection.container}
            showStats={false}
            maxItems={5}
            showActions={false}
            onCreateRecurringSeries={handleCreateRecurringSeries}
            onEditRecurringSeries={handleEditRecurringSeries}
            onCardClick={handleSeriesCardClick}
          />
        </Suspense>
      </main>

      <BottomNavigation />

      {/* Recurring Series Form */}
      <Suspense fallback={null}>
        <RecurringSeriesForm
          isOpen={isRecurringFormOpen}
          onOpenChange={setIsRecurringFormOpen}
          currentUser={currentUser}
          groupUsers={groupUsers}
          accounts={accounts}
          categories={categories}
          selectedUserId={selectedUserId}
          series={selectedSeries}
          mode={formMode}
        />
      </Suspense>
    </PageContainer>
  );
}
