import type { BudgetPeriod, Transaction, Account } from '@/lib/types';
import { DateTime } from 'luxon';
import { resolvePeriodAmounts } from './period-amounts.logic';

export const calculatePeriodTotalsUseCase = (
  transactions: Transaction[],
  period: BudgetPeriod,
  startDt: DateTime,
  endDt: DateTime | null,
  accounts: Account[]
): {
  totalSpent: number;
  totalSaved: number;
  categorySpending: Record<string, number>;
} => {
  const periodForResolve: BudgetPeriod = {
    ...period,
    start_date: startDt.toISODate() ?? period.start_date,
    end_date: endDt?.toISODate() ?? period.end_date,
  };

  const amounts = resolvePeriodAmounts(periodForResolve, transactions, accounts);

  return {
    totalSpent: amounts.spendableSpent,
    totalSaved: amounts.reserveSaved,
    categorySpending: amounts.categorySpending,
  };
};
