import { getCurrentBudgetPeriod } from '../../constants';
import type { Account, Budget, Person, Transaction } from '../../types';
import { TransactionType } from '../../types';
import { BudgetPeriodsUtils } from './budget-periods.utils';

/**
 * Interface per i dati calcolati del budget
 */
export interface BudgetCalculationData {
  currentSpent: number;
  percentage: number;
  remaining: number;
  periodStart: Date;
  periodEnd: Date;
  progressColor: string;
  isCompleted: boolean; // Se il periodo corrente è stato marcato come completato
}

/**
 * Utility class per operazioni sui budget
 * Centralizza la logica di calcolo e gestione dei budget
 */
export class BudgetUtils {
  /**
   * Filtra le transazioni pertinenti per un budget
   */
  static filterTransactionsForBudget(
    transactions: Transaction[],
    budget: Budget,
    periodStart: Date,
    periodEnd: Date,
    getAccountById: (id: string) => Account | undefined
  ): Transaction[] {
    return transactions.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      
      // Verifica se la transazione è nel periodo del budget
      const isInPeriod = transactionDate >= periodStart && transactionDate <= periodEnd;
      
      // Verifica se la transazione appartiene alle categorie del budget
      const isInBudgetCategories = budget.categories.includes(transaction.category);
      
      // Verifica se la transazione appartiene alla persona del budget
      const account = getAccountById(transaction.accountId);
      const isForBudgetPerson = account?.personIds.includes(budget.personId) || false;
      
      // Include solo transazioni di spesa (non entrate)
      const isExpense = transaction.type === TransactionType.SPESA;
      
      return isInPeriod && isInBudgetCategories && isForBudgetPerson && isExpense;
    });
  }

  /**
   * Calcola il totale speso per un budget
   */
  static calculateCurrentSpent(
    transactions: Transaction[],
    budget: Budget,
    periodStart: Date,
    periodEnd: Date,
    getAccountById: (id: string) => Account | undefined,
    getEffectiveTransactionAmount?: (transaction: Transaction) => number
  ): number {
    const relevantTransactions = BudgetUtils.filterTransactionsForBudget(
      transactions,
      budget,
      periodStart,
      periodEnd,
      getAccountById
    );

    return relevantTransactions.reduce((total, transaction) => {
      const amount = getEffectiveTransactionAmount 
        ? getEffectiveTransactionAmount(transaction)
        : transaction.amount;
      return total + Math.abs(amount);
    }, 0);
  }

  /**
   * Calcola la percentuale di utilizzo del budget
   */
  static calculateBudgetPercentage(currentSpent: number, budgetAmount: number): number {
    return budgetAmount > 0 ? (currentSpent / budgetAmount) * 100 : 0;
  }

  /**
   * Calcola l'importo rimanente del budget
   */
  static calculateRemainingAmount(budgetAmount: number, currentSpent: number): number {
    return budgetAmount - currentSpent;
  }

  /**
   * Determina il colore della progress bar basato sulla percentuale
   */
  static getProgressColor(percentage: number): string {
    if (percentage >= 100) return 'bg-red-500';
    if (percentage >= 80) return 'bg-orange-500';
    if (percentage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  /**
   * Calcola tutti i dati necessari per visualizzare il progresso di un budget
   */
  static calculateBudgetData(
    budget: Budget,
    transactions: Transaction[],
    budgetPerson: Person,
    getAccountById: (id: string) => Account | undefined,
    getEffectiveTransactionAmount?: (transaction: Transaction) => number
  ): BudgetCalculationData {
    // Usa il periodo corrente dalla nuova gestione dei periodi
    const currentPeriod = BudgetPeriodsUtils.getCurrentPeriod(budgetPerson);
    const { periodStart, periodEnd } = getCurrentBudgetPeriod(budgetPerson);
    
    const currentSpent = BudgetUtils.calculateCurrentSpent(
      transactions,
      budget,
      periodStart,
      periodEnd,
      getAccountById,
      getEffectiveTransactionAmount
    );
    
    const percentage = BudgetUtils.calculateBudgetPercentage(currentSpent, budget.amount);
    const remaining = BudgetUtils.calculateRemainingAmount(budget.amount, currentSpent);
    const progressColor = BudgetUtils.getProgressColor(percentage);

    return {
      currentSpent,
      percentage,
      remaining,
      periodStart,
      periodEnd,
      progressColor,
      isCompleted: currentPeriod?.isCompleted ?? false
    };
  }

  /**
   * Verifica se un budget è sovrasfruttato
   */
  static isBudgetOverspent(percentage: number): boolean {
    return percentage >= 100;
  }

  /**
   * Verifica se un budget è vicino al limite (>= 80%)
   */
  static isBudgetNearLimit(percentage: number): boolean {
    return percentage >= 80 && percentage < 100;
  }

  /**
   * Ottiene il messaggio di stato del budget
   */
  static getBudgetStatusMessage(percentage: number): string {
    if (percentage >= 100) return 'Budget superato';
    if (percentage >= 80) return 'Budget quasi esaurito';
    if (percentage >= 60) return 'Budget in corso';
    return 'Budget sotto controllo';
  }
}
