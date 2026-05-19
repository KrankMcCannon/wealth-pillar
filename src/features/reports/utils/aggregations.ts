import type {
  AccountTypeSummary,
  ReportPeriodSummary,
  UserAccountFlow,
  UserFlowSummary,
} from '@/server/use-cases/reports/reports.use-cases';
import type { Account, Category, Transaction } from '@/lib/types';
import type { DateWindow } from './reporting-window';

export type SerializedTransaction = Transaction & { date: string };
export type SerializedCategory = Category;
export type SerializedAccount = Account & { balance: number };

export function formatCategoryFallback(catId: string): string {
  return catId.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function normalizeAccountType(type: string): string {
  if (!type) return 'other';
  const lower = type.toLowerCase();
  if (lower === 'investment' || lower === 'investments') return 'investments';
  return lower;
}

export function sumIncomeExpenseInWindow(
  transactions: SerializedTransaction[],
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
  transactions: SerializedTransaction[],
  categories: SerializedCategory[],
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
  transactions: SerializedTransaction[],
  accounts: SerializedAccount[],
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
      typeMap.get(type)!.balance += account.balance;
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
