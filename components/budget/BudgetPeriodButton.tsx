import { memo } from "react";
import { useBudgets } from "../../hooks";

interface BudgetPeriodButtonProps {
  people?: any[];
}

/**
 * Componente per gestire i periodi di budget
 * Permette di cambiare il periodo visualizzato
 */
export const BudgetPeriodButton = memo<BudgetPeriodButtonProps>(({ people = [] }) => {
  const { navigatePeriod, getPeriodLabel } = useBudgets();

  if (people.length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => navigatePeriod('prev')}
        className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title="Periodo precedente"
      >
        ←
      </button>
      
      <div className="px-4 py-2 text-sm font-medium text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-300 dark:border-gray-600">
        {getPeriodLabel()}
      </div>
      
      <button
        onClick={() => navigatePeriod('next')}
        className="px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        title="Periodo successivo"
      >
        →
      </button>
    </div>
  );
});

BudgetPeriodButton.displayName = "BudgetPeriodButton";
