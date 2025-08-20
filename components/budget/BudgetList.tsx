import React, { memo } from "react";
import { BudgetCard } from "./BudgetCard";
import { Budget, Transaction } from "../../types";

interface BudgetProgress {
  budget: Budget;
  spent: number;
  remaining: number;
  percentage: number;
  isOverspent: boolean;
  transactions: Transaction[];
  daysInPeriod: number;
  daysRemaining: number;
  projectedSpend: number;
}

interface BudgetListProps {
  budgets: BudgetProgress[];
  expandedBudgets: Set<string>;
  onToggleBudgetExpansion: (budgetId: string) => void;
}

/**
 * Componente per la lista dei budget
 * Gestisce solo il layout e la logica di espansione
 */
export const BudgetList = memo<BudgetListProps>(({ budgets, expandedBudgets, onToggleBudgetExpansion }) => {
  if (budgets.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Nessun budget configurato.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {budgets.map((budgetProgress) => (
        <BudgetCard
          key={budgetProgress.budget.id}
          budget={budgetProgress.budget}
          data={{
            currentSpent: budgetProgress.spent,
            percentage: budgetProgress.percentage,
            remaining: budgetProgress.remaining,
            periodStart: new Date(),
            periodEnd: new Date(),
            progressColor: budgetProgress.isOverspent ? 'red' : 'green',
            isCompleted: budgetProgress.percentage >= 100,
          }}
          transactions={budgetProgress.transactions}
          categories={budgetProgress.budget.categories}
          isExpanded={expandedBudgets.has(budgetProgress.budget.id)}
          onToggleExpansion={() => onToggleBudgetExpansion(budgetProgress.budget.id)}
        />
      ))}
    </div>
  );
});

BudgetList.displayName = "BudgetList";
