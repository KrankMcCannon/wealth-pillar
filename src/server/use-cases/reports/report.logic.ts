import type { Account, Category, Transaction } from '@/lib/types';
import { resolveAccountLiquidity } from '@/lib/utils/account-classification';
import type { NetSavingsResult } from '@/server/ledger';
import {
  accountsToMap,
  computeNetSavings,
  computeTransactionImpact,
  foldCashFlow,
} from '@/server/ledger';
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
  userId?: string,
  accounts: Account[] = []
): { income: number; expenses: number } {
  const t0 = window.start.getTime();
  const t1 = window.end.getTime();
  const inWindow = transactions.filter((row) => {
    const d = new Date(row.date).getTime();
    return d >= t0 && d <= t1;
  });
  return foldCashFlow(inWindow, accounts, userId);
}

export interface ReportsTopExpenseRow {
  id: string;
  key: string;
  name: string;
  total: number;
  color: string;
}

export function computeCategoryStats(
  transactions: Transaction[],
  categories: Category[],
  window: DateWindow,
  userId?: string,
  accounts: Account[] = []
) {
  const t0 = window.start.getTime();
  const t1 = window.end.getTime();
  const accountMap = accountsToMap(accounts);
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const statsMap = new Map<
    string,
    { id: string; key: string; name: string; type: string; total: number; color: string }
  >();

  const addExpense = (tx: Transaction, amount: number) => {
    if (amount <= 0) return;
    const catId = tx.category;
    let catKey = catId;
    const category =
      categoryMap.get(catId) ||
      Array.from(categoryMap.values()).find((c) => c.key.toLowerCase() === catId.toLowerCase());
    if (category) catKey = category.id;

    if (!statsMap.has(catKey)) {
      statsMap.set(catKey, {
        id: catKey,
        key: category?.key ?? catId,
        name: category?.label || formatCategoryFallback(catId),
        type: 'expense',
        total: 0,
        color: category?.color || 'var(--color-muted-foreground)',
      });
    }
    statsMap.get(catKey)!.total += amount;
  };

  for (const tx of transactions) {
    const d = new Date(tx.date).getTime();
    if (d < t0 || d > t1) continue;
    const impact = computeTransactionImpact(tx, accountMap);
    if (userId === undefined) {
      if (tx.type !== 'expense') continue;
      addExpense(tx, tx.amount);
      continue;
    }
    for (const leg of impact.cashLegs) {
      if (leg.userId !== userId || leg.signed <= 0) continue;
      addExpense(tx, leg.signed);
    }
  }

  return Array.from(statsMap.values()).sort((a, b) => b.total - a.total);
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
    const impact = computeTransactionImpact(tx, accountMap);
    const source = accountMap.get(tx.account_id);
    const dest = tx.to_account_id ? accountMap.get(tx.to_account_id) : undefined;

    const ensureBucket = (
      m: Map<string, { earned: number; spent: number; balance: number }>,
      key: string
    ) => {
      if (!m.has(key)) m.set(key, { earned: 0, spent: 0, balance: 0 });
      return m.get(key)!;
    };

    for (const leg of impact.cashLegs) {
      const typeMap = userFlows.get(leg.userId);
      if (!typeMap) continue;
      const account = leg.signed > 0 ? source : (dest ?? source);
      const type = normalizeAccountType(account?.type);
      if (leg.signed > 0) ensureBucket(typeMap, type).spent += leg.signed;
      else ensureBucket(typeMap, type).earned += -leg.signed;
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
  const accountMap = accountsToMap(accounts);
  const t0 = window.start.getTime();
  const t1 = window.end.getTime();
  const merged = new Map<string, { balance: number; earned: number; spent: number }>();

  const uniqueAccounts = accounts.filter((account) =>
    account.user_ids.some((uid) => userIds.includes(uid))
  );

  for (const account of uniqueAccounts) {
    const type = normalizeAccountType(account.type);
    const existing = merged.get(type) ?? { balance: 0, earned: 0, spent: 0 };
    merged.set(type, {
      ...existing,
      balance: existing.balance + (account.balance || 0),
    });
  }

  for (const tx of transactions) {
    const d = new Date(tx.date).getTime();
    if (d < t0 || d > t1) continue;
    const impact = computeTransactionImpact(tx, accountMap);
    if (impact.cashFlow === 0) continue;
    const account = accountMap.get(tx.account_id);
    if (!account || !account.user_ids.some((uid) => userIds.includes(uid))) continue;
    const type = normalizeAccountType(account.type);
    const existing = merged.get(type) ?? { balance: 0, earned: 0, spent: 0 };
    if (impact.cashFlow > 0) {
      merged.set(type, { ...existing, earned: existing.earned + impact.cashFlow });
    } else {
      merged.set(type, { ...existing, spent: existing.spent + -impact.cashFlow });
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
  topExpenses: ReportsTopExpenseRow[];
  accountBreakdown: AccountTypeSummary[];
  totalWealth: number;
  totalSpendable: number;
  totalReserve: number;
  netSavings: NetSavingsResult;
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
  const totals = sumIncomeExpenseInWindow(transactions, window, userId, accounts);
  const netFlow = totals.income - totals.expenses;

  let comparisonPercent: number | null = null;
  if (comparisonWindow) {
    const prevTotals = sumIncomeExpenseInWindow(transactions, comparisonWindow, userId, accounts);
    const prevNet = prevTotals.income - prevTotals.expenses;
    comparisonPercent = netFlowDeltaPercent(netFlow, prevNet);
  }

  const expenseStats = computeCategoryStats(transactions, categories, window, userId, accounts);
  const topExpenses = expenseStats.map((s) => ({
    id: s.id,
    key: s.key,
    name: s.name,
    total: s.total,
    color: s.color,
  }));

  const accountBreakdown =
    userId !== undefined
      ? flowsToAccountTypeSummary(
          computeUserFlows(transactions, accounts, userIds, window).find((f) => f.userId === userId)
            ?.accounts ?? []
        )
      : computeGroupAccountTypeSummary(transactions, accounts, userIds, window);

  const totalWealth = accountBreakdown.reduce((s, a) => s + a.totalBalance, 0);

  const scopedAccounts =
    userId !== undefined ? accounts.filter((a) => a.user_ids.includes(userId)) : accounts;
  let totalSpendable = 0;
  let totalReserve = 0;
  for (const account of scopedAccounts) {
    const balance = account.balance ?? 0;
    if (resolveAccountLiquidity(account) === 'reserve') {
      totalReserve += balance;
    } else {
      totalSpendable += balance;
    }
  }

  const netSavings = computeNetSavings(transactions, accounts, window, userId);

  return {
    netFlow,
    income: totals.income,
    expenses: totals.expenses,
    comparisonPercent,
    topExpenses,
    accountBreakdown,
    totalWealth,
    totalSpendable,
    totalReserve,
    netSavings,
  };
}
