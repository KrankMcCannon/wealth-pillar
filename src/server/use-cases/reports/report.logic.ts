import type { Account, Category, Transaction } from '@/lib/types';
import type {
  AccountTypeSummary,
  ReportPeriodSummary,
  UserAccountFlow,
  UserFlowSummary,
} from './reports.use-cases';

export interface DateWindow {
  start: Date;
  end: Date;
}

export function formatCategoryFallback(catId: string): string {
  return catId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function normalizeAccountType(type: string | undefined): string {
  if (!type) return 'other';
  const lower = type.toLowerCase();
  if (lower === 'investment' || lower === 'investments') return 'investments';
  return lower;
}

export function sumIncomeExpenseInWindow(
  transactions: Transaction[],
  window: DateWindow,
  userId?: string
): { income: number; expenses: number } {
  const t0 = window.start.getTime();
  const t1 = window.end.getTime();
  let income = 0;
  let expenses = 0;
  for (const row of transactions) {
    const d = new Date(row.date).getTime();
    if (d < t0 || d > t1) continue;
    if (userId !== undefined && row.user_id !== userId) continue;
    if (row.type === 'income') income += row.amount;
    else if (row.type === 'expense') expenses += row.amount;
  }
  return { income, expenses };
}

export function computeCategoryStats(
  transactions: Transaction[],
  categories: Category[],
  window: DateWindow,
  userId?: string
) {
  const t0 = window.start.getTime();
  const t1 = window.end.getTime();
  const filtered = transactions.filter((row) => {
    const d = new Date(row.date).getTime();
    if (d < t0 || d > t1) return false;
    if (userId !== undefined && row.user_id !== userId) return false;
    return true;
  });

  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const statsMap = new Map<
    string,
    { id: string; name: string; type: string; total: number; color: string }
  >();

  for (const tx of filtered) {
    if (tx.type === 'transfer') continue;

    const catId = tx.category;
    let catKey = catId;
    const category =
      categoryMap.get(catId) ||
      Array.from(categoryMap.values()).find((c) => c.key.toLowerCase() === catId.toLowerCase());
    if (category) catKey = category.id;

    if (!statsMap.has(catKey)) {
      statsMap.set(catKey, {
        id: catKey,
        name: category?.label || formatCategoryFallback(catId),
        type: tx.type,
        total: 0,
        color: category?.color || 'oklch(var(--color-muted-foreground))',
      });
    }

    statsMap.get(catKey)!.total += tx.amount;
  }

  const allStats = Array.from(statsMap.values());
  return allStats.filter((s) => s.type === 'expense').sort((a, b) => b.total - a.total);
}

export function computeUserFlows(
  transactions: Transaction[],
  accounts: Account[],
  userIds: string[],
  window: DateWindow
): UserFlowSummary[] {
  const accountMap = new Map(accounts.map((a) => [a.id, a]));
  const t0 = window.start.getTime();
  const t1 = window.end.getTime();
  const filtered = transactions.filter((row) => {
    const d = new Date(row.date).getTime();
    return d >= t0 && d <= t1;
  });

  const userFlows = new Map<
    string,
    Map<string, { earned: number; spent: number; balance: number }>
  >();

  for (const uid of userIds) {
    userFlows.set(uid, new Map());
  }

  for (const account of accounts) {
    const type = normalizeAccountType(account.type);
    for (const uid of account.user_ids) {
      if (!userFlows.has(uid)) continue;
      const typeMap = userFlows.get(uid)!;
      if (!typeMap.has(type)) {
        typeMap.set(type, { earned: 0, spent: 0, balance: 0 });
      }
      typeMap.get(type)!.balance += account.balance || 0;
    }
  }

  for (const tx of filtered) {
    const uid = tx.user_id;
    if (!uid || !userFlows.has(uid)) continue;

    const account = accountMap.get(tx.account_id);
    if (!account) continue;

    const type = normalizeAccountType(account.type);
    const typeMap = userFlows.get(uid)!;

    const ensureBucket = (
      m: Map<string, { earned: number; spent: number; balance: number }>,
      key: string
    ) => {
      if (!m.has(key)) m.set(key, { earned: 0, spent: 0, balance: 0 });
      return m.get(key)!;
    };

    if (tx.type === 'income') {
      ensureBucket(typeMap, type).earned += tx.amount;
    } else if (tx.type === 'expense') {
      ensureBucket(typeMap, type).spent += tx.amount;
    } else if (tx.type === 'transfer' && tx.to_account_id) {
      const toAccount = accountMap.get(tx.to_account_id);
      if (!toAccount) continue;
      const toType = normalizeAccountType(toAccount.type);
      ensureBucket(typeMap, type).spent += tx.amount;
      ensureBucket(typeMap, toType).earned += tx.amount;
    }
  }

  return userIds.map((uid) => {
    const typeMap = userFlows.get(uid) || new Map();
    const accountFlows: UserAccountFlow[] = Array.from(typeMap.entries()).map(
      ([accountType, data]) => ({
        accountType,
        balance: data.balance,
        earned: data.earned,
        spent: data.spent,
        net: data.earned - data.spent,
      })
    );

    const totalEarned = accountFlows.reduce((s, a) => s + a.earned, 0);
    const totalSpent = accountFlows.reduce((s, a) => s + a.spent, 0);

    return {
      userId: uid,
      totalEarned,
      totalSpent,
      netFlow: totalEarned - totalSpent,
      accounts: accountFlows.sort((a, b) => b.balance - a.balance),
    };
  });
}

/** Group-level account breakdown for a time window (fix #4: window-aware like hero). */
export function computeGroupAccountTypeSummary(
  transactions: Transaction[],
  accounts: Account[],
  userIds: string[],
  window: DateWindow
): AccountTypeSummary[] {
  const flows = computeUserFlows(transactions, accounts, userIds, window);
  const merged = new Map<string, { balance: number; earned: number; spent: number }>();

  for (const flow of flows) {
    for (const row of flow.accounts) {
      const existing = merged.get(row.accountType) ?? { balance: 0, earned: 0, spent: 0 };
      merged.set(row.accountType, {
        balance: existing.balance + row.balance,
        earned: existing.earned + row.earned,
        spent: existing.spent + row.spent,
      });
    }
  }

  return Array.from(merged.entries())
    .map(([accountType, data]) => ({
      accountType,
      totalBalance: data.balance,
      totalEarned: data.earned,
      totalSpent: data.spent,
      transactionCount: 0,
    }))
    .sort((a, b) => b.totalBalance - a.totalBalance);
}

export function periodOverlapsWindow(period: ReportPeriodSummary, w: DateWindow): boolean {
  const ps = new Date(period.startDate).getTime();
  const pe = new Date(period.endDate).getTime();
  const ws = w.start.getTime();
  const we = w.end.getTime();
  return !(pe < ws || ps > we);
}

export function flowsToAccountTypeSummary(flows: UserAccountFlow[]): AccountTypeSummary[] {
  return flows.map((f) => ({
    accountType: f.accountType,
    totalBalance: f.balance,
    totalEarned: f.earned,
    totalSpent: f.spent,
    transactionCount: 0,
  }));
}

export function netFlowDeltaPercent(currentNet: number, previousNet: number): number | null {
  if (previousNet === 0 && currentNet === 0) return null;
  if (previousNet === 0) return currentNet > 0 ? 100 : -100;
  return ((currentNet - previousNet) / Math.abs(previousNet)) * 100;
}

export interface ReportsSectionViewModel {
  netFlow: number;
  income: number;
  expenses: number;
  comparisonPercent: number | null;
  topExpenses: { id: string; name: string; total: number }[];
  accountBreakdown: AccountTypeSummary[];
  totalWealth: number;
}

export function buildReportsSectionViewModel(
  transactions: Transaction[],
  accounts: Account[],
  categories: Category[],
  userIds: string[],
  window: DateWindow,
  comparisonWindow: DateWindow | null,
  userId?: string
): ReportsSectionViewModel {
  const totals = sumIncomeExpenseInWindow(transactions, window, userId);
  const netFlow = totals.income - totals.expenses;

  let comparisonPercent: number | null = null;
  if (comparisonWindow) {
    const prevTotals = sumIncomeExpenseInWindow(transactions, comparisonWindow, userId);
    const prevNet = prevTotals.income - prevTotals.expenses;
    comparisonPercent = netFlowDeltaPercent(netFlow, prevNet);
  }

  const expenseStats = computeCategoryStats(transactions, categories, window, userId);
  const topExpenses = expenseStats
    .slice(0, 3)
    .map((s) => ({ id: s.id, name: s.name, total: s.total }));

  const accountBreakdown =
    userId !== undefined
      ? flowsToAccountTypeSummary(
          computeUserFlows(transactions, accounts, userIds, window).find((f) => f.userId === userId)
            ?.accounts ?? []
        )
      : computeGroupAccountTypeSummary(transactions, accounts, userIds, window);

  const totalWealth = accountBreakdown.reduce((s, a) => s + a.totalBalance, 0);

  return {
    netFlow,
    income: totals.income,
    expenses: totals.expenses,
    comparisonPercent,
    topExpenses,
    accountBreakdown,
    totalWealth,
  };
}
