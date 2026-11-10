import { moneyToMinorUnits, minorUnitsToPresentation } from '@/lib/utils/exact-money';
import type { LedgerEntry as Transaction } from '@/server/ledger/aggregate';
import type { CategoryBreakdownItem } from '@/lib/types';
import { toDateTime, now as luxonNow } from '@/lib/utils';
import type { DateInput } from '@/lib/utils/date-utils';

/**
 * Filter transactions within a date range
 */
export function filterTransactionsByPeriod<T extends Transaction>(
  transactions: T[],
  startDate: DateInput,
  endDate: DateInput
): T[] {
  const periodStart = toDateTime(startDate);
  if (!periodStart) return [];
  const normalizedStart = periodStart.startOf('day');

  const periodEnd = endDate ? toDateTime(endDate) : luxonNow();
  if (!periodEnd) return [];
  const normalizedEnd = periodEnd.endOf('day');

  return transactions.filter((t) => {
    const txDate = toDateTime(t.date);
    if (!txDate) return false;
    return txDate >= normalizedStart && txDate <= normalizedEnd;
  });
}

/**
 * Filter transactions by categories
 */
export function filterByCategories<T extends Transaction>(
  transactions: T[],
  categories: string[]
): T[] {
  const categorySet = new Set(categories);
  return transactions.filter((t) => categorySet.has(t.category));
}

/**
 * Calculate category breakdown with NET analysis
 */
export function calculateCategoryBreakdown(transactions: Transaction[]): CategoryBreakdownItem[] {
  if (transactions.length === 0) return [];
  const categoryMap = new Map<string, { spent: bigint; received: bigint; count: number }>();

  for (const t of transactions) {
    if (t.type === 'transfer') continue;
    const existing = categoryMap.get(t.category) || {
      spent: BigInt(0),
      received: BigInt(0),
      count: 0,
    };
    if (t.type === 'expense') {
      existing.spent += moneyToMinorUnits(t.amount);
      existing.count += 1;
    } else if (t.type === 'income') {
      existing.received += moneyToMinorUnits(t.amount);
      existing.count += 1;
    }
    categoryMap.set(t.category, existing);
  }

  const breakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    spent: minorUnitsToPresentation(data.spent),
    received: minorUnitsToPresentation(data.received),
    net: minorUnitsToPresentation(data.spent - data.received),
    percentage: 0,
    count: data.count,
  }));

  const totalNetSpending = breakdown
    .filter((item) => item.net > 0)
    .reduce((sum, item) => sum + item.net, 0);

  for (const item of breakdown) {
    item.percentage =
      item.net > 0 && totalNetSpending > 0 ? (item.net / totalNetSpending) * 100 : 0;
  }

  return breakdown.sort((a, b) => Math.abs(b.net) - Math.abs(a.net));
}

/**
 * Category spending for reports (pure aggregation)
 */
export function aggregateGroupCategorySpendingForReports(
  transactions: Transaction[],
  rangeStart: Date,
  rangeEnd: Date
): Array<{ category: string; amount: number; count: number }> {
  const periodStart = toDateTime(rangeStart)?.startOf('day');
  const periodEnd = toDateTime(rangeEnd)?.endOf('day');
  if (!periodStart || !periodEnd) return [];

  const map = new Map<string, { amount: bigint; count: number }>();

  for (const t of transactions) {
    const d = toDateTime(t.date);
    if (!d || d < periodStart || d > periodEnd) continue;
    if (t.type !== 'expense') continue;

    const cat = t.category;
    const prev = map.get(cat) || { amount: BigInt(0), count: 0 };
    prev.amount += moneyToMinorUnits(t.amount);
    prev.count += 1;
    map.set(cat, prev);
  }

  return Array.from(map.entries()).map(([category, v]) => ({
    category,
    amount: minorUnitsToPresentation(v.amount),
    count: v.count,
  }));
}

/**
 * Monthly income/expense buckets for reports
 */
export function aggregateMonthlyIncomeExpenseForReports(
  transactions: Transaction[],
  rangeStart: Date,
  rangeEnd: Date
): Array<{ month: string; income: number; expense: number }> {
  const periodStart = toDateTime(rangeStart)?.startOf('day');
  const periodEnd = toDateTime(rangeEnd)?.endOf('day');
  if (!periodStart || !periodEnd) return [];

  const map = new Map<string, { month: string; income: bigint; expense: bigint }>();

  for (const t of transactions) {
    const d = toDateTime(t.date);
    if (!d || d < periodStart || d > periodEnd) continue;
    if (t.type === 'transfer') continue;

    const monthKey = d.toFormat('yyyy-MM');
    if (!map.has(monthKey)) {
      map.set(monthKey, { month: monthKey, income: BigInt(0), expense: BigInt(0) });
    }
    const row = map.get(monthKey)!;
    if (t.type === 'income') row.income += moneyToMinorUnits(t.amount);
    if (t.type === 'expense') row.expense += moneyToMinorUnits(t.amount);
  }

  return Array.from(map.values(), (row) => ({
    ...row,
    income: minorUnitsToPresentation(row.income),
    expense: minorUnitsToPresentation(row.expense),
  })).sort((a, b) => new Date(`${a.month}-01`).getTime() - new Date(`${b.month}-01`).getTime());
}

