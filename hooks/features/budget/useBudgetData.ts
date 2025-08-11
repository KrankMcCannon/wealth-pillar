import { useMemo } from 'react';
import { BudgetUtils, type BudgetCalculationData } from '../../../lib/utils';
import type { Budget, Person, Transaction } from '../../../types';
import { useFinance } from '../../core/useFinance';

interface UseBudgetDataProps {
  budgets: Budget[];
  selectedPersonId?: string;
}

interface BudgetWithData {
  budget: Budget;
  data: BudgetCalculationData;
  transactions: Transaction[];
  categories: string[];
}

interface PersonBudgetData {
  person: Person;
  budgets: BudgetWithData[];
  totalSpent: number;
  totalBudgetAmount: number;
  hasActiveException: boolean;
}

/**
 * Hook centralizzato per gestire tutti i dati relativi ai budget
 * Calcola i dati per tutti i budget di una persona o per tutte le persone
 */
export const useBudgetData = ({ budgets, selectedPersonId }: UseBudgetDataProps) => {
  const { transactions, people, getAccountById, getEffectiveTransactionAmount } = useFinance();

  // Raggruppa i budget per persona e calcola i dati
  const budgetDataByPerson = useMemo((): PersonBudgetData[] => {
    const personMap = new Map<string, PersonBudgetData>();

    budgets.forEach(budget => {
      const person = people.find(p => p.id === budget.personId);
      if (!person) return;

      // Se è specificata una persona, filtra solo i suoi budget
      if (selectedPersonId && person.id !== selectedPersonId) return;

      if (!personMap.has(person.id)) {
        personMap.set(person.id, {
          person,
          budgets: [],
          totalSpent: 0,
          totalBudgetAmount: 0,
          hasActiveException: false
        });
      }

      const personData = personMap.get(person.id)!;

      // Calcola i dati del budget
      const budgetData = BudgetUtils.calculateBudgetData(
        budget,
        transactions,
        person,
        getAccountById,
        getEffectiveTransactionAmount
      );

      if (!budgetData) return;

      // Trova le transazioni associate
      const budgetTransactions = BudgetUtils.filterTransactionsForBudget(
        transactions,
        budget,
        budgetData.periodStart,
        budgetData.periodEnd,
        getAccountById
      );

      // Crea l'oggetto budget con dati
      const budgetWithData: BudgetWithData = {
        budget,
        data: budgetData,
        transactions: budgetTransactions,
        categories: budget.categories
      };

      personData.budgets.push(budgetWithData);
      personData.totalSpent += budgetData.currentSpent;
      personData.totalBudgetAmount += budget.amount;
      personData.hasActiveException = personData.hasActiveException || budgetData.hasException;
    });

    return Array.from(personMap.values());
  }, [budgets, selectedPersonId, transactions, people, getAccountById, getEffectiveTransactionAmount]);

  // Dati della persona selezionata (se specificata)
  const selectedPersonData = useMemo(() => {
    if (!selectedPersonId) return null;
    return budgetDataByPerson.find(data => data.person.id === selectedPersonId) || null;
  }, [budgetDataByPerson, selectedPersonId]);

  // Tutte le categorie uniche utilizzate nei budget
  const allCategories = useMemo(() => {
    const categorySet = new Set<string>();
    budgets.forEach(budget => {
      budget.categories.forEach(cat => categorySet.add(cat));
    });
    return Array.from(categorySet).sort();
  }, [budgets]);

  // Statistiche globali
  const globalStats = useMemo(() => {
    const totalSpent = budgetDataByPerson.reduce((sum, personData) => sum + personData.totalSpent, 0);
    const totalBudgetAmount = budgetDataByPerson.reduce((sum, personData) => sum + personData.totalBudgetAmount, 0);
    const totalPercentage = totalBudgetAmount > 0 ? (totalSpent / totalBudgetAmount) * 100 : 0;

    return {
      totalSpent,
      totalBudgetAmount,
      totalPercentage,
      remaining: totalBudgetAmount - totalSpent,
      personCount: budgetDataByPerson.length,
      budgetCount: budgets.length
    };
  }, [budgetDataByPerson, budgets.length]);

  return {
    budgetDataByPerson,
    selectedPersonData,
    allCategories,
    globalStats,
    hasData: budgetDataByPerson.length > 0
  };
};
