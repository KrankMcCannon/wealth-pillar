import type { Account, BudgetPeriod, PeriodLiquidityAmounts, Transaction } from '@/lib/types';
import { foldPeriodAmounts } from '@/server/ledger';
import { roundMoney } from '@/lib/utils/money';
import { parsePeriodDates } from '../shared/period.logic';
import type { DateWindow } from '../reports/report.logic';
import { categoryKeysFromBudgets, parseBudgetsSnapshot } from './period-budgets.logic';

export function periodToDateWindow(period: BudgetPeriod, now?: Date): DateWindow {
  const [start, end] = parsePeriodDates(period, now);
  return { start: start.toJSDate(), end: end.toJSDate() };
}

/**
 * Envelope spend for a period window (same fold as reports leftover).
 * Old closed rows stored expense-only spendable_spent until Recalculate.
 */
export function computePeriodLiquidityAmounts(
  transactions: Transaction[],
  accounts: Account[],
  window: DateWindow,
  userId: string,
  categoryKeys?: Set<string>
): PeriodLiquidityAmounts {
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
 * Returns frozen snapshot for closed periods, or live computation for active/open periods.
 */
export function resolvePeriodAmounts(
  period: BudgetPeriod,
  transactions: Transaction[],
  accounts: Account[],
  now?: Date,
  categoryKeys?: Set<string>
): PeriodLiquidityAmounts {
  if (period.snapshot_at != null) {
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
