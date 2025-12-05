"use client";

/**
 * Budgets Content - Client Component
 *
 * Handles interactive budgets UI for the current user only.
 * Data is passed from Server Component for optimal performance.
 */

import { useState, useMemo, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { BottomNavigation, PageContainer } from "@/components/layout";
import { useFormModal, useDeleteConfirmation, useIdNameMap } from "@/hooks";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { EmptyState } from "@/components/shared";
import { BudgetForm, BudgetPeriodManager } from "@/features/budgets";
import {
  BudgetHeader,
  BudgetSelector,
  BudgetDisplayCard,
  BudgetProgress,
  BudgetChart,
  BudgetTransactionsList,
  BudgetSelectorSkeleton,
  BudgetCardSkeleton,
  BudgetProgressSkeleton,
  BudgetChartSkeleton,
  BudgetTransactionsListSkeleton,
} from "@/features/budgets/components";
import { CategoryForm } from "@/features/categories";
import { TransactionForm } from "@/features/transactions";
import { deleteBudgetAction } from "@/features/budgets/actions/budget-actions";
import { budgetStyles } from "@/features/budgets/theme/budget-styles";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui";
import { BudgetService } from "@/lib/services";
import type { DashboardDataProps } from "@/lib/auth/get-dashboard-data";
import type { Category, Budget, Transaction, Account } from "@/lib/types";
import type { GroupedTransaction } from "@/features/budgets/components/BudgetTransactionsList";
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
 * Manages budgets for the current user only.
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

  // Read URL params for initial budget selection
  const initialBudgetId = searchParams.get("budget");

  // Filter budgets for current user only, showing only budgets with amount > 0
  const userBudgets = useMemo(() => {
    return budgets.filter((b) => b.user_id === currentUser.id && b.amount > 0);
  }, [budgets, currentUser.id]);

  // Selected budget state - initialized from URL or first user budget
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(() => {
    // Check if initialBudgetId belongs to current user
    if (initialBudgetId) {
      const budget = userBudgets.find((b) => b.id === initialBudgetId);
      if (budget) return initialBudgetId;
    }
    return userBudgets[0]?.id || null;
  });

  // Form modal state using hooks
  const budgetModal = useFormModal<Budget>();
  const transactionModal = useFormModal<Transaction>();
  const categoryModal = useFormModal<Category>();
  const periodManagerModal = useFormModal();

  // Delete confirmation state using hook
  const deleteConfirm = useDeleteConfirmation<Budget>();

  // Update selected budget when userBudgets changes (e.g., after delete/create)
  useEffect(() => {
    if (selectedBudgetId && !userBudgets.some((b) => b.id === selectedBudgetId)) {
      setSelectedBudgetId(userBudgets[0]?.id || null);
    }
  }, [userBudgets, selectedBudgetId]);

  // Calculate budget summary for current user using BudgetService
  const userBudgetSummary = useMemo(() => {
    const budgetsByUser = BudgetService.buildBudgetsByUser([currentUser], budgets, transactions);
    return budgetsByUser[currentUser.id] || null;
  }, [currentUser, budgets, transactions]);

  // Get selected budget
  const selectedBudget = useMemo(() => {
    if (selectedBudgetId) {
      return userBudgets.find((b) => b.id === selectedBudgetId) || null;
    }
    return userBudgets[0] || null;
  }, [selectedBudgetId, userBudgets]);

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

  // Filter transactions for selected budget (current user only)
  const budgetTransactions = useMemo(() => {
    if (!selectedBudget) return [];

    const { periodStart, periodEnd } = BudgetService.getBudgetPeriodDates(currentUser);

    // Filter transactions for current user, then by budget criteria
    const userTransactions = transactions.filter((t) => t.user_id === currentUser.id);

    return BudgetService.filterTransactionsForBudget(userTransactions, selectedBudget, periodStart, periodEnd);
  }, [selectedBudget, currentUser, transactions]);

  // Group transactions by date
  const groupedTransactions = useMemo((): GroupedTransaction[] => {
    if (budgetTransactions.length === 0) return [];

    // Group by date
    const groupedMap: Record<string, Transaction[]> = {};
    for (const transaction of budgetTransactions) {
      const dateKey = new Date(transaction.date).toISOString().split("T")[0];
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
        formattedDate: new Date(date).toLocaleDateString("it-IT", {
          weekday: "long",
          day: "numeric",
          month: "long",
        }),
        transactions: txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
        total: txs.reduce((sum, t) => sum + t.amount, 0),
      }));
  }, [budgetTransactions]);

  // Generate chart data from transactions
  const chartData = useMemo((): ChartDataPoint[] | null => {
    if (!periodInfo?.start || budgetTransactions.length === 0) return null;

    const startDate = new Date(periodInfo.start);
    const endDate = periodInfo.end ? new Date(periodInfo.end) : new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Calculate total days in period
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (totalDays <= 0) return null;

    // Group transactions by date and calculate cumulative spending
    // Income transactions reduce spending (refill budget)
    const dailySpending: Record<string, number> = {};
    for (const t of budgetTransactions) {
      const dateKey = new Date(t.date).toISOString().split("T")[0];
      const amount = t.type === "income" ? -t.amount : t.amount;
      dailySpending[dateKey] = (dailySpending[dateKey] || 0) + amount;
    }

    // Generate chart points
    const points: ChartDataPoint[] = [];
    let cumulative = 0;
    const maxAmount = selectedBudgetProgress?.amount || 1;

    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      currentDate.setHours(0, 0, 0, 0);
      const dateKey = currentDate.toISOString().split("T")[0];

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

  const handleCreateCategory = () => {
    categoryModal.openCreate();
  };

  const handleManagePeriod = () => {
    periodManagerModal.openCreate();
  };

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

  // Get user budgets for period manager (current user's budgets)
  const periodManagerBudgets = useMemo(() => {
    return userBudgets;
  }, [userBudgets]);

  return (
    <PageContainer className={budgetStyles.page.container}>
      {/* Header with navigation and actions */}
      <BudgetHeader
        onBackClick={() => router.back()}
        onCreateBudget={handleCreateBudget}
        onCreateCategory={handleCreateCategory}
        onManagePeriod={handleManagePeriod}
        selectedBudget={selectedBudget}
        currentPeriod={periodInfo?.activePeriod || null}
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
                <Suspense fallback={<BudgetTransactionsListSkeleton />}>
                  <BudgetTransactionsList
                    groupedTransactions={groupedTransactions}
                    accountNames={accountNamesMap}
                    categories={categories}
                    transactionCount={selectedBudgetProgress.transactionCount}
                    selectedBudget={selectedBudget}
                    periodInfo={
                      periodInfo
                        ? {
                            startDate: periodInfo.start || "",
                            endDate: periodInfo.end,
                          }
                        : null
                    }
                    onEditTransaction={(transaction) => {
                      transactionModal.openEdit(transaction);
                    }}
                    onDeleteTransaction={() => {
                      /* Handled via transaction form */
                    }}
                    onViewAll={() => {
                      const params = new URLSearchParams();
                      params.set("from", "budgets");
                      params.set("member", currentUser.id);
                      params.set("budget", selectedBudget.id);
                      params.set("category", selectedBudget.description);
                      router.push(`/transactions?${params.toString()}`);
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

      <CategoryForm
        isOpen={categoryModal.isOpen}
        onOpenChange={categoryModal.setIsOpen}
        mode={categoryModal.mode}
        groupId={currentUser.group_id}
      />

      {/* Budget Period Manager - Controlled by periodManagerModal */}
      <BudgetPeriodManager
        user={currentUser}
        currentPeriod={periodInfo?.activePeriod || null}
        transactions={transactions}
        userBudgets={periodManagerBudgets}
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
