import type { Transaction, CategoryBreakdownItem } from '@/lib/types';
import { toDateTime } from '@/lib/utils';
import type { DateInput } from '@/lib/utils/date-utils';
import { now as luxonNow } from '@/lib/utils';

export interface OverviewMetrics {
  totalEarned: number;
  totalSpent: number;
  totalTransferred: number;
  totalBalance: number;
}

export function filterTransactionsByPeriod(
  transactions: Transaction[],
  startDate: DateInput,
  endDate: DateInput
): Transaction[] {
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

function calculateTransferMetrics(t: Transaction, accountSet: Set<string>) {
  let earned = 0;
  let spent = 0;
  let transferred = 0;

  const fromUserAccount = accountSet.has(t.account_id);
  const toUserAccount = t.to_account_id && accountSet.has(t.to_account_id);

  if (fromUserAccount) {
    transferred += t.amount;
  }

  if (fromUserAccount && toUserAccount) {
    // Internal transfer: no net change
  } else if (fromUserAccount) {
    spent += t.amount; // External OUT
  } else if (toUserAccount) {
    earned += t.amount; // External IN
  }

  return { earned, spent, transferred };
}

export function calculateOverviewMetrics(
  transactions: Transaction[],
  userAccountIds: string[],
  userId?: string
): OverviewMetrics {
  const accountSet = new Set(userAccountIds);
  let totalEarned = 0;
  let totalSpent = 0;
  let totalTransferred = 0;

  for (const t of transactions) {
    if (userId && t.user_id !== userId) continue;

    if (t.type === 'income' && accountSet.has(t.account_id)) {
      totalEarned += t.amount;
    } else if (t.type === 'expense' && accountSet.has(t.account_id)) {
      totalSpent += t.amount;
    } else if (t.type === 'transfer') {
      const metrics = calculateTransferMetrics(t, accountSet);
      totalEarned += metrics.earned;
      totalSpent += metrics.spent;
      totalTransferred += metrics.transferred;
    }
  }

  return {
    totalEarned,
    totalSpent,
    totalTransferred,
    totalBalance: totalEarned - totalSpent,
  };
}

export function calculateCategoryBreakdown(transactions: Transaction[]): CategoryBreakdownItem[] {
  if (transactions.length === 0) return [];
  const categoryMap = new Map<string, { spent: number; received: number; count: number }>();

  for (const t of transactions) {
    if (t.type === 'transfer') continue;
    const existing = categoryMap.get(t.category) || { spent: 0, received: 0, count: 0 };
    if (t.type === 'expense') {
      existing.spent += t.amount;
      existing.count += 1;
    } else if (t.type === 'income') {
      existing.received += t.amount;
      existing.count += 1;
    }
    categoryMap.set(t.category, existing);
  }

  const breakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
    category,
    spent: data.spent,
    received: data.received,
    net: data.spent - data.received,
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

export function aggregateGroupCategorySpendingForReports(
  transactions: Transaction[],
  rangeStart: Date,
  rangeEnd: Date
): Array<{ category: string; amount: number; count: number }> {
  const periodStart = toDateTime(rangeStart)?.startOf('day');
  const periodEnd = toDateTime(rangeEnd)?.endOf('day');
  if (!periodStart || !periodEnd) return [];

  const map = new Map<string, { amount: number; count: number }>();

  for (const t of transactions) {
    const d = toDateTime(t.date);
    if (!d || d < periodStart || d > periodEnd) continue;
    if (t.type !== 'expense') continue;

    const cat = t.category;
    const prev = map.get(cat) || { amount: 0, count: 0 };
    prev.amount += t.amount;
    prev.count += 1;
    map.set(cat, prev);
  }

  return Array.from(map.entries()).map(([category, v]) => ({
    category,
    amount: v.amount,
    count: v.count,
  }));
}

export function aggregateMonthlyIncomeExpenseForReports(
  transactions: Transaction[],
  rangeStart: Date,
  rangeEnd: Date
): Array<{ month: string; income: number; expense: number }> {
  const periodStart = toDateTime(rangeStart)?.startOf('day');
  const periodEnd = toDateTime(rangeEnd)?.endOf('day');
  if (!periodStart || !periodEnd) return [];

  const map = new Map<string, { month: string; income: number; expense: number }>();

  for (const t of transactions) {
    const d = toDateTime(t.date);
    if (!d || d < periodStart || d > periodEnd) continue;
    if (t.type === 'transfer') continue;

    const monthKey = d.toFormat('yyyy-MM');
    if (!map.has(monthKey)) {
      map.set(monthKey, { month: monthKey, income: 0, expense: 0 });
    }
    const row = map.get(monthKey)!;
    if (t.type === 'income') row.income += t.amount;
    if (t.type === 'expense') row.expense += t.amount;
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(`${a.month}-01`).getTime() - new Date(`${b.month}-01`).getTime()
  );
}

export function filterByCategories(
  transactions: Transaction[],
  categories: string[]
): Transaction[] {
  const categorySet = new Set(categories);
  return transactions.filter((t) => categorySet.has(t.category));
}

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
