/**
 * useBudgetsContent Hook — display-only; budget math precomputed server-side.
 */

import { useMemo, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useBudgetsByUser } from '@/hooks';
import { useModalState } from '@/lib/navigation/url-state';
import { useUserFilter } from '@/hooks/state/use-user-filter';
import { canAccessUserData, isAdmin as checkIsAdmin } from '@/lib/utils/permissions';
import type { Category, Budget, User, UserBudgetSummary } from '@/lib/types';
import type { BudgetChartViewModel } from '@/server/use-cases/budgets/budget-chart.logic';
import type { ChartDataPoint } from '../components/budget-chart';
import { useRouter } from '@/i18n/routing';

export interface UseBudgetsContentProps {
  readonly categories: Category[];
  readonly budgets: Budget[];
  readonly currentUser: User;
  readonly groupUsers: User[];
  readonly precalculatedData: Record<string, UserBudgetSummary>;
  readonly chartViewModelsByUser: Record<string, BudgetChartViewModel>;
}

interface PeriodInfo {
  start: string | null;
  end: string | null;
}

export interface UseBudgetsContentReturn {
  readonly router: ReturnType<typeof useRouter>;
  readonly currentUser: User;
  readonly groupUsers: User[];
  readonly budgetContextUserId: string;
  readonly isAdmin: boolean;
  readonly userBudgets: Budget[];
  readonly userBudgetSummary: UserBudgetSummary | null;
  readonly periodInfo: PeriodInfo | null;
  readonly chartAggregateSpent: number;
  readonly chartData: ChartDataPoint[] | null;
  readonly categories: Category[];
  readonly handleCreateBudget: () => void;
  readonly handleSelectUser: (userId: string) => void;
  readonly handleOpenBudgetDetail: (budgetId: string) => void;
  readonly openModal: ReturnType<typeof useModalState>['openModal'];
}

export function useBudgetsContent({
  categories,
  budgets,
  currentUser,
  groupUsers,
  precalculatedData,
  chartViewModelsByUser,
}: UseBudgetsContentProps): UseBudgetsContentReturn {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const { openModal } = useModalState();

  const { budgetsByUser } = useBudgetsByUser({ precalculatedData });
  const userBudgetSummary = budgetsByUser[budgetContextUserId] ?? null;

  const chartViewModel = chartViewModelsByUser[budgetContextUserId];

  const periodInfo = useMemo((): PeriodInfo | null => {
    if (!userBudgetSummary) return null;
    return {
      start: userBudgetSummary.periodStart,
      end: userBudgetSummary.periodEnd,
    };
  }, [userBudgetSummary]);

  const chartAggregateSpent = chartViewModel?.chartAggregateSpent ?? 0;
  const chartData = chartViewModel?.chartData ?? null;

  const handleSelectUser = useCallback(
    (userId: string) => {
      setSelectedGroupFilter(userId);
      router.push(`/budgets?userId=${encodeURIComponent(userId)}`);
    },
    [router, setSelectedGroupFilter]
  );

  const handleOpenBudgetDetail = useCallback(
    (budgetId: string) => {
      router.push(`/budgets/${encodeURIComponent(budgetId)}`);
    },
    [router]
  );

  const handleCreateBudget = useCallback(() => {
    openModal('budget');
  }, [openModal]);

  return {
    router,
    currentUser,
    groupUsers,
    budgetContextUserId,
    isAdmin,
    userBudgets,
    userBudgetSummary,
    periodInfo,
    chartAggregateSpent,
    chartData,
    categories,
    handleCreateBudget,
    handleSelectUser,
    handleOpenBudgetDetail,
    openModal,
  };
}
