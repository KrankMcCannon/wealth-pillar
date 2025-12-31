"use client";

/**
 * Budgets Content - Client Component
 *
 * Handles interactive budgets UI.
 * Admin can view and manage budgets for all group users.
 * Members can only view and manage their own budgets.
 * Data is passed from Server Component for optimal performance.
 */

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BottomNavigation, PageContainer, Header } from "@/components/layout";
import { useDeleteConfirmation, useIdNameMap, usePermissions, useFilteredData, useBudgetsByUser, useUserFilter, useRequiredCurrentUser, useRequiredGroupUsers } from "@/hooks";
import { useModalState } from "@/lib/navigation/url-state";
import UserSelector from "@/components/shared/user-selector";
import { UserSelectorSkeleton } from "@/features/dashboard";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { EmptyState } from "@/components/shared";
import {
  BudgetSelector,
  BudgetDisplayCard,
  BudgetProgress,
  BudgetChart,
  BudgetSelectorSkeleton,
  BudgetCardSkeleton,
  BudgetProgressSkeleton,
  BudgetChartSkeleton,
} from "@/features/budgets/components";
import {
  TransactionDayList,
  TransactionDayListSkeleton,
  type GroupedTransaction,
} from "@/features/transactions";
import { deleteBudgetAction } from "@/features/budgets/actions/budget-actions";
import { budgetStyles } from "@/features/budgets/theme/budget-styles";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui";
import {
  toDateTime,
  toDateString,
  today as luxonToday,
  formatDateSmart,
  formatDateShort,
  diffInDays,
} from "@/lib/utils/date-utils";
import { BudgetService } from "@/lib/services";
import type { Category, Budget, Transaction, Account, BudgetPeriod } from "@/lib/types";
import type { ChartDataPoint } from "@/features/budgets/components/BudgetChart";
import { usePageDataStore } from "@/stores/page-data-store";

/**
 * Budgets Content Props
 */
interface BudgetsContentProps {
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  accounts: Account[];
  budgetPeriods: Map<string, BudgetPeriod | null>;
}

/**
 * Budgets Content Component
 * Admin can view and manage budgets for all group users.
 * Members can only view and manage their own budgets.
 * Receives user data from Server Component parent.
 */
