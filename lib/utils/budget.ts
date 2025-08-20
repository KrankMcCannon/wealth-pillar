import { getCurrentBudgetPeriod } from "../../constants";
import type { Account, Budget, Person, Transaction, BudgetPeriodData } from "../../types";
import { TransactionType } from "../../types";

// Combined: BudgetPeriodsUtils + BudgetUtils

export class BudgetPeriodsUtils {
  static getBudgetPeriodsFromDatabase(person: Person): BudgetPeriodData[] {
    return person.budgetPeriods || [];
  }

  static getCurrentPeriod(person: Person): BudgetPeriodData | null {
    const periods = this.getBudgetPeriodsFromDatabase(person);
    const incompletePeriod = periods
      .filter((period) => !period.isCompleted)
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];
    return incompletePeriod || null;
  }

  static markPeriodAsCompleted(person: Person, endDate: string): BudgetPeriodData[] {
    const periods = this.getBudgetPeriodsFromDatabase(person);
    const currentPeriod = this.getCurrentPeriod(person);
    if (!currentPeriod) return periods;

    let updatedPeriods = [...periods];
    const existingPeriodIndex = periods.findIndex((p) => p.startDate === currentPeriod.startDate);

    if (existingPeriodIndex === -1) {
      updatedPeriods.push({ startDate: currentPeriod.startDate, endDate, isCompleted: true });
    } else {
      updatedPeriods[existingPeriodIndex] = { ...currentPeriod, endDate, isCompleted: true };
    }

    // Create next period starting the day after endDate
    const nextStartDate = new Date(endDate);
    nextStartDate.setDate(nextStartDate.getDate() + 1);
    const nextStartDateStr = nextStartDate.toISOString().split("T")[0];
    updatedPeriods.push({ startDate: nextStartDateStr, isCompleted: false });

    return updatedPeriods;
  }

  static calculatePeriodEndDate(person: Person, startDate: string): string {
    const start = new Date(startDate);
    const startDay = start.getDate();
    const nextMonth = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    const endDate = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), Math.min(startDay - 1 || 1, 28));
    return endDate.toISOString().split("T")[0];
  }

  static createNewPeriod(person: Person, startDates: string[]): BudgetPeriodData[] {
    const existing = this.getBudgetPeriodsFromDatabase(person);
    const newPeriods = startDates.map((startDate) => ({ startDate, isCompleted: false }));
    return [...existing, ...newPeriods];
  }

  static formatPeriodDate(startDate: Date | string, endDate?: Date | string): string {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : undefined;
    const fmt = (d: Date) => d.toLocaleDateString("it-IT", { year: "numeric", month: "long", day: "numeric" });
    return end ? `${fmt(start)} - ${fmt(end)}` : fmt(start);
  }

  static calculateFirstPeriodStartDate(_person: Person, budgetStartDay: number): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const start = new Date(year, month, Math.min(Math.max(budgetStartDay, 1), 28));
    if (today < start) start.setMonth(start.getMonth() - 1);
    return start.toISOString().split("T")[0];
  }
}

// Re-export type to preserve existing imports
export interface BudgetCalculationData {
  currentSpent: number;
  percentage: number;
  remaining: number;
  periodStart: Date;
  periodEnd: Date;
  progressColor: string;
  isCompleted: boolean;
}

export class BudgetUtils {
  static filterTransactionsForBudget(
    transactions: Transaction[],
    budget: Budget,
    periodStart: Date,
    periodEnd: Date,
    getAccountById: (id: string) => Account | undefined
  ): Transaction[] {
    return transactions.filter((transaction) => {
      const transactionDate = new Date(transaction.date);
      const isInPeriod = transactionDate >= periodStart && transactionDate <= periodEnd;
      const isInBudgetCategories = budget.categories.includes(transaction.category);
      const account = getAccountById(transaction.accountId);
      const isForBudgetPerson = account?.personIds.includes(budget.personId) || false;
      const isExpense = transaction.type === TransactionType.SPESA;
      return isInPeriod && isInBudgetCategories && isForBudgetPerson && isExpense;
    });
  }

  static calculateCurrentSpent(
    transactions: Transaction[],
    budget: Budget,
    periodStart: Date,
    periodEnd: Date,
    getAccountById: (id: string) => Account | undefined
  ): number {
    return this.filterTransactionsForBudget(transactions, budget, periodStart, periodEnd, getAccountById)
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  }

  static calculateBudgetPercentage(spent: number, total: number): number {
    return total > 0 ? (spent / total) * 100 : 0;
  }

  static calculateRemainingAmount(total: number, spent: number): number {
    return Math.max(0, total - spent);
  }

  static getProgressColor(percentage: number): string {
    if (percentage >= 100) return "red";
    if (percentage >= 90) return "orange";
    if (percentage >= 75) return "yellow";
    return "green";
  }

  static calculateBudgetData(
    transactions: Transaction[],
    budget: Budget,
    getAccountById: (id: string) => Account | undefined,
    budgetOwner: Person
  ): BudgetCalculationData {
    const { periodStart, periodEnd } = getCurrentBudgetPeriod(budgetOwner);

    const currentSpent = BudgetUtils.calculateCurrentSpent(transactions, budget, periodStart, periodEnd, getAccountById);
    const percentage = BudgetUtils.calculateBudgetPercentage(currentSpent, budget.amount);
    const remaining = BudgetUtils.calculateRemainingAmount(budget.amount, currentSpent);
    const progressColor = BudgetUtils.getProgressColor(percentage);

    return { currentSpent, percentage, remaining, periodStart, periodEnd, progressColor, isCompleted: percentage >= 100 };
  }

  static calculateBudgetDataForPeriod(
    transactions: Transaction[],
    budget: Budget,
    getAccountById: (id: string) => Account | undefined,
    selectedPeriod: { periodStart: Date; periodEnd: Date }
  ): BudgetCalculationData {
    const { periodStart, periodEnd } = selectedPeriod;
    const currentSpent = BudgetUtils.calculateCurrentSpent(transactions, budget, periodStart, periodEnd, getAccountById);
    const percentage = BudgetUtils.calculateBudgetPercentage(currentSpent, budget.amount);
    const remaining = BudgetUtils.calculateRemainingAmount(budget.amount, currentSpent);
    const progressColor = BudgetUtils.getProgressColor(percentage);
    return { currentSpent, percentage, remaining, periodStart, periodEnd, progressColor, isCompleted: percentage >= 100 };
  }
}
