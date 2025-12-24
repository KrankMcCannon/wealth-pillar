"use client";

/**
 * Budgets Content - Client Component
 *
 * Handles interactive budgets UI.
 * Admin can view and manage budgets for all group users.
 * Members can only view and manage their own budgets.
 * Data is passed from Server Component for optimal performance.
 */

import { useState, useMemo, useEffect, Suspense, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BottomNavigation, PageContainer, Header } from "@/components/layout";
import { useFormModal, useDeleteConfirmation, useIdNameMap, usePermissions, useFilteredData, useBudgetsByUser } from "@/hooks";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { EmptyState } from "@/components/shared";
import { BudgetForm, BudgetPeriodManager } from "@/features/budgets";
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
  TransactionForm,
  TransactionDayList,
  TransactionDayListSkeleton,
  type GroupedTransaction,
} from "@/features/transactions";
import { deleteBudgetAction } from "@/features/budgets/actions/budget-actions";
import { budgetStyles } from "@/features/budgets/theme/budget-styles";
import { ShoppingCart, BarChart3 } from "lucide-react";
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
import type { DashboardDataProps } from "@/lib/auth/get-dashboard-data";
import type { Category, Budget, Transaction, Account, BudgetPeriod } from "@/lib/types";
import type { ChartDataPoint } from "@/features/budgets/components/BudgetChart";

/**
 * Budgets Content Props
 */
interface BudgetsContentProps extends DashboardDataProps {
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  accounts: Account[];
}

/**
 * Budgets Content Component
 * Admin can view and manage budgets for all group users.
 * Members can only view and manage their own budgets.
 * Receives user data from Server Component parent.
 */
export default function BudgetsContent({
  currentUser,
  groupUsers,
  categories,
  budgets,
  transactions,
  accounts,
}: BudgetsContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Permission checks
  const { isAdmin } = usePermissions({ currentUser });

  // Read URL params for initial budget selection
  const initialBudgetId = searchParams.get("budget");

  // Filter budgets: admin sees all group budgets, members see only their own
  // Using centralized filtering hook with additional domain filter
  const { filteredData: userBudgets } = useFilteredData({
    data: budgets,
    currentUser,
    selectedUserId: undefined, // Show all for admin, own for member
    additionalFilter: (budget) => budget.amount > 0, // Only budgets with positive amounts
  });

  // Selected budget state - initialized from URL or first available budget
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(() => {
    // Try to use URL parameter if provided
    if (initialBudgetId) {
      // Check if budget exists and is accessible
      const budget = budgets.find((b) => b.id === initialBudgetId);
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

  // Form modal state using hooks
  const budgetModal = useFormModal<Budget>();
  const transactionModal = useFormModal<Transaction>();
  const categoryModal = useFormModal<Category>();
  const periodManagerModal = useFormModal();

  // Period manager selected user state (for admins)
  const [periodManagerUserId, setPeriodManagerUserId] = useState<string>(currentUser.id);

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
    budgets,
    transactions,
    currentUser,
    selectedUserId: selectedBudgetUser.id,
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
    if (!selectedBudget) return [];

    const { periodStart, periodEnd } = BudgetService.getBudgetPeriodDates(selectedBudgetUser);

    // Filter transactions for the budget owner, then by budget criteria
    const userTransactions = transactions.filter((t) => t.user_id === selectedBudgetUser.id);

    return BudgetService.filterTransactionsForBudget(userTransactions, selectedBudget, periodStart, periodEnd);
  }, [selectedBudget, selectedBudgetUser, transactions]);

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
    budgetModal.openCreate();
  };

  const handleEditBudget = () => {
    if (selectedBudget) {
      budgetModal.openEdit(selectedBudget);
    }
  };

  const handleManagePeriod = useCallback(() => {
    periodManagerModal.openCreate();
  }, [periodManagerModal]);

  const handleDeleteBudget = (budget: Budget) => {
    deleteConfirm.openDialog(budget);
  };

  const confirmDeleteBudget = async () => {
    await deleteConfirm.executeDelete(async (budget) => {
      const result = await deleteBudgetAction(budget.id);

      if (result.error) {
        console.error("[BudgetsContent] Delete error:", result.error);
        throw new Error(result.error);
      }

      // Success - refresh page
      router.refresh();
      // Clear selected budget if it was the one deleted
      if (selectedBudgetId === budget.id) {
        setSelectedBudgetId(null);
      }
    });
  };

  // Get data for period manager based on selected user (for admins)
  const periodManagerData = useMemo(() => {
    const targetUser = groupUsers.find((u) => u.id === periodManagerUserId) || currentUser;
    const targetUserBudgets = budgets.filter((b) => b.user_id === targetUser.id && b.amount > 0);
    const targetUserPeriod = targetUser.budget_periods?.find((p: BudgetPeriod) => p.is_active && !p.end_date) || null;

    return {
      targetUser,
      budgets: targetUserBudgets,
      period: targetUserPeriod,
    };
  }, [periodManagerUserId, groupUsers, currentUser, budgets]);

  return (
    <PageContainer className={budgetStyles.page.container}>
      {/* Header with navigation and actions */}
      <Header
        title="Budgets"
        showBack={true}
        className={budgetStyles.header.container}
        data={{
          currentUser: { ...currentUser, role: currentUser.role || 'member' },
          groupUsers,
          accounts,
          categories,
          groupId: currentUser.group_id
        }}
        extraMenuItems={useMemo(() => {
          if (selectedBudget) {
            return [{
              label: periodInfo?.activePeriod ? 'Gestisci Periodo' : 'Inizia Periodo',
              icon: BarChart3,
              onClick: handleManagePeriod
            }];
          }
          return [];
        }, [selectedBudget, periodInfo, handleManagePeriod])}
      />

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
                      transactionModal.openEdit(transaction);
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

      {/* Modal Forms */}
      <TransactionForm
        isOpen={transactionModal.isOpen}
        onOpenChange={transactionModal.setIsOpen}
        transaction={transactionModal.entity}
        mode={transactionModal.mode}
        currentUser={currentUser}
        groupUsers={groupUsers}
        accounts={accounts}
        categories={categories}
        groupId={currentUser.group_id}
        selectedUserId={currentUser.id}
        onSuccess={() => router.refresh()}
      />

      <BudgetForm
        isOpen={budgetModal.isOpen}
        onOpenChange={budgetModal.setIsOpen}
        selectedUserId={currentUser.id}
        budget={budgetModal.entity}
        mode={budgetModal.mode}
        categories={categories}
      />



      {/* Budget Period Manager - Controlled by periodManagerModal */}
      <BudgetPeriodManager
        currentUser={currentUser}
        groupUsers={groupUsers}
        selectedUserId={periodManagerUserId}
        currentPeriod={periodManagerData.period}
        transactions={transactions}
        userBudgets={periodManagerData.budgets}
        onUserChange={setPeriodManagerUserId}
        trigger={
          periodManagerModal.isOpen ? (
            <button
              onClick={periodManagerModal.close}
              style={{ display: "none" }}
              ref={(el) => {
                if (el && periodManagerModal.isOpen) {
                  setTimeout(() => el.click(), 0);
                }
              }}
            />
          ) : (
            <div />
          )
        }
        onSuccess={() => {
          router.refresh();
          periodManagerModal.close();
        }}
      />

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
