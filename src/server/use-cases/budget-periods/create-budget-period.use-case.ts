import type { Account, BudgetPeriod, Transaction } from '@/lib/types';
import { toDateTime } from '@/lib/utils/date-utils';
import { UsersRepository } from '@/server/repositories/users.repository';
import { BudgetPeriodsRepository } from '@/server/repositories/budget-periods.repository';
import { invalidateBudgetPeriodCaches } from '@/lib/utils/cache-utils';
import { DateTime } from 'luxon';
import {
  computePeriodLiquidityAmounts,
  periodToDateWindow,
  snapshotFieldsFromAmounts,
} from './period-amounts.logic';
import { loadPeriodLiquidityData } from './load-period-liquidity-data';

const validateNewPeriod = (userId: string, startDate: string | Date): DateTime => {
  if (!userId) throw new Error('User ID is required');
  if (!startDate) throw new Error('Start date is required');

  const startDt = toDateTime(startDate);
  if (!startDt) throw new Error('Invalid start date format');

  return startDt;
};

async function snapshotAndDeactivateActive(
  active: BudgetPeriod,
  endDate: string,
  transactions: Transaction[],
  accounts: Account[]
): Promise<void> {
  const closedPeriod: BudgetPeriod = { ...active, end_date: endDate, is_active: false };
  const window = periodToDateWindow(closedPeriod);
  const amounts = computePeriodLiquidityAmounts(transactions, accounts, window, active.user_id);

  await BudgetPeriodsRepository.update(active.id, {
    is_active: false,
    end_date: endDate,
    ...snapshotFieldsFromAmounts(amounts),
  });
}

export const createBudgetPeriodUseCase = async (
  userId: string,
  startDate: string | Date
): Promise<BudgetPeriod> => {
  const startDt = validateNewPeriod(userId, startDate);

  const user = await UsersRepository.findById(userId);
  if (!user) throw new Error('User not found');
  if (!user.group_id) throw new Error('User has no group');

  const dayBeforeStart = startDt.minus({ days: 1 }).toISODate() as string;

  const [active, liquidity] = await Promise.all([
    BudgetPeriodsRepository.findActiveByUser(userId),
    loadPeriodLiquidityData(user.group_id, userId),
  ]);
  const { transactions, accounts } = liquidity;

  if (active) {
    await snapshotAndDeactivateActive(active, dayBeforeStart, transactions, accounts);
  }

  const newPeriod = await BudgetPeriodsRepository.create({
    user_id: userId,
    group_id: user.group_id,
    start_date: startDt.toISODate() as string,
    end_date: null,
    is_active: true,
    created_at: new Date(),
    updated_at: new Date(),
  });

  invalidateBudgetPeriodCaches({ userId });

  return newPeriod;
};
