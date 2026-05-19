/**
 * useBudgetsContent Hook
 *
 * Budgets page: target member via `?userId=` (from home); no `?budget=` URL.
 * Selected budget for detail/chart/transactions is client state only.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useBudgetsByUser, useIdNameMap } from '@/hooks';
import { useModalState } from '@/lib/navigation/url-state';
import { useUserFilter } from '@/hooks/state/use-user-filter';
import { canAccessUserData, isAdmin as checkIsAdmin } from '@/lib/utils/permissions';
import {
  toDateTime,
  toDateString,
  today as luxonToday,
  formatDateSmart,
  formatDateShort,
  diffInDays,
} from '@/lib/utils/date-utils';
import {
  filterTransactionsForBudgetsUnion,
  effectiveSpentFromTransactions,
} from '@/server/use-cases/budgets/budget.logic';
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
import type { ChartDataPoint } from '../components/budget-chart';
import { useRouter } from '@/i18n/routing';

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
  readonly router: ReturnType<typeof useRouter>;
  readonly currentUser: User;
  readonly groupUsers: User[];
  /** Member whose budgets are shown (from URL or current user). */
  readonly budgetContextUserId: string;
  readonly isAdmin: boolean;

  readonly selectedBudget: Budget | null;
  readonly selectedBudgetId: string | null;
  readonly setSelectedBudgetId: (id: string | null) => void;
  readonly selectedBudgetProgress: BudgetProgressData | null;
  readonly userBudgets: Budget[];
  readonly userBudgetSummary: UserBudgetSummary | null;

  readonly periodInfo: PeriodInfo | null;
  readonly groupedTransactions: GroupedTransaction[];
  /** Spesa cumulativa nel periodo su tutti i budget (union categorie), allineata al grafico. */
  readonly chartAggregateSpent: number;
  readonly chartData: ChartDataPoint[] | null;
  readonly transactionSectionSubtitle: string;
  readonly accountNamesMap: Record<string, string>;
  readonly categories: Category[];

  readonly handleBudgetSelect: (budgetId: string) => void;
  readonly handleCreateBudget: () => void;
  readonly handleEditBudgetById: (budgetId: string) => void;

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
  const locale = useLocale();
  const t = useTranslations('Budgets.Page');

  const userFromUrl = searchParams.get('user') ?? searchParams.get('userId');
  const { setSelectedGroupFilter } = useUserFilter();

  const budgetContextUserId = useMemo(() => {
    if (!userFromUrl) return currentUser.id;
    const inGroup = groupUsers.some((u) => u.id === userFromUrl);
    if (!inGroup) return currentUser.id;
    if (!canAccessUserData(currentUser, userFromUrl)) return currentUser.id;
    return userFromUrl;
  }, [userFromUrl, currentUser, groupUsers]);

  useEffect(() => {
    if (!userFromUrl) return;
    const inGroup = groupUsers.some((u) => u.id === userFromUrl);
    if (!inGroup || !canAccessUserData(currentUser, userFromUrl)) return;
    setSelectedGroupFilter(userFromUrl);
  }, [userFromUrl, groupUsers, currentUser, setSelectedGroupFilter]);

  const isAdmin = checkIsAdmin(currentUser);

  const userBudgets = useMemo(
    () => budgets.filter((b) => b.user_id === budgetContextUserId && b.amount > 0),
    [budgets, budgetContextUserId]
  );

  /** Explicit tab/card selection; when null or stale, selection falls back to the first budget. */
  const [userSelectedBudgetId, setUserSelectedBudgetId] = useState<string | null>(null);

  const selectedBudgetId = useMemo(() => {
    const firstId = userBudgets[0]?.id ?? null;
    if (userSelectedBudgetId != null && userBudgets.some((b) => b.id === userSelectedBudgetId)) {
      return userSelectedBudgetId;
    }
    return firstId;
  }, [userBudgets, userSelectedBudgetId]);

  const setSelectedBudgetId = useCallback((id: string | null) => {
    setUserSelectedBudgetId(id);
  }, []);

  const { openModal } = useModalState();

  const selectedBudget = useMemo(() => {
    if (selectedBudgetId) {
      return userBudgets.find((b) => b.id === selectedBudgetId) || null;
    }
    return userBudgets[0] || null;
  }, [selectedBudgetId, userBudgets]);

  const budgetContextUser = useMemo(
    () => groupUsers.find((u) => u.id === budgetContextUserId) || currentUser,
    [groupUsers, budgetContextUserId, currentUser]
  );

  const hookGroupUsers = useMemo(() => [budgetContextUser], [budgetContextUser]);

  const { budgetsByUser } = useBudgetsByUser({
    groupUsers: hookGroupUsers,
    budgets,
    transactions,
    currentUser,
    selectedUserId: budgetContextUserId,
    budgetPeriods,
    precalculatedData,
  });
  const userBudgetSummary = budgetsByUser[budgetContextUserId] ?? null;

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

  const periodInfo = useMemo((): PeriodInfo | null => {
    if (!userBudgetSummary) return null;
    return {
      start: userBudgetSummary.periodStart,
      end: userBudgetSummary.periodEnd,
      activePeriod: userBudgetSummary.activePeriod ?? null,
    };
  }, [userBudgetSummary]);

  const accountNamesMap = useIdNameMap(accounts);

  /** Transazioni del periodo per l’unione delle categorie di tutti i budget (grafico + lista). */
  const allBudgetsPeriodTransactions = useMemo(() => {
    if (!periodInfo?.start || userBudgets.length === 0) return [];

    const periodStart = periodInfo.start ? toDateTime(periodInfo.start) : null;
    const periodEnd = periodInfo.end ? toDateTime(periodInfo.end) : null;

    const userTransactions = transactions.filter((t) => t.user_id === budgetContextUser.id);

    return filterTransactionsForBudgetsUnion(userTransactions, userBudgets, periodStart, periodEnd);
  }, [periodInfo, userBudgets, budgetContextUser, transactions]);

  const chartAggregateSpent = useMemo(
    () => effectiveSpentFromTransactions(allBudgetsPeriodTransactions),
    [allBudgetsPeriodTransactions]
  );

  const transactionSectionSubtitle = useMemo(() => {
    if (periodInfo?.start) {
      const startDt = toDateTime(periodInfo.start);
      const endDt = periodInfo.end ? toDateTime(periodInfo.end) : null;

      const startFormatted = startDt ? formatDateShort(startDt, locale) : '';
      const endFormatted = endDt ? formatDateShort(endDt, locale) : t('today');
      return `${startFormatted} - ${endFormatted}`;
    }

    const count = allBudgetsPeriodTransactions.length;
    return t('transactionCount', { count });
  }, [periodInfo, allBudgetsPeriodTransactions.length, locale, t]);

  const groupedTransactions = useMemo((): GroupedTransaction[] => {
    if (allBudgetsPeriodTransactions.length === 0) return [];

    const groupedMap: Record<string, Transaction[]> = {};
    for (const transaction of allBudgetsPeriodTransactions) {
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
        formattedDate: formatDateSmart(date, locale),
        transactions: [...txs].sort((a, b) => {
          const dtA = toDateTime(a.date);
          const dtB = toDateTime(b.date);
          if (!dtA || !dtB) return 0;
          return dtB.toMillis() - dtA.toMillis();
        }),
        total: txs.reduce((sum, tx) => sum + tx.amount, 0),
      }));
  }, [allBudgetsPeriodTransactions, locale]);

  const chartData = useMemo((): ChartDataPoint[] | null => {
    if (!periodInfo?.start || allBudgetsPeriodTransactions.length === 0) return null;

    const startDate = toDateTime(periodInfo.start);
    const endDate = periodInfo.end ? toDateTime(periodInfo.end) : luxonToday();
    const today = luxonToday();

    if (!startDate || !endDate) return null;

    const totalDays = diffInDays(startDate, endDate);
    if (totalDays <= 0) return null;

    const dailySpending: Record<string, number> = {};
    for (const tx of allBudgetsPeriodTransactions) {
      const dateKey = toDateString(tx.date);
      const amount = tx.type === 'income' ? -tx.amount : tx.amount;
      dailySpending[dateKey] = (dailySpending[dateKey] || 0) + amount;
    }

    const points: ChartDataPoint[] = [];
    let cumulative = 0;
    const maxAmount = Math.max(1, userBudgetSummary?.totalBudget ?? 1);
    const daysDenominator = Math.max(1, totalDays - 1);

    for (let i = 0; i < totalDays; i++) {
      const currentDate = startDate.plus({ days: i });
      const dateKey = toDateString(currentDate);

      cumulative += dailySpending[dateKey] || 0;
      const isFuture = currentDate > today;

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
  }, [periodInfo, allBudgetsPeriodTransactions, userBudgetSummary?.totalBudget]);

  const handleBudgetSelect = useCallback((budgetId: string) => {
    setUserSelectedBudgetId(budgetId);
  }, []);

  const handleCreateBudget = useCallback(() => {
    openModal('budget');
  }, [openModal]);

  const handleEditBudgetById = useCallback(
    (budgetId: string) => {
      openModal('budget', budgetId);
    },
    [openModal]
  );

  return {
    router,
    currentUser,
    groupUsers,
    budgetContextUserId,
    isAdmin,
    selectedBudget,
    selectedBudgetId,
    setSelectedBudgetId,
    selectedBudgetProgress,
    userBudgets,
    userBudgetSummary,
    periodInfo,
    groupedTransactions,
    chartAggregateSpent,
    chartData,
    transactionSectionSubtitle,
    accountNamesMap,
    categories,
    handleBudgetSelect,
    handleCreateBudget,
    handleEditBudgetById,
    openModal,
  };
}
