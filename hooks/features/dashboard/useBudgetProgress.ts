import { useMemo } from 'react';
import { BudgetUtils, type BudgetCalculationData } from '../../../lib/utils';
import type { Budget, Transaction } from '../../../types';
import { useFinance } from '../../core/useFinance';

/**
 * Hook per gestire la logica di calcolo e visualizzazione dei budget
 * Separare la logica business dalla presentazione UI
 */
export const useBudgetProgress = (budget: Budget) => {
  const { transactions, people, getAccountById, getEffectiveTransactionAmount } = useFinance();

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
      getAccountById,
      getEffectiveTransactionAmount
    );
  }, [budget, transactions, budgetPerson, getAccountById, getEffectiveTransactionAmount]);

  // Calcola le transazioni associate al budget
  const associatedTransactions = useMemo((): Transaction[] => {
    if (!budgetPerson || !budgetData) return [];

    return BudgetUtils.filterTransactionsForBudget(
      transactions,
      budget,
      budgetData.periodStart,
      budgetData.periodEnd,
      getAccountById
    );
  }, [budget, transactions, budgetPerson, budgetData, getAccountById]);

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
    budgetPerson,
    associatedTransactions
  };
};
