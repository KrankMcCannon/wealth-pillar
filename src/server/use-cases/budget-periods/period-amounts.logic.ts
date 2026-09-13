import type { Account, Budget, BudgetPeriod, PeriodLiquidityAmounts, Transaction } from '@/lib/types';
import { foldPeriodAmounts } from '@/server/ledger';
import { roundMoney } from '@/lib/utils/money';
import { parsePeriodDates } from '../shared/period.logic';
import type { DateWindow } from '../reports/report.logic';
import { calculatePeriodBudgetRollup } from '../budgets/budget.logic';
import { categoryKeysFromBudgets, parseBudgetsSnapshot } from './period-budgets.logic';

export function periodToDateWindow(period: BudgetPeriod, now?: Date): DateWindow {
  const [start, end] = parsePeriodDates(period, now);
  return { start: start.toJSDate(), end: end.toJSDate() };
}

/**
 * Envelope spend for a period window (same rollup as leftover and active budgets).
 * Pass `budgets` so spent is the sum of envelope cards. Category-key-only
 * callers keep the union fold for tests and unscoped snapshots.
 */
export function computePeriodLiquidityAmounts(
  transactions: Transaction[],
  accounts: Account[],
  window: DateWindow,
  userId: string,
  categoryKeys?: Set<string>,
  budgets?: Budget[]
): PeriodLiquidityAmounts {
  if (budgets) {
    const rollup = calculatePeriodBudgetRollup(
      budgets,
      transactions,
      window.start,
      window.end,
      accounts,
      userId
    );
    return {
      spendableSpent: rollup.spent,
      categorySpending: rollup.categorySpending,
    };
  }

  const folded = foldPeriodAmounts(transactions, accounts, window, userId, categoryKeys);
  return {
    spendableSpent: folded.spent,
    categorySpending: folded.categorySpending,
  };
}

function liveCategoryKeys(period: BudgetPeriod, categoryKeys?: Set<string>): Set<string> | undefined {
  if (categoryKeys) return categoryKeys;
  const snapshot = parseBudgetsSnapshot(period.budgets_snapshot);
  if (snapshot) return categoryKeysFromBudgets(snapshot);
  return undefined;
}

/**
 * Frozen spend is only for closed periods. An open row may still have leftover
 * snapshot_at from a neighbor date edit — ignore it.
 */
export function periodHasFrozenSnapshot(period: BudgetPeriod): boolean {
  return period.end_date != null && period.snapshot_at != null;
}

/**
 * Returns frozen snapshot for closed periods, or live computation for active/open periods.
 */
export function resolvePeriodAmounts(
  period: BudgetPeriod,
  transactions: Transaction[],
  accounts: Account[],
  now?: Date,
  categoryKeys?: Set<string>
): PeriodLiquidityAmounts {
  if (periodHasFrozenSnapshot(period)) {
    const rawCategories = period.category_spending;
    const categorySpending: Record<string, number> =
      rawCategories && typeof rawCategories === 'object' && !Array.isArray(rawCategories)
        ? Object.fromEntries(
            Object.entries(rawCategories as Record<string, unknown>).map(([k, v]) => [
              k,
              Number(v) || 0,
            ])
          )
        : {};

    return {
      spendableSpent: roundMoney(Number(period.spendable_spent) || 0),
      categorySpending,
    };
  }

  const window = periodToDateWindow(period, now);
  return computePeriodLiquidityAmounts(
    transactions,
    accounts,
    window,
    period.user_id,
    liveCategoryKeys(period, categoryKeys)
  );
}

export function snapshotFieldsFromAmounts(amounts: PeriodLiquidityAmounts) {
  return {
    spendable_spent: String(amounts.spendableSpent),
    reserve_saved: null,
    category_spending: amounts.categorySpending,
    snapshot_at: new Date(),
  };
}

export function clearOpenPeriodSnapshotFields() {
  return {
    spendable_spent: null,
    reserve_saved: null,
    category_spending: null,
    snapshot_at: null,
  };
}
