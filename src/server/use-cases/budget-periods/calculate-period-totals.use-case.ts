import type { BudgetPeriod, Budget, Transaction } from '@/lib/types';
import { DateTime } from 'luxon';
import { filterTransactionsByPeriod } from '../transactions/transaction.logic';
import {
  filterTransactionsForBudgetsUnion,
  effectiveSpentFromTransactions,
} from '../budgets/budget.logic';

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
  const periodTransactions = transactions.filter((t) => t.user_id === period.user_id);
  const filtered = filterTransactionsByPeriod(
    periodTransactions,
    startDt,
    endDt?.endOf('day') ?? null
  );

  const validBudgets = (budgets || []).filter((b) => b.user_id === period.user_id && b.amount > 0);
  const totalBudget = validBudgets.reduce((sum, b) => sum + b.amount, 0);

  const unionTransactions = filterTransactionsForBudgetsUnion(
    filtered,
    validBudgets,
    startDt,
    endDt?.endOf('day') ?? null
  );
  const totalSpent = effectiveSpentFromTransactions(unionTransactions);

  const categorySpending: Record<string, number> = {};
  for (const t of unionTransactions) {
    if (t.type === 'expense' || t.type === 'transfer') {
      categorySpending[t.category] = (categorySpending[t.category] || 0) + t.amount;
    }
  }

  const totalSaved = Math.max(0, totalBudget - totalSpent);

  return { totalSpent, totalSaved, categorySpending };
};