export default function BudgetsContent({
  categories,
  budgets,
  transactions,
  accounts,
  budgetPeriods,
}: BudgetsContentProps) {
  // Read from stores instead of props
  const currentUser = useRequiredCurrentUser();
  const groupUsers = useRequiredGroupUsers();

  const router = useRouter();
  const searchParams = useSearchParams();

  // Page data store - for optimistic updates
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

  // User filtering state management (global context)
  const { selectedUserId } = useUserFilter();

  // Permission checks
  const { isAdmin } = usePermissions({
    currentUser,
    selectedUserId,
  });

  // Read URL params for initial budget selection
  const initialBudgetId = searchParams.get("budget");

  // Filter budgets by selected user
  // Using centralized filtering hook with additional domain filter
  const { filteredData: userBudgets } = useFilteredData({
    data: storeBudgets,
    currentUser,
    selectedUserId, // Use global selected user
    additionalFilter: (budget) => budget.amount > 0, // Only budgets with positive amounts
  });

  // Selected budget state - initialized from URL or first available budget
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(() => {
    // Try to use URL parameter if provided
    if (initialBudgetId) {
      // Check if budget exists and is accessible
      const budget = storeBudgets.find((b) => b.id === initialBudgetId);
      if (budget && budget.amount > 0) {
        // For admin, allow any group user's budget
        if (isAdmin) {
          const groupUserIds = groupUsers.map((u) => u.id);
          if (groupUserIds.includes(budget.user_id)) return initialBudgetId;
        }
        // For members, only their own budget
        if (budget.user_id === currentUser.id) return initialBudgetId;
      }
    }
    return null; // Will be set in useEffect
  });

  // Modal state management (URL-based)
  const { openModal } = useModalState();

  // Delete confirmation state using hook
  const deleteConfirm = useDeleteConfirmation<Budget>();

  // Set first budget if no budget selected
  useEffect(() => {
    if (!selectedBudgetId && userBudgets.length > 0) {
      setSelectedBudgetId(userBudgets[0].id);
    }
  }, [selectedBudgetId, userBudgets]);

  // Update selected budget when userBudgets changes (e.g., after delete/create)
  useEffect(() => {
    if (selectedBudgetId && !userBudgets.some((b) => b.id === selectedBudgetId)) {
      setSelectedBudgetId(userBudgets[0]?.id || null);
    }
  }, [userBudgets, selectedBudgetId]);

  // Get selected budget
  const selectedBudget = useMemo(() => {
    if (selectedBudgetId) {
      return userBudgets.find((b) => b.id === selectedBudgetId) || null;
    }
    return userBudgets[0] || null;
  }, [selectedBudgetId, userBudgets]);

  // Get the user who owns the selected budget
  const selectedBudgetUser = useMemo(() => {
    if (!selectedBudget) return currentUser;
    return groupUsers.find((u) => u.id === selectedBudget.user_id) || currentUser;
  }, [selectedBudget, groupUsers, currentUser]);

  // Calculate budget summary for the selected budget's user using centralized hook
  const { budgetsByUser } = useBudgetsByUser({
    groupUsers: [selectedBudgetUser],
    budgets: storeBudgets,
    transactions,
    currentUser,
    selectedUserId: selectedBudgetUser.id,
    budgetPeriods,
  });
  const userBudgetSummary = budgetsByUser[selectedBudgetUser.id] || null;

  // Get budget progress for selected budget
  const selectedBudgetProgress = useMemo(() => {
    if (!selectedBudget || !userBudgetSummary) return null;
    return userBudgetSummary.budgets.find((b) => b.id === selectedBudget.id) || null;
  }, [selectedBudget, userBudgetSummary]);

  // Get period info for current user
  const periodInfo = useMemo(() => {
    if (!userBudgetSummary) return null;

    return {
      start: userBudgetSummary.periodStart,
      end: userBudgetSummary.periodEnd,
      activePeriod: userBudgetSummary.activePeriod,
    };
  }, [userBudgetSummary]);

  // Create account names map using hook
  const accountNamesMap = useIdNameMap(accounts);

  // Filter transactions for selected budget (based on budget owner)
  const budgetTransactions = useMemo(() => {
    if (!selectedBudget || !periodInfo) return [];

    const periodStart = periodInfo.start ? toDateTime(periodInfo.start) : null;
    const periodEnd = periodInfo.end ? toDateTime(periodInfo.end) : null;

    // Filter transactions for the budget owner, then by budget criteria
    const userTransactions = transactions.filter((t) => t.user_id === selectedBudgetUser.id);

    return BudgetService.filterTransactionsForBudget(userTransactions, selectedBudget, periodStart, periodEnd);
  }, [selectedBudget, selectedBudgetUser, transactions, periodInfo]);

  // Generate subtitle for transaction section
  const transactionSectionSubtitle = useMemo(() => {
    if (periodInfo?.start) {
      const startDt = toDateTime(periodInfo.start);
      const endDt = periodInfo.end ? toDateTime(periodInfo.end) : null;

      const startFormatted = startDt ? formatDateShort(startDt) : "";
      const endFormatted = endDt ? formatDateShort(endDt) : "Oggi";
      return `${startFormatted} - ${endFormatted}`;
    }

    const count = selectedBudgetProgress?.transactionCount ?? 0;
    return `${count} ${count === 1 ? "transazione" : "transazioni"}`;
  }, [periodInfo, selectedBudgetProgress]);

  // Group transactions by date
  const groupedTransactions = useMemo((): GroupedTransaction[] => {
    if (budgetTransactions.length === 0) return [];

    // Group by date
    const groupedMap: Record<string, Transaction[]> = {};
    for (const transaction of budgetTransactions) {
      const dateKey = toDateString(transaction.date);
      if (!groupedMap[dateKey]) {
        groupedMap[dateKey] = [];
      }
      groupedMap[dateKey].push(transaction);
    }

    // Convert to array and sort by date (most recent first)
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
  }, [budgetTransactions]);

  // Generate chart data from transactions
  const chartData = useMemo((): ChartDataPoint[] | null => {
    if (!periodInfo?.start || budgetTransactions.length === 0) return null;

    const startDate = toDateTime(periodInfo.start);
    const endDate = periodInfo.end ? toDateTime(periodInfo.end) : luxonToday();
    const today = luxonToday();

    if (!startDate || !endDate) return null;

    // Calculate total days in period
    const totalDays = diffInDays(startDate, endDate);
    if (totalDays <= 0) return null;

    // Group transactions by date and calculate cumulative spending
    // Income transactions reduce spending (refill budget)
    const dailySpending: Record<string, number> = {};
    for (const t of budgetTransactions) {
      const dateKey = toDateString(t.date);
      const amount = t.type === "income" ? -t.amount : t.amount;
      dailySpending[dateKey] = (dailySpending[dateKey] || 0) + amount;
    }

    // Generate chart points
    const points: ChartDataPoint[] = [];
    let cumulative = 0;
    const maxAmount = selectedBudgetProgress?.amount || 1;

    for (let i = 0; i < totalDays; i++) {
      const currentDate = startDate.plus({ days: i });
      const dateKey = toDateString(currentDate);

      cumulative += dailySpending[dateKey] || 0;
      const isFuture = currentDate > today;

      // Scale to SVG coordinates (350 width, 180 height)
      const x = (i / (totalDays - 1)) * 350;
      const y = 180 - (cumulative / maxAmount) * 150; // Leave some padding at top

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

  // Handlers
  const handleBudgetSelect = (budgetId: string) => {
    setSelectedBudgetId(budgetId);
  };

  const handleCreateBudget = () => {
    openModal("budget");
  };

  const handleEditBudget = () => {
    if (selectedBudget) {
      openModal("budget", selectedBudget.id);
    }
  };

  const handleDeleteBudget = (budget: Budget) => {
    deleteConfirm.openDialog(budget);
  };

  const confirmDeleteBudget = async () => {
    await deleteConfirm.executeDelete(async (budget) => {
      // Optimistic UI update - remove immediately from store
      removeBudget(budget.id);

      try {
        const result = await deleteBudgetAction(budget.id);

        if (result.error) {
          // Revert on error - add back to store
          addBudget(budget);
          console.error("[BudgetsContent] Delete error:", result.error);
          throw new Error(result.error);
        }
        // Success - no router.refresh() needed, store already updated!
        // Clear selected budget if it was the one deleted
        if (selectedBudgetId === budget.id) {
          setSelectedBudgetId(null);
        }
      } catch (error) {
        // Revert on error
        addBudget(budget);
        console.error("[BudgetsContent] Error deleting budget:", error);
        throw error;
      }
    });
  };

  return (
    <PageContainer className={budgetStyles.page.container}>
      {/* Header with navigation and actions */}
      <Header
        title="Budgets"
        showBack={true}
        className={budgetStyles.header.container}
        currentUser={{ name: currentUser.name, role: currentUser.role || 'member' }}
        showActions={true}
      />

      {/* User Selector */}
      <Suspense fallback={<UserSelectorSkeleton />}>
        <UserSelector className="bg-card border-border" />
      </Suspense>

      {/* Main content area with progressive loading */}
      <main className={budgetStyles.page.main}>
        {userBudgets.length > 0 && selectedBudget ? (
          <>
            {/* Budget selector with fallback skeleton */}
            <Suspense fallback={<BudgetSelectorSkeleton />}>
              <BudgetSelector
                selectedBudget={selectedBudget}
                availableBudgets={userBudgets}
                onBudgetSelect={handleBudgetSelect}
              />
            </Suspense>

            {/* Budget display card with period info and metrics */}
            <Suspense fallback={<BudgetCardSkeleton />}>
              <BudgetDisplayCard
                budget={selectedBudget}
                period={periodInfo?.activePeriod || null}
                budgetProgress={
                  selectedBudgetProgress
                    ? {
                      spent: selectedBudgetProgress.spent,
                      remaining: selectedBudgetProgress.remaining,
                      percentage: selectedBudgetProgress.percentage,
                      amount: selectedBudgetProgress.amount,
                    }
                    : null
                }
                onEdit={handleEditBudget}
                onDelete={handleDeleteBudget}
              />
            </Suspense>

            {/* Progressive sections loaded with budget progress */}
            {selectedBudgetProgress && (
              <>
                {/* Progress indicator */}
                <Suspense fallback={<BudgetProgressSkeleton />}>
                  <BudgetProgress
                    progressData={{
                      percentage: selectedBudgetProgress.percentage,
                      spent: selectedBudgetProgress.spent,
                      remaining: selectedBudgetProgress.remaining,
                      amount: selectedBudgetProgress.amount,
                    }}
                  />
                </Suspense>

                {/* Expense trend chart */}
                <Suspense fallback={<BudgetChartSkeleton />}>
                  <BudgetChart
                    spent={selectedBudgetProgress.spent}
                    chartData={chartData}
                    periodInfo={
                      periodInfo
                        ? {
                          startDate: periodInfo.start || "",
                          endDate: periodInfo.end,
                        }
                        : null
                    }
                  />
                </Suspense>

                {/* Grouped transactions list */}
                <Suspense fallback={<TransactionDayListSkeleton itemCount={3} showHeader />}>
                  <TransactionDayList
                    groupedTransactions={groupedTransactions}
                    accountNames={accountNamesMap}
                    categories={categories}
                    sectionTitle="Transazioni Budget"
                    sectionSubtitle={transactionSectionSubtitle}
                    emptyTitle="Nessuna Transazione"
                    emptyDescription="Nessuna transazione trovata per questo budget"
                    expensesOnly
                    showViewAll
                    viewAllLabel="Vedi tutte"
                    onViewAll={() => {
                      const params = new URLSearchParams();
                      params.set("from", "budgets");
                      params.set("member", currentUser.id);
                      params.set("budget", selectedBudget.id);
                      params.set("category", selectedBudget.description);
                      // Pass period dates for custom date range filter
                      if (periodInfo?.start) {
                        params.set("startDate", periodInfo.start);
                      }
                      if (periodInfo?.end) {
                        params.set("endDate", periodInfo.end);
                      }
                      router.push(`/transactions?${params.toString()}`);
                    }}
                    onEditTransaction={(transaction) => {
                      openModal("transaction", transaction.id);
                    }}
                    onDeleteTransaction={() => {
                      /* Handled via transaction form */
                    }}
                  />
                </Suspense>
              </>
            )}
          </>
        ) : (
          <EmptyState
            icon={ShoppingCart}
            title="Nessun budget disponibile"
            description="Crea il tuo primo budget per iniziare"
            action={
              <Button onClick={handleCreateBudget} variant="default" size="sm">
                Crea budget →
              </Button>
            }
          />
        )}
      </main>

      <BottomNavigation />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onCancel={deleteConfirm.closeDialog}
        title="Elimina Budget"
        message={
          deleteConfirm.itemToDelete
            ? `Sei sicuro di voler eliminare il budget "${deleteConfirm.itemToDelete.description}"? Questa azione non può essere annullata.`
            : ""
        }
        confirmText="Elimina"
        cancelText="Annulla"
        variant="destructive"
        onConfirm={confirmDeleteBudget}
        isLoading={deleteConfirm.isDeleting}
      />
    </PageContainer>
  );
}
