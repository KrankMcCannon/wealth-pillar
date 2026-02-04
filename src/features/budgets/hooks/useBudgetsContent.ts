/**
 * useBudgetsContent Hook
 *
 * Extracts business logic from BudgetsContent component.
 * Handles:
 * - Store initialization for optimistic updates
 * - Budget selection with URL integration
 * - Budget filtering by user
 * - Period and summary calculations
 * - Transaction filtering and grouping
 * - Chart data generation
 * - CRUD handlers
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  useDeleteConfirmation,
  useIdNameMap,
  usePermissions,
  useFilteredData,
  useBudgetsByUser,
  useUserFilter,
} from '@/hooks';
import { useModalState } from '@/lib/navigation/url-state';
import { usePageDataStore } from '@/stores/page-data-store';
import { deleteBudgetAction } from '@/features/budgets/actions/budget-actions';
import {
  toDateTime,
  toDateString,
  today as luxonToday,
  formatDateSmart,
  formatDateShort,
  diffInDays,
} from '@/lib/utils/date-utils';
import { FinanceLogicService } from '@/server/services/finance-logic.service';
import type {
  Category,
  Budget,
  Transaction,
  Account,
  BudgetPeriod,
  User,
  UserBudgetSummary,
} from '@/lib/types';
import type { GroupedTransaction } from '@/features/transactions';
import type { ChartDataPoint } from '../components/BudgetChart';

// ============================================================================
// Types
// ============================================================================

export interface UseBudgetsContentProps {
  readonly categories: Category[];
  readonly budgets: Budget[];
  readonly transactions: Transaction[];
  readonly accounts: Account[];
  readonly budgetPeriods: Record<string, BudgetPeriod | null>;
  readonly currentUser: User;
  readonly groupUsers: User[];
  readonly precalculatedData?: Record<string, UserBudgetSummary>;
}

interface PeriodInfo {
  start: string | null;
  end: string | null;
  activePeriod: BudgetPeriod | null;
}

interface BudgetProgressData {
  id: string;
  spent: number;
  remaining: number;
  percentage: number;
  amount: number;
  transactionCount?: number;
}

export interface UseBudgetsContentReturn {
  // Router
  readonly router: ReturnType<typeof useRouter>;

  // User
  readonly currentUser: User;
  readonly groupUsers: User[];
  readonly selectedUserId: string | undefined;
  readonly isAdmin: boolean;

  // Selection state
  readonly selectedBudget: Budget | null;
  readonly selectedBudgetId: string | null;
  readonly setSelectedBudgetId: (id: string | null) => void;
  readonly selectedBudgetProgress: BudgetProgressData | null;
  readonly userBudgets: Budget[];

  // Computed data
  readonly periodInfo: PeriodInfo | null;
  readonly groupedTransactions: GroupedTransaction[];
  readonly chartData: ChartDataPoint[] | null;
  readonly transactionSectionSubtitle: string;
  readonly accountNamesMap: Record<string, string>;
  readonly categories: Category[];

  // Handlers
  readonly handleBudgetSelect: (budgetId: string) => void;
  readonly handleCreateBudget: () => void;
  readonly handleEditBudget: () => void;
  readonly handleDeleteBudget: (budget: Budget) => void;
  readonly confirmDeleteBudget: () => Promise<void>;

  // Delete confirmation state
  readonly deleteConfirm: ReturnType<typeof useDeleteConfirmation<Budget>>;

  // Modal
  readonly openModal: ReturnType<typeof useModalState>['openModal'];
}

// ============================================================================
// Hook Implementation
// ============================================================================

export function useBudgetsContent({
  categories,
  budgets,
  transactions,
  accounts,
  budgetPeriods,
  currentUser,
  groupUsers,
  precalculatedData,
}: UseBudgetsContentProps): UseBudgetsContentReturn {
  const router = useRouter();
  const searchParams = useSearchParams();

  // ========================================================================
  // Store Initialization
  // ========================================================================

  const storeBudgets = usePageDataStore((state) => state.budgets);
  const setBudgets = usePageDataStore((state) => state.setBudgets);
  const setBudgetPeriods = usePageDataStore((state) => state.setBudgetPeriods);
  const removeBudget = usePageDataStore((state) => state.removeBudget);
  const addBudget = usePageDataStore((state) => state.addBudget);

  // Initialize store with server data on mount
  useEffect(() => {
    setBudgets(budgets);
  }, [budgets, setBudgets]);

  useEffect(() => {
    setBudgetPeriods(budgetPeriods);
  }, [budgetPeriods, setBudgetPeriods]);

  // ========================================================================
  // User Filtering & Permissions
  // ========================================================================

  const { selectedUserId } = useUserFilter();

  const { isAdmin } = usePermissions({
    currentUser,
    selectedUserId,
  });

  // ========================================================================
  // Budget Selection State
  // ========================================================================

  const initialBudgetId = searchParams.get('budget');

  // Filter budgets by selected user
  const { filteredData: userBudgets } = useFilteredData({
    data: storeBudgets,
    currentUser,
    selectedUserId,
    additionalFilter: (budget) => budget.amount > 0,
  });

  // Selected budget state - initialized from URL or first available budget
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(() => {
    if (initialBudgetId) {
      const budget = storeBudgets.find((b) => b.id === initialBudgetId);
      if (budget && budget.amount > 0) {
        if (isAdmin) {
          const groupUserIds = groupUsers.map((u) => u.id);
          if (groupUserIds.includes(budget.user_id)) return initialBudgetId;
        }
        if (budget.user_id === currentUser.id) return initialBudgetId;
      }
    }
    return null;
  });

  // Modal state management (URL-based)
  const { openModal } = useModalState();

  // Delete confirmation state
  const deleteConfirm = useDeleteConfirmation<Budget>();

  // Set first budget if no budget selected
  useEffect(() => {
    if (!selectedBudgetId && userBudgets.length > 0) {
      setSelectedBudgetId(userBudgets[0].id);
    }
  }, [selectedBudgetId, userBudgets]);

  // Update selected budget when userBudgets changes
  useEffect(() => {
    if (selectedBudgetId && !userBudgets.some((b) => b.id === selectedBudgetId)) {
      setSelectedBudgetId(userBudgets[0]?.id || null);
    }
  }, [userBudgets, selectedBudgetId]);

  // ========================================================================
  // Computed Budget Data
  // ========================================================================

  const selectedBudget = useMemo(() => {
    if (selectedBudgetId) {
      return userBudgets.find((b) => b.id === selectedBudgetId) || null;
    }
    return userBudgets[0] || null;
  }, [selectedBudgetId, userBudgets]);

  const selectedBudgetUser = useMemo(() => {
    if (!selectedBudget) return currentUser;
    return groupUsers.find((u) => u.id === selectedBudget.user_id) || currentUser;
  }, [selectedBudget, groupUsers, currentUser]);

  // Memoize users list for hook to prevent infinite loops
  const hookGroupUsers = useMemo(() => [selectedBudgetUser], [selectedBudgetUser]);

  // Calculate budget summary for the selected budget's user
  const { budgetsByUser } = useBudgetsByUser({
    groupUsers: hookGroupUsers,
    budgets: storeBudgets,
    transactions,
    currentUser,
    selectedUserId: selectedBudgetUser.id,
    budgetPeriods,
    precalculatedData,
  });
  const userBudgetSummary = budgetsByUser[selectedBudgetUser.id] || null;

  // Get budget progress for selected budget
  const selectedBudgetProgress = useMemo((): BudgetProgressData | null => {
    if (!selectedBudget || !userBudgetSummary) return null;
    const progress = userBudgetSummary.budgets.find((b) => b.id === selectedBudget.id);
    if (!progress) return null;
    return {
      id: progress.id,
      spent: progress.spent,
      remaining: progress.remaining,
      percentage: progress.percentage,
      amount: progress.amount,
      transactionCount: progress.transactionCount,
    };
  }, [selectedBudget, userBudgetSummary]);

  // Get period info for current user
  const periodInfo = useMemo((): PeriodInfo | null => {
    if (!userBudgetSummary) return null;
    return {
      start: userBudgetSummary.periodStart,
      end: userBudgetSummary.periodEnd,
      activePeriod: userBudgetSummary.activePeriod ?? null,
    };
  }, [userBudgetSummary]);

  // ========================================================================
  // Account Names Map
  // ========================================================================

  const accountNamesMap = useIdNameMap(accounts);

  // ========================================================================
  // Transaction Filtering & Grouping
  // ========================================================================

  const budgetTransactions = useMemo(() => {
    if (!selectedBudget || !periodInfo) return [];

    const periodStart = periodInfo.start ? toDateTime(periodInfo.start) : null;
    const periodEnd = periodInfo.end ? toDateTime(periodInfo.end) : null;

    const userTransactions = transactions.filter((t) => t.user_id === selectedBudgetUser.id);

    return FinanceLogicService.filterTransactionsForBudget(
      userTransactions,
      selectedBudget,
      periodStart,
      periodEnd
    );
  }, [selectedBudget, selectedBudgetUser, transactions, periodInfo]);

  // Generate subtitle for transaction section
  const transactionSectionSubtitle = useMemo(() => {
    if (periodInfo?.start) {
      const startDt = toDateTime(periodInfo.start);
      const endDt = periodInfo.end ? toDateTime(periodInfo.end) : null;

      const startFormatted = startDt ? formatDateShort(startDt) : '';
      const endFormatted = endDt ? formatDateShort(endDt) : 'Oggi';
      return `${startFormatted} - ${endFormatted}`;
    }

    const count = selectedBudgetProgress?.transactionCount ?? 0;
    return `${count} ${count === 1 ? 'transazione' : 'transazioni'}`;
  }, [periodInfo, selectedBudgetProgress]);

  // Group transactions by date
  const groupedTransactions = useMemo((): GroupedTransaction[] => {
    if (budgetTransactions.length === 0) return [];

    const groupedMap: Record<string, Transaction[]> = {};
    for (const transaction of budgetTransactions) {
      const dateKey = toDateString(transaction.date);
      if (!groupedMap[dateKey]) {
        groupedMap[dateKey] = [];
      }
      groupedMap[dateKey].push(transaction);
    }

    return Object.entries(groupedMap)
      .sort(([dateA], [dateB]) => dateB.localeCompare(dateA))
      .map(([date, txs]) => ({
        date,
        formattedDate: formatDateSmart(date),
        transactions: txs.toSorted((a, b) => {
          const dtA = toDateTime(a.date);
          const dtB = toDateTime(b.date);
          if (!dtA || !dtB) return 0;
          return dtB.toMillis() - dtA.toMillis();
        }),
        total: txs.reduce((sum, t) => sum + t.amount, 0),
      }));
  }, [budgetTransactions]);

  // ========================================================================
  // Chart Data Generation
  // ========================================================================

  const chartData = useMemo((): ChartDataPoint[] | null => {
    if (!periodInfo?.start || budgetTransactions.length === 0) return null;

    const startDate = toDateTime(periodInfo.start);
    const endDate = periodInfo.end ? toDateTime(periodInfo.end) : luxonToday();
    const today = luxonToday();

    if (!startDate || !endDate) return null;

    const totalDays = diffInDays(startDate, endDate);
    if (totalDays <= 0) return null;

    // Group transactions by date and calculate cumulative spending
    const dailySpending: Record<string, number> = {};
    for (const t of budgetTransactions) {
      const dateKey = toDateString(t.date);
      const amount = t.type === 'income' ? -t.amount : t.amount;
      dailySpending[dateKey] = (dailySpending[dateKey] || 0) + amount;
    }

    // Generate chart points
    const points: ChartDataPoint[] = [];
    let cumulative = 0;
    const maxAmount = selectedBudgetProgress?.amount || 1;
    const daysDenominator = Math.max(1, totalDays - 1);

    for (let i = 0; i < totalDays; i++) {
      const currentDate = startDate.plus({ days: i });
      const dateKey = toDateString(currentDate);

      cumulative += dailySpending[dateKey] || 0;
      const isFuture = currentDate > today;

      // Scale to SVG coordinates (350 width, 180 height)
      const x = (i / daysDenominator) * 350;
      const y = 180 - (cumulative / maxAmount) * 150;

      points.push({
        x: Math.max(0, x),
        y: Math.max(0, Math.min(180, y)),
        amount: cumulative,
        date: dateKey,
        isFuture,
      });
    }

    return points;
  }, [periodInfo, budgetTransactions, selectedBudgetProgress]);

  // ========================================================================
  // Handlers
  // ========================================================================

  const handleBudgetSelect = useCallback((budgetId: string) => {
    setSelectedBudgetId(budgetId);
  }, []);

  const handleCreateBudget = useCallback(() => {
    openModal('budget');
  }, [openModal]);

  const handleEditBudget = useCallback(() => {
    if (selectedBudget) {
      openModal('budget', selectedBudget.id);
    }
  }, [selectedBudget, openModal]);

  const handleDeleteBudget = useCallback(
    (budget: Budget) => {
      deleteConfirm.openDialog(budget);
    },
    [deleteConfirm]
  );

  const confirmDeleteBudget = useCallback(async () => {
    await deleteConfirm.executeDelete(async (budget) => {
      // Optimistic UI update
      removeBudget(budget.id);

      try {
        const result = await deleteBudgetAction(budget.id);

        if (result.error) {
          addBudget(budget);
          console.error('[useBudgetsContent] Delete error:', result.error);
          throw new Error(result.error);
        }

        // Clear selected budget if it was deleted
        if (selectedBudgetId === budget.id) {
          setSelectedBudgetId(null);
        }
      } catch (error) {
        addBudget(budget);
        console.error('[useBudgetsContent] Error deleting budget:', error);
        throw error;
      }
    });
  }, [deleteConfirm, removeBudget, addBudget, selectedBudgetId]);

  // ========================================================================
  // Return
  // ========================================================================

  return {
    router,
    currentUser,
    groupUsers,
    selectedUserId,
    isAdmin,
    selectedBudget,
    selectedBudgetId,
    setSelectedBudgetId,
    selectedBudgetProgress,
    userBudgets,
    periodInfo,
    groupedTransactions,
    chartData,
    transactionSectionSubtitle,
    accountNamesMap,
    categories,
    handleBudgetSelect,
    handleCreateBudget,
    handleEditBudget,
    handleDeleteBudget,
    confirmDeleteBudget,
    deleteConfirm,
    openModal,
  };
}
