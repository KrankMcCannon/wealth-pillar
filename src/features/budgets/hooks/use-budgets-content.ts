/**
 * useBudgetsContent Hook — display-only; budget math precomputed server-side.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { useBudgetsByUser, useIdNameMap } from '@/hooks';
import { useModalState } from '@/lib/navigation/url-state';
import { useUserFilter } from '@/hooks/state/use-user-filter';
import { canAccessUserData, isAdmin as checkIsAdmin } from '@/lib/utils/permissions';
import { toDateTime, formatDateShort } from '@/lib/utils/date-utils';
import type {
  Category,
  Budget,
  Transaction,
  Account,
  BudgetPeriod,
  User,
  UserBudgetSummary,
} from '@/lib/types';
import type { BudgetChartViewModel } from '@/server/use-cases/budgets/budget-chart.logic';
import type { GroupedTransaction } from '@/features/transactions';
import type { ChartDataPoint } from '../components/budget-chart';
import { useRouter } from '@/i18n/routing';

export interface UseBudgetsContentProps {
  readonly categories: Category[];
  readonly budgets: Budget[];
  readonly transactions: Transaction[];
  readonly accounts: Account[];
  readonly budgetPeriods: Record<string, BudgetPeriod | null>;
  readonly currentUser: User;
  readonly groupUsers: User[];
  readonly precalculatedData: Record<string, UserBudgetSummary>;
  readonly chartViewModelsByUser: Record<string, BudgetChartViewModel>;
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

export function useBudgetsContent({
  categories,
  budgets,
  accounts,
  currentUser,
  groupUsers,
  precalculatedData,
  chartViewModelsByUser,
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

  const { budgetsByUser } = useBudgetsByUser({ precalculatedData });
  const userBudgetSummary = budgetsByUser[budgetContextUserId] ?? null;

  const chartViewModel = chartViewModelsByUser[budgetContextUserId];

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

  const chartAggregateSpent = chartViewModel?.chartAggregateSpent ?? 0;
  const chartData = chartViewModel?.chartData ?? null;

  const groupedTransactions = useMemo((): GroupedTransaction[] => {
    const groups = chartViewModel?.groupedTransactions ?? [];
    return groups.map((g) => ({
      date: g.date,
      formattedDate: formatDateShort(g.date, locale),
      transactions: g.transactions,
      total: g.total,
    }));
  }, [chartViewModel, locale]);

  const transactionSectionSubtitle = useMemo(() => {
    if (periodInfo?.start) {
      const startDt = toDateTime(periodInfo.start);
      const endDt = periodInfo.end ? toDateTime(periodInfo.end) : null;

      const startFormatted = startDt ? formatDateShort(startDt, locale) : '';
      const endFormatted = endDt ? formatDateShort(endDt, locale) : t('today');
      return `${startFormatted} - ${endFormatted}`;
    }

    const count = chartViewModel?.periodTransactions.length ?? 0;
    return t('transactionCount', { count });
  }, [periodInfo, chartViewModel, locale, t]);

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
