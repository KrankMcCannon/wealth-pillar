import { useCallback, useState } from "react";
import type { Budget, BudgetPeriodData } from "../../../types";
import { useFinance } from "../../core/useFinance";
import { useBudgetState } from "./useBudgetState";

/**
 * Hook semplificato per il BudgetProgress
 * Utilizza useBudgetState per i dati e gestisce solo l'UI state
 */
interface Options {
  budgets: Budget[];
  selectedPersonId?: string;
  isReportMode?: boolean;
  selectedPeriod?: BudgetPeriodData;
}

export const useBudgetProgress = (options: Options) => {
  const { budgets, selectedPersonId, isReportMode = false, selectedPeriod } = options;
  const { categories: categoryOptions } = useFinance();

  // Usa il nuovo hook centralizzato per i dati
  const { budgetDataByPerson, selectedPersonData, hasData } = useBudgetState({
    budgets,
    selectedPersonId,
    isReportMode,
    selectedPeriod,
  });

  // Gestione espansione budget (solo UI state)
  const [expandedBudgets, setExpandedBudgets] = useState<Set<string>>(new Set());

  // Toggle espansione budget
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

  // Dati da renderizzare
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
