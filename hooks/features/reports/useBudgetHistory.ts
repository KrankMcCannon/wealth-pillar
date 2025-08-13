import { useMemo } from 'react';
import { BudgetUtils } from '../../../lib/utils';
import { Budget, Person } from '../../../types';
import { useFinance } from '../../core/useFinance';

interface UseBudgetHistoryProps {
  selectedPersonId?: string;
  selectedYear: number;
}

interface MonthlyBudgetData {
  month: string;
  monthNumber: number;
  budgets: Array<{
    budget: Budget;
    person: Person;
    data: any;
    transactions: any[];
    categories: string[];
  }>;
}

/**
 * Hook per gestire lo storico dei budget
 * Principio SRP: Single Responsibility - gestisce solo i dati storici dei budget
 * Principio DRY: Don't Repeat Yourself - riutilizza BudgetUtils esistenti
 */
export const useBudgetHistory = ({ selectedPersonId, selectedYear }: UseBudgetHistoryProps) => {
  const { budgets, people, transactions, getAccountById, getEffectiveTransactionAmount } = useFinance();

  // Filtra i budget per persona se specificata
  const filteredBudgets = useMemo(() => {
    if (!selectedPersonId) return budgets;
    return budgets.filter(budget => budget.personId === selectedPersonId);
  }, [budgets, selectedPersonId]);

  // Genera lo storico mensile dei budget per l'anno selezionato
  const monthlyBudgetHistory = useMemo((): MonthlyBudgetData[] => {
    const months = [];
    
    // Genera i 12 mesi dell'anno selezionato
    for (let month = 0; month < 12; month++) {
      const monthDate = new Date(selectedYear, month, 1);
      const monthName = monthDate.toLocaleDateString('it-IT', { month: 'long' });
      
      const monthlyBudgets = filteredBudgets.map(budget => {
        const person = people.find(p => p.id === budget.personId);
        if (!person) return null;

        // Calcola i dati del budget per questo mese
        const budgetData = BudgetUtils.calculateBudgetData(
          budget,
          transactions,
          person,
          getAccountById,
          getEffectiveTransactionAmount
        );

        // Filtra le transazioni per questo mese specifico
        const monthlyTransactions = BudgetUtils.filterTransactionsForBudget(
          transactions,
          budget,
          budgetData.periodStart,
          budgetData.periodEnd,
          getAccountById
        ).filter(tx => {
          const txDate = new Date(tx.date);
          return txDate.getFullYear() === selectedYear && txDate.getMonth() === month;
        });

        return {
          budget,
          person,
          data: budgetData,
          transactions: monthlyTransactions,
          categories: budget.categories
        };
      }).filter(Boolean);

      months.push({
        month: monthName,
        monthNumber: month + 1,
        budgets: monthlyBudgets
      });
    }

    return months;
  }, [filteredBudgets, people, transactions, selectedYear, getAccountById]);

  // Calcola statistiche aggregate
  const aggregateStats = useMemo(() => {
    const allBudgets = monthlyBudgetHistory.flatMap(month => month.budgets);
    
    const totalBudgetAmount = allBudgets.reduce((sum, item) => sum + item.budget.amount, 0);
    const totalSpent = allBudgets.reduce((sum, item) => sum + item.data.currentSpent, 0);
    const totalTransactions = allBudgets.reduce((sum, item) => sum + item.transactions.length, 0);

    return {
      totalBudgetAmount,
      totalSpent,
      totalTransactions,
      utilizationRate: totalBudgetAmount > 0 ? (totalSpent / totalBudgetAmount) * 100 : 0
    };
  }, [monthlyBudgetHistory]);

  return {
    monthlyBudgetHistory,
    aggregateStats,
    hasData: monthlyBudgetHistory.some(month => month.budgets.length > 0)
  };
};
