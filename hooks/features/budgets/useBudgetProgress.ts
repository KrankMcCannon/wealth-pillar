import { useCallback, useState } from 'react';
import type { Budget } from '../../../types';
import { useFinance } from '../../core/useFinance';
import { useBudgetData } from './useBudgetData';

/**
 * Hook that encapsulates state and derived data used by the BudgetProgress
 * component. It manages expansion of individual budgets and delegates
 * calculation of per-person budget data to the existing useBudgetData hook.
 */
interface Options {
  budgets: Budget[];
  selectedPersonId?: string;
}

export const useBudgetProgress = (options: Options) => {
  const { budgets, selectedPersonId } = options;
  const { categories: categoryOptions } = useFinance();
  const { budgetDataByPerson, selectedPersonData, hasData } = useBudgetData({
    budgets,
    selectedPersonId,
  });
  // Track which budgets are expanded in the UI
  const [expandedBudgets, setExpandedBudgets] = useState<Set<string>>(new Set());

  /**
   * Toggle the expansion of a budget card. Uses a Set to track IDs of
   * expanded budgets, ensuring constant-time lookup and mutation. Wrapped in
   * useCallback to prevent unnecessary re-renders when passed to children.
   */
  const toggleBudgetExpansion = useCallback((budgetId: string) => {
    setExpandedBudgets((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(budgetId)) {
        newSet.delete(budgetId);
      } else {
        newSet.add(budgetId);
      }
      return newSet;
    });
  }, []);

  // Data to render: either single selected person or all persons
  const dataToRender = selectedPersonData ? [selectedPersonData] : budgetDataByPerson;

  return {
    categoryOptions,
    budgetDataByPerson,
    selectedPersonData,
    hasData,
    expandedBudgets,
    toggleBudgetExpansion,
    dataToRender,
  };
};