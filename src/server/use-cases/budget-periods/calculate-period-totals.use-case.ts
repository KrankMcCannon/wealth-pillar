import type { Account, Budget, BudgetPeriod, Transaction } from '@/lib/types';
import { DateTime } from 'luxon';
import { calculatePeriodBudgetRollup } from '../budgets/budget.logic';

export const calculatePeriodTotalsUseCase = (
  transactions: Transaction[],
  period: BudgetPeriod,
  startDt: DateTime,
  endDt: DateTime | null,
  accounts: Account[],
  budgets: Budget[] = []
): {
  totalSpent: number;
  categorySpending: Record<string, number>;
} => {
  const rollup = calculatePeriodBudgetRollup(
    budgets,
    transactions,
    startDt,
    endDt ?? startDt,
    accounts,
    period.user_id
  );

  return {
    totalSpent: rollup.spent,
    categorySpending: rollup.categorySpending,
  };
};
