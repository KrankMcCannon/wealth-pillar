import React, { memo } from "react";
import { BudgetCard } from "./BudgetCard";
import { BudgetWithCalculatedData } from "../../hooks/features/budgets/useBudgetState";

interface BudgetListProps {
  budgets: BudgetWithCalculatedData[];
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
      {budgets.map(({ budget, data, transactions, categories }) => (
        <BudgetCard
          key={budget.id}
          budget={budget}
          data={data}
          transactions={transactions}
          categories={categories}
          isExpanded={expandedBudgets.has(budget.id)}
          onToggleExpansion={() => onToggleBudgetExpansion(budget.id)}
        />
      ))}
    </div>
  );
});

BudgetList.displayName = "BudgetList";
