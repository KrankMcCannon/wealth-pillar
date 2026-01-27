"use client";

import { useEffect, useTransition } from "react";
import type { BudgetPeriod } from "@/lib/types";
import {
  useReportsDataStore,
  useAllBudgetPeriods,
  useActiveBudgetPeriods,
  useHistoricalBudgetPeriods,
} from "@/stores/reports-data-store";
import { deletePeriodAction } from "@/features/budgets";
import { BudgetPeriodCard } from "./budget-period-card";
import { budgetStyles } from "@/styles/system";

interface BudgetPeriodsListProps {
  userId: string;
  initialPeriods: BudgetPeriod[];
}

/**
 * Budget Periods List Component
 * Displays all budget periods for a user with optimistic updates
 *
 * Shows active and historical periods separately.
 * Handles delete action with optimistic UI updates and rollback on error.
 *
 * @param userId - User ID to display periods for
 * @param initialPeriods - Initial periods data from server
 */
export function BudgetPeriodsList({
  userId,
  initialPeriods,
}: Readonly<BudgetPeriodsListProps>) {
  const [isPending, startTransition] = useTransition();
  const { setAllBudgetPeriods, removeBudgetPeriod } = useReportsDataStore();

  // Use optimized selectors
  const periods = useAllBudgetPeriods(userId);
  const activePeriods = useActiveBudgetPeriods(userId);
  const historicPeriods = useHistoricalBudgetPeriods(userId);

  // Initialize store with server data
  useEffect(() => {
    setAllBudgetPeriods(userId, initialPeriods);
  }, [initialPeriods, userId, setAllBudgetPeriods]);

  /**
   * Handle period deletion with optimistic update
   * 1. Immediately remove from UI (optimistic)
   * 2. Call server action
   * 3. On error, rollback and show error message
   */
  const handleDelete = async (periodId: string) => {
    // Optimistic remove from store
    removeBudgetPeriod(userId, periodId);

    // Execute server action
    startTransition(async () => {
      const result = await deletePeriodAction(userId, periodId);

      if (result.error) {
        // Rollback on error - restore original data
        setAllBudgetPeriods(userId, initialPeriods);

        // Show error to user
        alert(`Errore durante l'eliminazione: ${result.error}`);
      }
      // On success, optimistic update is already applied
    });
  };

  return (
    <div className={budgetStyles.periodsList.container}>
      {/* Active Periods Section */}
      {activePeriods.length > 0 && (
        <section>
          <h3 className={budgetStyles.periodsList.sectionTitle}>Periodo Attivo</h3>
          <div className={budgetStyles.periodsList.sectionList}>
            {activePeriods.map((period) => (
              <BudgetPeriodCard
                key={period.id}
                period={period}
                onDelete={() => handleDelete(period.id)}
                showActions={false} // Don't allow deleting active period
              />
            ))}
          </div>
        </section>
      )}

      {/* Historical Periods Section */}
      {historicPeriods.length > 0 && (
        <section>
          <h3 className={budgetStyles.periodsList.sectionTitle}>Storico Periodi</h3>
          <div className={budgetStyles.periodsList.sectionList}>
            {historicPeriods.map((period) => (
              <BudgetPeriodCard
                key={period.id}
                period={period}
                onDelete={() => handleDelete(period.id)}
                showActions={true} // Allow deleting historical periods
              />
            ))}
          </div>
        </section>
      )}

      {/* Empty State */}
      {periods.length === 0 && (
        <div className={budgetStyles.periodsList.emptyContainer}>
          <p className={budgetStyles.periodsList.emptyTitle}>
            Nessun periodo budget trovato
          </p>
          <p className={budgetStyles.periodsList.emptySubtitle}>
            I periodi budget ti permettono di tracciare le tue spese nel tempo
          </p>
        </div>
      )}

      {/* Loading Indicator (shown during delete) */}
      {isPending && (
        <div className={budgetStyles.periodsList.deletingToast}>
          <p className={budgetStyles.periodsList.deletingText}>Eliminazione in corso...</p>
        </div>
      )}
    </div>
  );
}

// Export with displayName for debugging
BudgetPeriodsList.displayName = "BudgetPeriodsList";
