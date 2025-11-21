"use client";

/**
 * Budgets Content - Client Component
 *
 * Handles interactive budgets UI with client-side state management
 * Data is passed from Server Component for optimal performance
 */

import { useState, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import BottomNavigation from "@/components/layout/bottom-navigation";
import UserSelector from "@/components/shared/user-selector";
import { ConfirmationDialog } from "@/components/shared/confirmation-dialog";
import { BudgetForm, BudgetPeriodManager } from "@/features/budgets";
import {
  BudgetHeader,
  BudgetSelector,
  BudgetDisplayCard,
  BudgetProgress,
  BudgetChart,
  BudgetTransactionsList,
  BudgetEmptyState,
  BudgetSelectorSkeleton,
  BudgetCardSkeleton,
  BudgetProgressSkeleton,
  BudgetChartSkeleton,
  BudgetTransactionsListSkeleton,
} from "@/features/budgets/components";
import { CategoryForm } from "@/features/categories";
import { TransactionForm } from "@/features/transactions";
import { deleteBudgetAction } from "@/features/budgets/actions/budget-actions";
import { Suspense } from "react";
import { budgetStyles } from "@/features/budgets/theme/budget-styles";
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
 * Receives user data from Server Component parent
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

  // Read URL params for initial state
  const initialBudgetId = searchParams.get("budget");
  const initialMember = searchParams.get("member");

  // State management - initialize from URL params
  const [selectedGroupFilter, setSelectedGroupFilter] = useState<string>(initialMember || "all");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedBudgetId, setSelectedBudgetId] = useState<string | null>(initialBudgetId);

  // Form states
  const [isBudgetFormOpen, setIsBudgetFormOpen] = useState(false);
  const [isTransactionFormOpen, setIsTransactionFormOpen] = useState(false);
  const [isCategoryFormOpen, setIsCategoryFormOpen] = useState(false);
  const [isPeriodManagerOpen, setIsPeriodManagerOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>(undefined);
  const [deletingBudget, setDeletingBudget] = useState<Budget | undefined>(undefined);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | undefined>(undefined);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [isDeletingBudget, setIsDeletingBudget] = useState(false);

  // Determine selected user ID
  const selectedUserId = selectedGroupFilter === "all" ? undefined : selectedGroupFilter;

  // Calculate budgets by user using BudgetService
  const budgetsByUser = useMemo(() => {
    return BudgetService.buildBudgetsByUser(groupUsers, budgets, transactions);
  }, [groupUsers, budgets, transactions]);

  // Get selected budget - find from ALL budgets first, then determine filter
  const selectedBudget = useMemo(() => {
    if (selectedBudgetId) {
      // Find budget by ID from all budgets
      const budget = budgets.find((b) => b.id === selectedBudgetId);
      if (budget) return budget;
    }

    // If no selectedBudgetId or not found, get first budget based on filter
    if (selectedGroupFilter === "all") {
      return budgets[0] || null;
    }

    const userBudgets = budgets.filter((b) => b.user_id === selectedGroupFilter);
    return userBudgets[0] || budgets[0] || null;
  }, [selectedBudgetId, selectedGroupFilter, budgets]);

  // Filter budgets for selector dropdown based on selected user
  // If selected budget belongs to a different user, show that user's budgets
  const filteredBudgets = useMemo(() => {
    // Determine which user's budgets to show
    let effectiveFilter = selectedGroupFilter;

    // If we have a selected budget, show budgets for that budget's owner
    if (selectedBudget && selectedGroupFilter !== "all") {
      effectiveFilter = selectedBudget.user_id;
    }

    if (effectiveFilter === "all") {
      return budgets;
    }

    const userBudgets = budgets.filter((b) => b.user_id === effectiveFilter);
    return userBudgets.length > 0 ? userBudgets : budgets;
  }, [budgets, selectedGroupFilter, selectedBudget]);

  // Get budget progress for selected budget
  const selectedBudgetProgress = useMemo(() => {
    if (!selectedBudget) return null;

    const user = groupUsers.find((u) => u.id === selectedBudget.user_id);
    if (!user) return null;

    const userSummary = budgetsByUser[user.id];
    if (!userSummary) return null;

    return userSummary.budgets.find((b) => b.id === selectedBudget.id) || null;
  }, [selectedBudget, groupUsers, budgetsByUser]);

  // Get period info for selected budget
  const periodInfo = useMemo(() => {
    if (!selectedBudget) return null;

    const user = groupUsers.find((u) => u.id === selectedBudget.user_id);
    if (!user) return null;

    const userSummary = budgetsByUser[user.id];
    if (!userSummary) return null;

    return {
      start: userSummary.periodStart,
      end: userSummary.periodEnd,
      activePeriod: userSummary.activePeriod,
    };
  }, [selectedBudget, groupUsers, budgetsByUser]);

  // Create user names map for budget selector
  const userNamesMap = useMemo(() => {
    const map: Record<string, string> = {};
    groupUsers.forEach((user) => {
      map[user.id] = user.name;
    });
    return map;
  }, [groupUsers]);

  // Create account names map
  const accountNamesMap = useMemo(() => {
    const map: Record<string, string> = {};
    accounts.forEach((account) => {
      map[account.id] = account.name;
    });
    return map;
  }, [accounts]);

  // Filter transactions for selected budget (by user and budget criteria)
  const budgetTransactions = useMemo(() => {
    if (!selectedBudget) return [];

    const user = groupUsers.find((u) => u.id === selectedBudget.user_id);
    if (!user) return [];

    const { periodStart, periodEnd } = BudgetService.getBudgetPeriodDates(user);

    // Filter transactions by user first, then by budget criteria
    const userTransactions = transactions.filter((t) => t.user_id === selectedBudget.user_id);

    return BudgetService.filterTransactionsForBudget(userTransactions, selectedBudget, periodStart, periodEnd);
  }, [selectedBudget, groupUsers, transactions]);

  // Group transactions by date
  const groupedTransactions = useMemo((): GroupedTransaction[] => {
    if (budgetTransactions.length === 0) return [];

    // Group by date
    const groupedMap: Record<string, Transaction[]> = {};
    budgetTransactions.forEach((transaction) => {
      const dateKey = new Date(transaction.date).toISOString().split("T")[0];
      if (!groupedMap[dateKey]) {
        groupedMap[dateKey] = [];
      }
      groupedMap[dateKey].push(transaction);
    });

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
    budgetTransactions.forEach((t) => {
      const dateKey = new Date(t.date).toISOString().split("T")[0];
      const amount = t.type === "income" ? -t.amount : t.amount;
      dailySpending[dateKey] = (dailySpending[dateKey] || 0) + amount;
    });

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

  const handleGroupFilterChange = (filter: string) => {
    setSelectedGroupFilter(filter);
    // Clear selected budget to auto-select first budget for new user
    setSelectedBudgetId(null);
  };

  const handleCreateBudget = () => {
    setEditingBudget(undefined);
    setFormMode("create");
    setIsBudgetFormOpen(true);
  };

  const handleEditBudget = () => {
    if (selectedBudget) {
      setEditingBudget(selectedBudget);
      setFormMode("edit");
      setIsBudgetFormOpen(true);
    }
  };

  const handleCreateCategory = () => {
    setIsCategoryFormOpen(true);
  };

  const handleManagePeriod = () => {
    setIsPeriodManagerOpen(true);
  };

  const handleDeleteBudget = (budget: Budget) => {
    setDeletingBudget(budget);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteBudget = async () => {
    if (!deletingBudget) return;

    setIsDeletingBudget(true);
    try {
      const result = await deleteBudgetAction(deletingBudget.id);

      if (result.error) {
        console.error("[BudgetsContent] Delete error:", result.error);
        // Could show error toast here
        return;
      }

      // Success - refresh page and close dialog
      router.refresh();
      setIsDeleteDialogOpen(false);
      setDeletingBudget(undefined);
      // Clear selected budget if it was the one deleted
      if (selectedBudgetId === deletingBudget.id) {
        setSelectedBudgetId(null);
      }
    } catch (error) {
      console.error("[BudgetsContent] Delete error:", error);
    } finally {
      setIsDeletingBudget(false);
    }
  };

  // Get user and budgets for period manager
  const periodManagerUser = useMemo(() => {
    if (!selectedBudget) return null;
    return groupUsers.find((u) => u.id === selectedBudget.user_id) || null;
  }, [selectedBudget, groupUsers]);

  const periodManagerBudgets = useMemo(() => {
    if (!selectedBudget) return [];
    return budgets.filter((b) => b.user_id === selectedBudget.user_id);
  }, [selectedBudget, budgets]);

  return (
    <div className={budgetStyles.page.container}>
      {/* Header with navigation and actions */}
      <BudgetHeader
        isDropdownOpen={isDropdownOpen}
        onOpenChange={setIsDropdownOpen}
        onBackClick={() => router.back()}
        onCreateBudget={handleCreateBudget}
        onCreateCategory={handleCreateCategory}
        onManagePeriod={handleManagePeriod}
        selectedBudget={selectedBudget}
        currentPeriod={periodInfo?.activePeriod || null}
      />

      {/* User Selector */}
      <UserSelector
        users={groupUsers}
        currentUser={currentUser}
        selectedGroupFilter={selectedGroupFilter}
        onGroupFilterChange={handleGroupFilterChange}
      />

      {/* Main content area with progressive loading */}
      <main className={budgetStyles.page.main}>
        {filteredBudgets.length > 0 && selectedBudget ? (
          <>
            {/* Budget selector with fallback skeleton */}
            <Suspense fallback={<BudgetSelectorSkeleton />}>
              <BudgetSelector
                selectedBudget={selectedBudget}
                availableBudgets={filteredBudgets}
                userNamesMap={userNamesMap}
                selectedViewUserId={selectedGroupFilter}
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
                    selectedViewUserId={selectedGroupFilter}
                    periodInfo={
                      periodInfo
                        ? {
                            startDate: periodInfo.start || "",
                            endDate: periodInfo.end,
                          }
                        : null
                    }
                    onEditTransaction={(transaction) => {
                      setEditingTransaction(transaction);
                      setFormMode("edit");
                      setIsTransactionFormOpen(true);
                    }}
                    onDeleteTransaction={() => {
                      /* Handled via transaction form */
                    }}
                    onViewAll={() => {
                      const params = new URLSearchParams();
                      params.set("from", "budgets");
                      if (selectedGroupFilter !== "all") {
                        params.set("member", selectedGroupFilter);
                      }
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
          <BudgetEmptyState onCreateBudget={handleCreateBudget} />
        )}
      </main>

      <BottomNavigation />

      {/* Modal Forms */}
      <TransactionForm
        isOpen={isTransactionFormOpen}
        onOpenChange={setIsTransactionFormOpen}
        transaction={editingTransaction}
        mode={formMode}
        currentUser={currentUser}
        groupUsers={groupUsers}
        accounts={accounts}
        categories={categories}
        groupId={currentUser.group_id}
        selectedUserId={selectedUserId}
        onSuccess={() => router.refresh()}
      />

      <BudgetForm
        isOpen={isBudgetFormOpen}
        onOpenChange={setIsBudgetFormOpen}
        selectedUserId={selectedUserId}
        budget={editingBudget}
        mode={formMode}
        categories={categories}
      />

      <CategoryForm isOpen={isCategoryFormOpen} onOpenChange={setIsCategoryFormOpen} mode="create" />

      {/* Budget Period Manager - Controlled by isPeriodManagerOpen state */}
      {periodManagerUser && (
        <BudgetPeriodManager
          user={periodManagerUser}
          currentPeriod={periodInfo?.activePeriod || null}
          transactions={transactions}
          userBudgets={periodManagerBudgets}
          trigger={
            isPeriodManagerOpen ? (
              <button
                onClick={() => setIsPeriodManagerOpen(false)}
                style={{ display: "none" }}
                ref={(el) => {
                  if (el && isPeriodManagerOpen) {
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
            setIsPeriodManagerOpen(false);
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={isDeleteDialogOpen}
        onCancel={() => setIsDeleteDialogOpen(false)}
        title="Elimina Budget"
        message={
          deletingBudget
            ? `Sei sicuro di voler eliminare il budget "${deletingBudget.description}"? Questa azione non può essere annullata.`
            : ""
        }
        confirmText="Elimina"
        cancelText="Annulla"
        variant="destructive"
        onConfirm={confirmDeleteBudget}
        isLoading={isDeletingBudget}
      />
    </div>
  );
}
