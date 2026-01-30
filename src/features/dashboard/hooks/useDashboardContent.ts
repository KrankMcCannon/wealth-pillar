'use client'

/**
 * useDashboardContent Hook
 *
 * Extracts business logic from DashboardContent component
 * Handles state management, calculations, and event handlers
 */
import { useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useUserFilter, usePermissions, useFilteredAccounts } from "@/hooks";
import { useModalState } from "@/lib/navigation/url-state";
import { usePageDataStore, useBudgetPeriod } from "@/stores/page-data-store";
import { calculateDisplayedAccounts } from "./dashboard-helpers";
import type {
  Account,
  Budget,
  BudgetPeriod,
  User,
  UserBudgetSummary,
} from "@/lib/types";
import type { RecurringTransactionSeries } from "@/lib";

/**
 * Input parameters for useDashboardContent hook
 */
export interface UseDashboardContentParams {
  currentUser: User;
  groupUsers: User[];
  accounts: Account[];
  accountBalances: Record<string, number>;
  budgets: Budget[];
  budgetPeriods: Record<string, BudgetPeriod | null>;
  recurringSeries: RecurringTransactionSeries[];
  budgetsByUser: Record<string, UserBudgetSummary>;
}

/**
 * Period manager data for budget period management
 */
export interface PeriodManagerData {
  targetUser: User;
  budgets: Budget[];
  period: BudgetPeriod | null;
}

/**
 * Return type for useDashboardContent hook
 */
export interface UseDashboardContentReturn {
  // Permission state
  isMember: boolean;
  selectedUserId: string | undefined;
  selectedGroupFilter: string;
  effectiveUserId: string;

  // Computed data
  displayedDefaultAccounts: Account[];
  displayedAccountBalances: Record<string, number>;
  totalBalance: number;
  totalAccountsCount: number;
  periodManagerUserId: string;
  periodManagerData: PeriodManagerData;

  // Handlers
  handleAccountClick: () => void;
  handleCreateRecurringSeries: () => void;
  handleSeriesCardClick: () => void;
  handlePauseRecurringSeries: () => void;
  handlePeriodManagerUserChange: (userId: string) => void;
  handleRefresh: () => void;
}

/**
 * Custom hook for dashboard content business logic
 *
 * Separates UI rendering from data transformation and state management
 */
export function useDashboardContent({
  currentUser,
  groupUsers,
  accounts,
  accountBalances,
  budgets,
  budgetPeriods,
  recurringSeries,
}: UseDashboardContentParams): UseDashboardContentReturn {
  const router = useRouter();
  const { selectedGroupFilter, selectedUserId, setSelectedGroupFilter } = useUserFilter();
  const setBudgetPeriods = usePageDataStore((state) => state.setBudgetPeriods);
  const setRecurringSeries = usePageDataStore((state) => state.setRecurringSeries);

  // Permission checks
  const { effectiveUserId, isMember } = usePermissions({
    currentUser,
    selectedUserId: selectedGroupFilter === "all" ? undefined : selectedGroupFilter,
  });

  // Modal state management
  const { openModal } = useModalState();

  // Account filtering hook
  const { filteredAccounts: userAccounts } = useFilteredAccounts({
    accounts,
    currentUser,
    selectedUserId,
  });

  const totalAccountsCount = userAccounts.length;

  // Filter default accounts for display
  const displayedDefaultAccounts = useMemo(() => {
    return calculateDisplayedAccounts(
      accounts,
      groupUsers,
      accountBalances,
      currentUser,
      selectedUserId,
      isMember
    );
  }, [selectedUserId, accounts, groupUsers, accountBalances, isMember, currentUser]);

  // Filter balances for displayed accounts
  const displayedAccountBalances = useMemo(() => {
    const displayedAccountIds = new Set(displayedDefaultAccounts.map((account) => account.id));
    return Object.fromEntries(
      Object.entries(accountBalances).filter(([accountId]) => displayedAccountIds.has(accountId)),
    );
  }, [displayedDefaultAccounts, accountBalances]);

  // Calculate total balance
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

  // Period manager user ID
  const periodManagerUserId = isMember ? currentUser.id : (selectedUserId ?? currentUser.id);

  // Get active budget period from store
  const activePeriod = useBudgetPeriod(periodManagerUserId || currentUser.id);

  // Period manager data for budget management
  const periodManagerData = useMemo((): PeriodManagerData => {
    const targetUser = groupUsers.find((u) => u.id === periodManagerUserId) || currentUser;
    const targetUserBudgets = budgets.filter((b) => b.user_id === targetUser.id && b.amount > 0);

    return {
      targetUser,
      budgets: targetUserBudgets,
      period: activePeriod,
    };
  }, [periodManagerUserId, groupUsers, currentUser, budgets, activePeriod]);

  // Initialize store with budget periods from server
  useEffect(() => {
    setBudgetPeriods(budgetPeriods);
  }, [budgetPeriods, setBudgetPeriods]);

  // Initialize store with recurring series from server
  useEffect(() => {
    setRecurringSeries(recurringSeries);
  }, [recurringSeries, setRecurringSeries]);

  // Event Handlers
  const handleAccountClick = useCallback(() => {
    router.push("/accounts");
  }, [router]);

  const handleCreateRecurringSeries = useCallback(() => {
    openModal("recurring");
  }, [openModal]);

  const handleSeriesCardClick = useCallback(() => {
    router.push("/transactions?tab=Recurrent");
  }, [router]);

  const handlePauseRecurringSeries = useCallback(() => {
    router.push("/transactions?tab=Recurrent");
  }, [router]);

  const handlePeriodManagerUserChange = useCallback(
    (userId: string) => {
      setSelectedGroupFilter(userId);
    },
    [setSelectedGroupFilter],
  );

  const handleRefresh = useCallback(() => {
    router.refresh();
  }, [router]);

  return {
    // Permission state
    isMember,
    selectedUserId,
    selectedGroupFilter,
    effectiveUserId,

    // Computed data
    displayedDefaultAccounts,
    displayedAccountBalances,
    totalBalance,
    totalAccountsCount,
    periodManagerUserId,
    periodManagerData,

    // Handlers
    handleAccountClick,
    handleCreateRecurringSeries,
    handleSeriesCardClick,
    handlePauseRecurringSeries,
    handlePeriodManagerUserChange,
    handleRefresh,
  };
}
