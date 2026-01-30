'use client'

import { useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { usePageDataStore } from "@/stores/page-data-store";
import { useUserFilter, useIdNameMap } from "@/hooks";
import { toDateTime, toDateString, formatDateSmart } from "@/lib/utils/date-utils";
import { Budget, Transaction, Category, User, UserBudgetSummary, Account } from "@/lib/types";

interface UseBudgetSummaryContentProps {
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  accounts: Account[];
  currentUser: User;
  groupUsers: User[];
  precalculatedData?: Record<string, UserBudgetSummary>;
}

export function useBudgetSummaryContent({
  budgets,
  transactions,
  accounts,
  currentUser,
  groupUsers,
  precalculatedData,
}: UseBudgetSummaryContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userIdParam = searchParams.get("userId");

  const { selectedUserId, setSelectedGroupFilter } = useUserFilter();

  // Determine current active user ID (URL > Store > Current User)
  const currentActiveUserId = userIdParam || selectedUserId || currentUser.id;

  // Sync Store with URL on Mount/Update (One-way sync: URL -> Store)
  useEffect(() => {
    if (userIdParam && userIdParam !== selectedUserId) {
      setSelectedGroupFilter(userIdParam);
    } else if (!userIdParam && !selectedUserId) {
      // Initialize store if empty
      setSelectedGroupFilter(currentUser.id);
    }
  }, [userIdParam, selectedUserId, setSelectedGroupFilter, currentUser.id]);

  // Handle User Selection (Explicitly updates URL and Store)
  const handleUserSelect = useCallback((newUserId: string) => {
    // 1. Update Store
    setSelectedGroupFilter(newUserId);

    // 2. Update URL
    const params = new URLSearchParams(searchParams.toString());
    if (newUserId === 'all') {
      params.delete("userId");
    } else {
      params.set("userId", newUserId);
    }
    router.replace(`/budgets/summary?${params.toString()}`);
  }, [searchParams, router, setSelectedGroupFilter]);

  // Identify the target user object
  const targetUser = useMemo(() => {
    if (currentActiveUserId && currentActiveUserId !== 'all') {
      return groupUsers.find(u => u.id === currentActiveUserId) || currentUser;
    }
    return currentUser;
  }, [currentActiveUserId, groupUsers, currentUser]);

  const setBudgets = usePageDataStore((state) => state.setBudgets);

  // Load data into store
  useEffect(() => {
    setBudgets(budgets);
  }, [budgets, setBudgets]);

  // Get User Budget Summary
  const userSummary = useMemo(() => {
    if (precalculatedData && precalculatedData[targetUser.id]) {
      return precalculatedData[targetUser.id];
    }
    return null;
  }, [precalculatedData, targetUser.id]);

  // Filter budgets for this user
  const userBudgets = useMemo(() => {
    return budgets.filter(b => b.user_id === targetUser.id && b.amount > 0);
  }, [budgets, targetUser.id]);

  // Filter transactions
  const userTransactions = useMemo(() => {
    if (!userSummary?.periodStart) return [];

    const start = toDateTime(userSummary.periodStart);
    const end = userSummary.periodEnd ? toDateTime(userSummary.periodEnd) : null;

    let txs = transactions.filter(t => t.user_id === targetUser.id);

    if (start) {
      txs = txs.filter(t => {
        const date = toDateTime(t.date);
        if (!date) return false;
        if (date < start) return false;
        if (end && date > end) return false;
        return true;
      });
    }

    const budgetCategoryIds = new Set(userBudgets.flatMap(b => b.categories));

    return txs.filter(t => budgetCategoryIds.has(t.category));
  }, [transactions, targetUser.id, userSummary, userBudgets]);

  // Group transactions
  const groupedTransactions = useMemo(() => {
    const groupedMap: Record<string, Transaction[]> = {};
    for (const transaction of userTransactions) {
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
        transactions: txs.sort((a, b) => {
          const dtA = toDateTime(a.date);
          const dtB = toDateTime(b.date);
          if (!dtA || !dtB) return 0;
          return dtB.toMillis() - dtA.toMillis();
        }),
        total: txs.reduce((sum, t) => sum + t.amount, 0),
      }));
  }, [userTransactions]);

  const accountNamesMap = useIdNameMap(accounts);

  return {
    userSummary,
    groupedTransactions,
    accountNamesMap,
    currentActiveUserId,
    handleUserSelect,
    targetUser,
    router
  };
}
