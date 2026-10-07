import type { Account, Budget, BudgetPeriod, Transaction } from '@/lib/types';
import { toDateTime } from '@/lib/utils/date-utils';
import { db } from '@/server/db/drizzle';
import type { DbExecutor } from '@/server/repositories/db-executor';
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
import { getBudgetsByUserUseCase } from '../budgets/get-budgets.use-case';
import { categoryKeysFromBudgets, toBudgetsSnapshot } from './period-budgets.logic';

const validateNewPeriod = (userId: string, startDate: string | Date): DateTime => {
  if (!userId) throw new Error('User ID is required');
  if (!startDate) throw new Error('Start date is required');

  const startDt = toDateTime(startDate);
  if (!startDt) throw new Error('Invalid start date format');

  const today = DateTime.now().startOf('day');

  if (startDt.startOf('day') > today) {
    throw new Error('Budget period cannot start in the future');
  }

  return startDt.startOf('day');
};

async function snapshotAndDeactivateActive(
  active: BudgetPeriod,
  endDate: string,
  transactions: Transaction[],
  accounts: Account[],
  budgets: Budget[],
  executor: DbExecutor
): Promise<void> {
  const closedPeriod: BudgetPeriod = {
    ...active,
    end_date: endDate,
    is_active: false,
  };

  const window = periodToDateWindow(closedPeriod);

  const amounts = computePeriodLiquidityAmounts(
    transactions,
    accounts,
    window,
    active.user_id,
    categoryKeysFromBudgets(budgets),
    budgets
  );

  await BudgetPeriodsRepository.update(
    active.id,
    {
      is_active: false,
      end_date: endDate,
      ...snapshotFieldsFromAmounts(amounts),
      budgets_snapshot: toBudgetsSnapshot(budgets),
    },
    executor
  );
}

export const createBudgetPeriodUseCase = async (
  userId: string,
  startDate: string | Date
): Promise<BudgetPeriod> => {
  const startDt = validateNewPeriod(userId, startDate);

  const user = await UsersRepository.findById(userId);

  if (!user) throw new Error('User not found');
  if (!user.group_id) throw new Error('User has no group');

  const [liquidity, budgets] = await Promise.all([
    loadPeriodLiquidityData(user.group_id, userId),
    getBudgetsByUserUseCase(userId),
  ]);

  const { transactions, accounts } = liquidity;

  const newPeriod = await db.transaction(async (tx) => {
    const active = await BudgetPeriodsRepository.findActiveByUser(userId, tx);

    if (active) {
      const activeStart = toDateTime(active.start_date);

      if (!activeStart) {
        throw new Error('Current budget period has an invalid start date');
      }

      if (startDt <= activeStart.startOf('day')) {
        throw new Error('New budget period must start after the current period');
      }

      const dayBeforeStart = startDt.minus({ days: 1 }).toISODate();

      if (!dayBeforeStart) {
        throw new Error('Invalid budget period closing date');
      }

      await snapshotAndDeactivateActive(
        active,
        dayBeforeStart,
        transactions,
        accounts,
        budgets,
        tx
      );
    }

    return BudgetPeriodsRepository.create(
      {
        user_id: userId,
        group_id: user.group_id,
        start_date: startDt.toISODate() as string,
        end_date: null,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
      tx
    );
  });

  invalidateBudgetPeriodCaches({ userId });

  return newPeriod;
};
