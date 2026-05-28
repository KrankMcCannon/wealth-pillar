'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useUserFilter, useIdNameMap } from '@/hooks';
import { formatDateShort } from '@/lib/utils/date-utils';
import { Transaction, Category, User, UserBudgetSummary, Account } from '@/lib/types';
import type { BudgetChartViewModel } from '@/server/use-cases/budgets/budget-chart.logic';
import { useRouter } from '@/i18n/routing';

interface UseBudgetSummaryContentProps {
  categories: Category[];
  transactions: Transaction[];
  accounts: Account[];
  currentUser: User;
  groupUsers: User[];
  precalculatedData: Record<string, UserBudgetSummary>;
  chartViewModelsByUser: Record<string, BudgetChartViewModel>;
}

export function useBudgetSummaryContent({
  accounts,
  currentUser,
  groupUsers,
  precalculatedData,
  chartViewModelsByUser,
}: UseBudgetSummaryContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const userIdParam = searchParams.get('user') ?? searchParams.get('userId');

  const { selectedUserId, setSelectedGroupFilter } = useUserFilter();

  const currentActiveUserId = userIdParam || selectedUserId || currentUser.id;

  useEffect(() => {
    if (userIdParam && userIdParam !== selectedUserId) {
      setSelectedGroupFilter(userIdParam);
    } else if (!userIdParam && !selectedUserId) {
      setSelectedGroupFilter(currentUser.id);
    }
  }, [userIdParam, selectedUserId, setSelectedGroupFilter, currentUser.id]);

  const handleUserSelect = useCallback(
    (newUserId: string) => {
      setSelectedGroupFilter(newUserId);

      const params = new URLSearchParams(searchParams.toString());
      if (newUserId === 'all') {
        params.delete('user');
        params.delete('userId');
      } else {
        params.set('user', newUserId);
        params.delete('userId');
      }
      router.replace(`/budgets/summary?${params.toString()}`);
    },
    [searchParams, router, setSelectedGroupFilter]
  );

  const targetUser = useMemo(() => {
    if (currentActiveUserId && currentActiveUserId !== 'all') {
      return groupUsers.find((u) => u.id === currentActiveUserId) || currentUser;
    }
    return currentUser;
  }, [currentActiveUserId, groupUsers, currentUser]);

  const userSummary = precalculatedData[targetUser.id] ?? null;

  const chartViewModel = chartViewModelsByUser[targetUser.id];

  const groupedTransactions = useMemo(() => {
    const groups = chartViewModel?.groupedTransactions ?? [];
    return groups.map((g) => ({
      date: g.date,
      formattedDate: formatDateShort(g.date, locale),
      transactions: g.transactions,
      total: g.total,
    }));
  }, [chartViewModel, locale]);

  const accountNamesMap = useIdNameMap(accounts);

  return {
    userSummary,
    groupedTransactions,
    accountNamesMap,
    currentActiveUserId,
    handleUserSelect,
    targetUser,
    router,
  };
}
