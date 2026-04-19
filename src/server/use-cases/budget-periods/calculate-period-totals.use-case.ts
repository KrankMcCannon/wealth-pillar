import type { BudgetPeriod, Budget, Transaction } from '@/lib/types';
import { toDateTime } from '@/lib/utils/date-utils';
import { DateTime } from 'luxon';

export const calculatePeriodTotalsUseCase = (
  transactions: Transaction[],
  period: BudgetPeriod,
  startDt: DateTime,
  endDt: DateTime | null,
  budgets: Budget[]
): {
  totalSpent: number;
  totalSaved: number;
  categorySpending: Record<string, number>;
} => {
  // Filter transactions for this period and user
  const periodTransactions = transactions.filter((t) => {
    const txDate = toDateTime(t.date);
    if (!txDate || t.user_id !== period.user_id) return false;

    const afterStart = txDate >= startDt;
    const beforeEnd = endDt ? txDate <= endDt.endOf('day') : true;
    return afterStart && beforeEnd;
  });

  let totalSpent = 0;
  let totalBudget = 0;
  const categorySpending: Record<string, number> = {};

  // Filter valid budgets (amount > 0) for the target user
  const validBudgets = (budgets || []).filter((b) => b.user_id === period.user_id && b.amount > 0);

  const txsByCategory = new Map<string, Transaction[]>();
  for (const t of periodTransactions) {
    const list = txsByCategory.get(t.category) ?? [];
    list.push(t);
    txsByCategory.set(t.category, list);
  }

  // Calculate totals by processing each budget individually (matches modal logic)
  validBudgets.forEach((budget) => {
    totalBudget += budget.amount;

    const budgetTransactions = budget.categories.flatMap((c) => txsByCategory.get(c) ?? []);

    // Calculate spent for this budget (income refills, expense/transfer consume)
    const budgetSpent = budgetTransactions.reduce((sum, t) => {
      if (t.type === 'income') {
        return sum - t.amount;
      }
      return sum + t.amount;
    }, 0);

    // Add to total spent (ensuring non-negative per budget)
    totalSpent += Math.max(0, budgetSpent);

    // Track category spending (only for expenses and transfers)
    budgetTransactions.forEach((t) => {
      if (t.type === 'expense' || t.type === 'transfer') {
        categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
      }
    });
  });

  const totalSaved = Math.max(0, totalBudget - totalSpent);

  return { totalSpent, totalSaved, categorySpending };
};
