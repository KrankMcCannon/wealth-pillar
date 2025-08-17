import { Budget, Person, Transaction, Account, BudgetCalculationData, BudgetPeriodData } from "../../types";
import { BudgetUtils, BudgetPeriodsUtils } from "../utils";

export interface BudgetCalculationOptions {
  getAccountById: (id: string) => Account | undefined;
  getEffectiveTransactionAmount?: (transaction: Transaction) => number;
}

export interface BudgetPeriodOptions {
  person: Person;
  endDate?: string;
  startDates?: string[];
}

export interface BudgetFormData {
  description: string;
  amount: number;
  categories: string[];
  personId: string;
  period?: string;
}

export class BudgetService {
  /**
   * Calcola i dati di un budget per la visualizzazione
   */
  static calculateBudgetData(
    budget: Budget,
    transactions: Transaction[],
    person: Person,
    options: BudgetCalculationOptions
  ): BudgetCalculationData | null {
    return BudgetUtils.calculateBudgetData(
      budget,
      transactions,
      person,
      options.getAccountById,
      options.getEffectiveTransactionAmount
    );
  }

  /**
   * Calcola i dati di un budget per un periodo specifico (usato in modalità report)
   */
  static calculateBudgetDataForPeriod(
    budget: Budget,
    transactions: Transaction[],
    person: Person,
    selectedPeriod: BudgetPeriodData,
    options: BudgetCalculationOptions
  ): BudgetCalculationData | null {
    return BudgetUtils.calculateBudgetDataForPeriod(
      budget,
      transactions,
      person,
      selectedPeriod,
      options.getAccountById,
      options.getEffectiveTransactionAmount
    );
  }

  /**
   * Filtra le transazioni per un budget specifico
   */
  static filterTransactionsForBudget(
    transactions: Transaction[],
    budget: Budget,
    periodStart: Date,
    periodEnd: Date,
    getAccountById: (id: string) => Account | undefined
  ): Transaction[] {
    return BudgetUtils.filterTransactionsForBudget(transactions, budget, periodStart, periodEnd, getAccountById);
  }

  /**
   * Ottiene il periodo corrente di una persona
   */
  static getCurrentPeriod(person: Person): BudgetPeriodData | null {
    return BudgetPeriodsUtils.getCurrentPeriod(person);
  }

  /**
   * Ottiene tutti i periodi di una persona
   */
  static getBudgetPeriods(person: Person): BudgetPeriodData[] {
    return BudgetPeriodsUtils.getBudgetPeriodsFromDatabase(person);
  }

  /**
   * Marca un periodo come completato
   */
  static markPeriodAsCompleted(person: Person, endDate: string): BudgetPeriodData[] {
    return BudgetPeriodsUtils.markPeriodAsCompleted(person, endDate);
  }

  /**
   * Crea un nuovo periodo
   */
  static createNewPeriod(person: Person, startDates: string[]): BudgetPeriodData[] {
    return BudgetPeriodsUtils.createNewPeriod(person, startDates);
  }

  /**
   * Rimuove un periodo
   */
  static removePeriod(person: Person, startDate: string): BudgetPeriodData[] {
    const periods = this.getBudgetPeriods(person);
    return periods.filter((p) => p.startDate !== startDate);
  }

  /**
   * Formatta una data di periodo
   */
  static formatPeriodDate(startDate: string, endDate?: string): string {
    return BudgetPeriodsUtils.formatPeriodDate(startDate, endDate);
  }

  /**
   * Calcola le statistiche dei periodi
   */
  static calculatePeriodStats(person: Person) {
    const periods = this.getBudgetPeriods(person);
    const currentPeriod = this.getCurrentPeriod(person);

    return {
      total: periods.length,
      completed: periods.filter((p) => p.isCompleted).length,
      current: currentPeriod && !currentPeriod.isCompleted ? 1 : 0,
      hasActivePeriod: !!currentPeriod,
    };
  }

  /**
   * Valida i dati di un budget
   */
  static validateBudgetData(data: Partial<BudgetFormData>): Record<string, string> {
    const errors: Record<string, string> = {};

    if (!data.description?.trim()) {
      errors.description = "La descrizione è obbligatoria";
    }

    if (!data.amount || data.amount <= 0) {
      errors.amount = "L'importo deve essere maggiore di zero";
    }

    if (!data.categories?.length) {
      errors.categories = "Seleziona almeno una categoria";
    }

    if (!data.personId) {
      errors.personId = "La persona è obbligatoria";
    }

    return errors;
  }

  /**
   * Calcola il totale speso per un budget
   */
  static calculateTotalSpent(
    transactions: Transaction[],
    getEffectiveTransactionAmount: (transaction: Transaction) => number
  ): number {
    return transactions.reduce((sum, tx) => sum + Math.abs(getEffectiveTransactionAmount(tx)), 0);
  }

  /**
   * Verifica se un budget può essere completato
   */
  static canCompletePeriod(person: Person): boolean {
    const currentPeriod = this.getCurrentPeriod(person);
    return currentPeriod && !currentPeriod.isCompleted;
  }
}
