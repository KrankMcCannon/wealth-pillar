import { useMemo, useCallback } from "react";
import { Budget, Person, Transaction, BudgetCalculationData } from "../../../types";
import { BudgetService, BudgetCalculationOptions, PeriodFilteringService } from "../../../lib/services";
import { useFinance } from "../../core/useFinance";

export interface BudgetStateOptions {
  budgets: Budget[];
  selectedPersonId?: string;
  isReportMode?: boolean;
  selectedPeriod?: any;
}

export interface BudgetWithCalculatedData {
  budget: Budget;
  data: BudgetCalculationData;
  transactions: Transaction[];
  categories: string[];
}

export interface PersonBudgetState {
  person: Person;
  budgets: BudgetWithCalculatedData[];
  totalSpent: number;
  totalBudgetAmount: number;
  hasCompletedPeriods: boolean;
  currentPeriod: any;
  periodStats: any;
  allCategories: string[];
  allTransactions: Transaction[];
}

export interface BudgetState {
  budgetDataByPerson: PersonBudgetState[];
  selectedPersonData: PersonBudgetState | null;
  allCategories: string[];
  globalStats: {
    totalSpent: number;
    totalBudgetAmount: number;
    totalPercentage: number;
    remaining: number;
    personCount: number;
    budgetCount: number;
  };
  hasData: boolean;
}

/**
 * Hook centralizzato per gestire lo stato dei budget
 * Sostituisce useBudgetData e riduce la complessità degli altri hooks
 */
export const useBudgetState = (options: BudgetStateOptions): BudgetState => {
  const { budgets, selectedPersonId, isReportMode = false, selectedPeriod } = options;
  const { transactions, people, getAccountById, getEffectiveTransactionAmount } = useFinance();

  const calculationOptions: BudgetCalculationOptions = useMemo(
    () => ({
      getAccountById,
      getEffectiveTransactionAmount,
    }),
    [getAccountById, getEffectiveTransactionAmount]
  );

  // Filtra le transazioni per periodo se siamo in modalità report
  const filteredTransactions = useMemo(() => {
    if (!isReportMode || !selectedPeriod) {
      return transactions;
    }

    const periodStart = new Date(selectedPeriod.startDate);
    const periodEnd = selectedPeriod.endDate ? new Date(selectedPeriod.endDate) : new Date();

    return transactions.filter((tx) => {
      const txDate = new Date(tx.date);
      return txDate >= periodStart && txDate <= periodEnd;
    });
  }, [transactions, isReportMode, selectedPeriod]);

  // Calcola i dati per tutti i budget raggruppati per persona
  const budgetDataByPerson = useMemo((): PersonBudgetState[] => {
    const personMap = new Map<string, PersonBudgetState>();

    // Filtra i budget usando il nuovo servizio
    const filteredBudgets = PeriodFilteringService.filterBudgetsForPeriod(
      budgets,
      selectedPeriod,
      people,
      selectedPersonId
    );

    filteredBudgets.forEach((budget) => {
      const person = people.find((p) => p.id === budget.personId);
      if (!person) return;

      // Verifica se il budget dovrebbe essere mostrato
      if (!PeriodFilteringService.shouldShowBudget(budget, { selectedPeriod, selectedPersonId, isReportMode }, people))
        return;

      if (!personMap.has(person.id)) {
        const currentPeriod = BudgetService.getCurrentPeriod(person);
        const periodStats = BudgetService.calculatePeriodStats(person);

        personMap.set(person.id, {
          person,
          budgets: [],
          totalSpent: 0,
          totalBudgetAmount: 0,
          hasCompletedPeriods: false,
          currentPeriod,
          periodStats,
          allCategories: [],
          allTransactions: [],
        });
      }

      const personData = personMap.get(person.id)!;

      // Usa transazioni filtrate per il periodo specifico del budget se in modalità report
      const budgetSpecificTransactions =
        isReportMode && selectedPeriod
          ? PeriodFilteringService.filterTransactionsForBudgetPeriod(transactions, selectedPeriod, budget, people)
          : filteredTransactions;

      // Calcola i dati del budget usando il metodo appropriato per la modalità
      const budgetData =
        isReportMode && selectedPeriod
          ? BudgetService.calculateBudgetDataForPeriod(
              budget,
              budgetSpecificTransactions,
              person,
              selectedPeriod,
              calculationOptions
            )
          : BudgetService.calculateBudgetData(budget, budgetSpecificTransactions, person, calculationOptions);

      if (!budgetData) return;

      // Trova le transazioni associate
      const budgetTransactions = BudgetService.filterTransactionsForBudget(
        budgetSpecificTransactions,
        budget,
        budgetData.periodStart,
        budgetData.periodEnd,
        getAccountById
      );

      // Crea l'oggetto budget con dati
      const budgetWithData: BudgetWithCalculatedData = {
        budget,
        data: budgetData,
        transactions: budgetTransactions,
        categories: budget.categories,
      };

      personData.budgets.push(budgetWithData);
      personData.totalSpent += budgetData.currentSpent;
      personData.totalBudgetAmount += budget.amount;
      personData.hasCompletedPeriods = personData.hasCompletedPeriods || budgetData.isCompleted;

      // Aggiungi categorie uniche
      budget.categories.forEach((cat) => {
        if (!personData.allCategories.includes(cat)) {
          personData.allCategories.push(cat);
        }
      });

      // Aggiungi transazioni uniche
      budgetTransactions.forEach((tx) => {
        if (!personData.allTransactions.find((t) => t.id === tx.id)) {
          personData.allTransactions.push(tx);
        }
      });
    });

    // Ordina le categorie per ogni persona
    personMap.forEach((personData) => {
      personData.allCategories.sort();
    });

    return Array.from(personMap.values());
  }, [
    budgets,
    selectedPersonId,
    filteredTransactions,
    people,
    calculationOptions,
    getAccountById,
    isReportMode,
    selectedPeriod,
    transactions,
  ]);

  // Dati della persona selezionata
  const selectedPersonData = useMemo(() => {
    if (!selectedPersonId || selectedPersonId === "all") return null;
    return budgetDataByPerson.find((data) => data.person.id === selectedPersonId) || null;
  }, [budgetDataByPerson, selectedPersonId]);

  // Tutte le categorie uniche globali
  const allCategories = useMemo(() => {
    const categorySet = new Set<string>();
    budgets.forEach((budget) => {
      budget.categories.forEach((cat) => categorySet.add(cat));
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
      budgetCount: budgets.length,
    };
  }, [budgetDataByPerson, budgets.length]);

  return {
    budgetDataByPerson,
    selectedPersonData,
    allCategories,
    globalStats,
    hasData: budgetDataByPerson.length > 0,
  };
};
