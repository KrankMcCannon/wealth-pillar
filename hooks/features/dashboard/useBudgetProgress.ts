import { useMemo } from 'react';
import { BudgetUtils, type BudgetCalculationData } from '../../../lib/utils';
import type { Budget } from '../../../types';
import { useFinance } from '../../core/useFinance';

/**
 * Hook per gestire la logica di calcolo e visualizzazione dei budget
 * Separare la logica business dalla presentazione UI
 */
export const useBudgetProgress = (budget: Budget) => {
  const { transactions, people, getAccountById } = useFinance();

  // Trova la persona associata al budget
  const budgetPerson = useMemo(() => 
    people.find(person => person.id === budget.personId),
    [people, budget.personId]
  );

  // Calcola tutti i dati del budget
  const budgetData = useMemo((): BudgetCalculationData | null => {
    if (!budgetPerson) return null;

    return BudgetUtils.calculateBudgetData(
      budget,
      transactions,
      budgetPerson,
      getAccountById
    );
  }, [budget, transactions, budgetPerson, getAccountById]);

  // Status helpers derivati
  const budgetStatus = useMemo(() => {
    if (!budgetData) return null;

    return {
      isOverspent: BudgetUtils.isBudgetOverspent(budgetData.percentage),
      isNearLimit: BudgetUtils.isBudgetNearLimit(budgetData.percentage),
      statusMessage: BudgetUtils.getBudgetStatusMessage(budgetData.percentage)
    };
  }, [budgetData]);

  return {
    budgetData,
    budgetStatus,
    budgetPerson
  };
};
