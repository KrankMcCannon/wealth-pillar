import type { Account, BudgetPeriod, PeriodLiquidityAmounts, Transaction } from '@/lib/types';
import { isSpendableAccount } from '@/lib/utils/account-classification';
import { roundMoney } from '@/lib/utils/money';
import { computeNetSavings } from '../shared/savings.logic';
import { parsePeriodDates } from '../shared/period.logic';
import type { DateWindow } from '../reports/report.logic';

export function periodToDateWindow(period: BudgetPeriod, now?: Date): DateWindow {
  const [start, end] = parsePeriodDates(period, now);
  return { start: start.toJSDate(), end: end.toJSDate() };
}

/**
 * Derives period amounts from transactions + account liquidity (source of truth).
 */
export function computePeriodLiquidityAmounts(
  transactions: Transaction[],
  accounts: Account[],
  window: DateWindow,
  userId: string
): PeriodLiquidityAmounts {
  const t0 = window.start.getTime();
  const t1 = window.end.getTime();
  const accountMap = new Map(accounts.map((a) => [a.id, a]));

  let spendableSpent = 0;
  const categorySpending: Record<string, number> = {};

  for (const tx of transactions) {
    if (tx.user_id !== userId) continue;
    const d = new Date(tx.date).getTime();
    if (d < t0 || d > t1) continue;

    if (tx.type === 'expense') {
      const account = accountMap.get(tx.account_id);
      if (!account || !isSpendableAccount(account)) continue;
      spendableSpent += tx.amount;
      categorySpending[tx.category] = (categorySpending[tx.category] || 0) + tx.amount;
    }
  }

  const netSavings = computeNetSavings(transactions, accounts, window, userId);

  return {
    spendableSpent: roundMoney(spendableSpent),
    reserveSaved: roundMoney(netSavings.net),
    categorySpending,
  };
}

/**
 * Returns frozen snapshot for closed periods, or live computation for active/open periods.
 */
export function resolvePeriodAmounts(
  period: BudgetPeriod,
  transactions: Transaction[],
  accounts: Account[],
  now?: Date
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
      reserveSaved: roundMoney(Number(period.reserve_saved) || 0),
      categorySpending,
    };
  }

  const window = periodToDateWindow(period, now);
  return computePeriodLiquidityAmounts(transactions, accounts, window, period.user_id);
}

export function snapshotFieldsFromAmounts(amounts: PeriodLiquidityAmounts) {
  return {
    spendable_spent: String(amounts.spendableSpent),
    reserve_saved: String(amounts.reserveSaved),
    category_spending: amounts.categorySpending,
    snapshot_at: new Date(),
  };
}