/**
 * Calculate historical balance for a specific account
 * Reverses transactions from current balance back to target date
 */
export function calculateHistoricalBalance(
  allTransactions: Transaction[],
  accountIds: string | Set<string>,
  currentBalance: number,
  targetDate: DateInput
): number {
  const targetDt = toDateTime(targetDate)?.startOf('day');
  if (!targetDt) return currentBalance;

  const accountSet = typeof accountIds === 'string' ? new Set([accountIds]) : accountIds;

  const futureTransactions = allTransactions.filter((t) => {
    const tDate = toDateTime(t.date);
    return tDate && tDate >= targetDt;
  });

  let historicalBalance = moneyToMinorUnits(currentBalance);

  for (const t of futureTransactions) {
    const isSource = accountSet.has(t.account_id);
    const isDest = t.to_account_id && accountSet.has(t.to_account_id);

    if (!isSource && !isDest) continue;

    if (t.type === 'expense' && isSource) {
      historicalBalance += moneyToMinorUnits(t.amount);
    } else if (t.type === 'income' && isSource) {
      historicalBalance -= moneyToMinorUnits(t.amount);
    } else if (t.type === 'transfer') {
      if (isSource && isDest) {
        // Internal transfer within the monitored accounts: NO NET CHANGE
      } else if (isSource) {
        historicalBalance += moneyToMinorUnits(t.amount);
      } else if (isDest) {
        historicalBalance -= moneyToMinorUnits(t.amount);
      }
    }
  }

  return minorUnitsToPresentation(historicalBalance);
}

/**
 * Calculate total spent (expenses + outgoing transfers) for an account in a period
 */
export function calculatePeriodTotalSpent(
  periodTransactions: Transaction[],
  accountIds: string | Set<string>
): number {
  const accountSet = typeof accountIds === 'string' ? new Set([accountIds]) : accountIds;

  return minorUnitsToPresentation(
    periodTransactions.reduce((sum, t) => {
      const isSource = accountSet.has(t.account_id);
      if (!isSource) return sum;

      if (t.type === 'expense') {
        return sum + moneyToMinorUnits(t.amount);
      }

      if (t.type === 'transfer') {
        const isDestInternal = t.to_account_id && accountSet.has(t.to_account_id);
        if (!isDestInternal) {
          return sum + moneyToMinorUnits(t.amount);
        }
      }

      return sum;
    }, BigInt(0))
  );
}

/**
 * Calculate total income (income + incoming transfers) for an account in a period
 */
export function calculatePeriodTotalIncome(
  periodTransactions: Transaction[],
  accountIds: string | Set<string>
): number {
  const accountSet = typeof accountIds === 'string' ? new Set([accountIds]) : accountIds;

  return minorUnitsToPresentation(
    periodTransactions.reduce((sum, t) => {
      if (t.type === 'income' && accountSet.has(t.account_id)) {
        return sum + moneyToMinorUnits(t.amount);
      }

      if (t.type === 'transfer' && t.to_account_id && accountSet.has(t.to_account_id)) {
        const isSourceInternal = accountSet.has(t.account_id);
        if (!isSourceInternal) {
          return sum + moneyToMinorUnits(t.amount);
        }
      }

      return sum;
    }, BigInt(0))
  );
}

/**
 * Calculate total transfers (absolute sum of IN and OUT) for a specific account
 */
export function calculatePeriodTotalTransfers(
  periodTransactions: Transaction[],
  accountIds: string | Set<string>
): number {
  const accountSet = typeof accountIds === 'string' ? new Set([accountIds]) : accountIds;

  return minorUnitsToPresentation(
    periodTransactions.reduce((sum, t) => {
      if (t.type !== 'transfer') return sum;

      const isSource = accountSet.has(t.account_id);
      const isDest = t.to_account_id && accountSet.has(t.to_account_id);

      if (isSource || isDest) {
        return sum + moneyToMinorUnits(t.amount);
      }
      return sum;
    }, BigInt(0))
  );
}

/**
 * Calculate annual category spending
 */
export function calculateAnnualCategorySpending(
  allTransactions: Transaction[],
  year: number | 'all' = new Date().getFullYear()
): CategoryBreakdownItem[] {
  if (year === 'all') {
    return calculateCategoryBreakdown(allTransactions);
  }

  const annualTransactions = allTransactions.filter((t) => {
    const dt = toDateTime(t.date);
    return dt?.year === year;
  });

  return calculateCategoryBreakdown(annualTransactions);
}
