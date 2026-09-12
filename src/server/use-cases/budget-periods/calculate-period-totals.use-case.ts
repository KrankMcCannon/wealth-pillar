import type { Account, Budget, BudgetPeriod, Transaction } from '@/lib/types';
import { DateTime } from 'luxon';
import { resolvePeriodAmounts } from './period-amounts.logic';
import { categoryKeysFromBudgets } from './period-budgets.logic';

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
  const periodForResolve: BudgetPeriod = {
    ...period,
    start_date: startDt.toISODate() ?? period.start_date,
    end_date: endDt?.toISODate() ?? period.end_date,
  };

  const amounts = resolvePeriodAmounts(
    periodForResolve,
    transactions,
    accounts,
    undefined,
    categoryKeysFromBudgets(budgets)
  );

  return {
    totalSpent: amounts.spendableSpent,
    categorySpending: amounts.categorySpending,
  };
};
