import { moneyToMinorUnits, minorUnitsToPresentation } from '@/lib/utils/exact-money';
import { ledgerRowCount, type LedgerEntry as Transaction } from '@/server/ledger/aggregate';
import { financialDateKey } from '@/lib/utils/financial-date';
import type { Account, Category } from '@/lib/types';
import { resolveAccountLiquidity } from '@/lib/utils/account-classification';
import type { NetSavingsResult } from '@/server/ledger';
import {
  accountsToMap,
  classifyMovement,
  computeNetSavings,
  foldCashFlow,
  type Movement,
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

export interface PreparedReportsCalculations {
  accountMap: Map<string, Account>;
  dates: Map<Transaction, string>;
  movements: Map<Transaction, Movement>;
  windows: Map<string, Transaction[]>;
}

function windowKey(window: DateWindow): string {
  return `${financialDateKey(window.start)}:${financialDateKey(window.end)}`;
}

export function prepareReportsCalculations(
  transactions: Transaction[],
  accounts: Account[],
  windows: DateWindow[]
): PreparedReportsCalculations {
  const accountMap = accountsToMap(accounts);
  const dates = new Map(
    transactions.map((transaction) => [transaction, financialDateKey(transaction.date)])
  );
  const movements = new Map(
    transactions.map((transaction) => [transaction, classifyMovement(transaction, accountMap)])
  );
  const prepared: PreparedReportsCalculations = {
    accountMap,
    dates,
    movements,
    windows: new Map(),
  };
  for (const window of windows) {
    const start = financialDateKey(window.start);
    const end = financialDateKey(window.end);
    prepared.windows.set(
      windowKey(window),
      transactions.filter((transaction) => {
        const date = dates.get(transaction)!;
        return date >= start && date <= end;
      })
    );
  }
  return prepared;
}

function transactionsInWindow(
  transactions: Transaction[],
  window: DateWindow,
  prepared?: PreparedReportsCalculations
): Transaction[] {
  const key = windowKey(window);
  const cached = prepared?.windows.get(key);
  if (cached) return cached;
  const start = financialDateKey(window.start);
  const end = financialDateKey(window.end);
  return transactions.filter((transaction) => {
    const date = prepared?.dates.get(transaction) ?? financialDateKey(transaction.date);
    return date >= start && date <= end;
  });
}

function movementFor(
  transaction: Transaction,
  accounts: Account[],
  prepared?: PreparedReportsCalculations
): Movement {
  return (
    prepared?.movements.get(transaction) ??
    classifyMovement(transaction, prepared?.accountMap ?? accountsToMap(accounts))
  );
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
  accounts: Account[] = [],
  prepared?: PreparedReportsCalculations
): { income: number; expenses: number } {
  if (!prepared) {
    return foldCashFlow(transactionsInWindow(transactions, window), accounts, userId);
  }
  let incomeCents = BigInt(0);
  let expensesCents = BigInt(0);
  for (const transaction of transactionsInWindow(transactions, window, prepared)) {
    const movement = movementFor(transaction, accounts, prepared);
    if (userId === undefined) {
      if (movement.cashFlowCents > BigInt(0)) incomeCents += movement.cashFlowCents;
      else if (movement.cashFlowCents < BigInt(0)) expensesCents -= movement.cashFlowCents;
      continue;
    }
    for (const leg of movement.cashLegs) {
      if (leg.userId !== userId) continue;
      if (leg.signedCents > BigInt(0)) expensesCents += leg.signedCents;
      else if (leg.signedCents < BigInt(0)) incomeCents -= leg.signedCents;
    }
  }
  return {
    income: minorUnitsToPresentation(incomeCents),
    expenses: minorUnitsToPresentation(expensesCents),
  };
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
  accounts: Account[] = [],
  prepared?: PreparedReportsCalculations
) {
  const categoryMap = new Map(categories.map((c) => [c.id, c]));
  const categoryByKey = new Map(categories.map((c) => [c.key.toLowerCase(), c]));
  const statsMap = new Map<
    string,
    { id: string; key: string; name: string; type: string; total: bigint; color: string }
  >();

  const addExpense = (tx: Transaction, amount: bigint) => {
    if (amount <= BigInt(0)) return;
    const catId = tx.category;
    let catKey = catId;
    const category = categoryMap.get(catId) || categoryByKey.get(catId.toLowerCase());
    if (category) catKey = category.id;

    if (!statsMap.has(catKey)) {
      statsMap.set(catKey, {
        id: catKey,
        key: category?.key ?? catId,
        name: category?.label || formatCategoryFallback(catId),
        type: 'expense',
        total: BigInt(0),
        color: category?.color || 'var(--color-muted-foreground)',
      });
    }
    statsMap.get(catKey)!.total += amount;
  };

  for (const tx of transactionsInWindow(transactions, window, prepared)) {
    const movement = movementFor(tx, accounts, prepared);
    if (userId === undefined) {
      if (tx.type !== 'expense') continue;
      addExpense(tx, moneyToMinorUnits(tx.amount));
      continue;
    }
    for (const leg of movement.cashLegs) {
      if (leg.userId !== userId || leg.signedCents <= BigInt(0)) continue;
      addExpense(tx, leg.signedCents);
    }
  }

  return Array.from(statsMap.values(), (row) => ({
    ...row,
    total: minorUnitsToPresentation(row.total),
  })).sort((a, b) => b.total - a.total);
}

export function computeUserFlows(
  transactions: Transaction[],
  accounts: Account[],
  userIds: string[],
  window: DateWindow,
  prepared?: PreparedReportsCalculations
): UserFlowSummary[] {
  const accountMap = prepared?.accountMap ?? accountsToMap(accounts);
  const filtered = transactionsInWindow(transactions, window, prepared);

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
    const movement = movementFor(tx, accounts, prepared);
    const source = accountMap.get(tx.account_id);
    const dest = tx.to_account_id ? accountMap.get(tx.to_account_id) : undefined;

    const ensureBucket = (
      m: Map<string, { earned: number; spent: number; balance: number }>,
      key: string
    ) => {
      if (!m.has(key)) m.set(key, { earned: 0, spent: 0, balance: 0 });
      return m.get(key)!;
    };

    for (const leg of movement.cashLegs) {
      const typeMap = userFlows.get(leg.userId);
      if (!typeMap) continue;
      const signed = minorUnitsToPresentation(leg.signedCents);
      const account = signed > 0 ? source : (dest ?? source);
      const type = normalizeAccountType(account?.type);
      if (signed > 0) ensureBucket(typeMap, type).spent += signed;
      else ensureBucket(typeMap, type).earned += -signed;
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
  window: DateWindow,
  prepared?: PreparedReportsCalculations
): AccountTypeSummary[] {
  const accountMap = prepared?.accountMap ?? accountsToMap(accounts);
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

  for (const tx of transactionsInWindow(transactions, window, prepared)) {
    const movement = movementFor(tx, accounts, prepared);
    if (movement.cashFlowCents === BigInt(0)) continue;
    const account = accountMap.get(tx.account_id);
    if (!account || !account.user_ids.some((uid) => userIds.includes(uid))) continue;
    const type = normalizeAccountType(account.type);
    const existing = merged.get(type) ?? { balance: 0, earned: 0, spent: 0 };
    const cashFlow = minorUnitsToPresentation(movement.cashFlowCents);
    if (cashFlow > 0) {
      merged.set(type, { ...existing, earned: existing.earned + cashFlow });
    } else {
      merged.set(type, { ...existing, spent: existing.spent + -cashFlow });
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
  const ps = financialDateKey(period.startDate);
  const pe = financialDateKey(period.endDate);
  const ws = financialDateKey(w.start);
  const we = financialDateKey(w.end);
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

function computePreparedNetSavings(
  transactions: Transaction[],
  accounts: Account[],
  window: DateWindow,
  userId: string | undefined,
  prepared?: PreparedReportsCalculations
): NetSavingsResult {
  if (!prepared) return computeNetSavings(transactions, accounts, window, userId);
  let depositsCents = BigInt(0);
  let withdrawalsCents = BigInt(0);
  let count = 0;
  for (const transaction of transactionsInWindow(transactions, window, prepared)) {
    const movement = movementFor(transaction, accounts, prepared);
    if (movement.savingsDeltaCents === BigInt(0)) continue;
    if (userId !== undefined && movement.savingsUserId !== userId) continue;
    if (movement.savingsDeltaCents > BigInt(0)) depositsCents += movement.savingsDeltaCents;
    else withdrawalsCents -= movement.savingsDeltaCents;
    count += ledgerRowCount([transaction]);
  }
  return {
    deposits: minorUnitsToPresentation(depositsCents),
    withdrawals: minorUnitsToPresentation(withdrawalsCents),
    net: minorUnitsToPresentation(depositsCents - withdrawalsCents),
    count,
  };
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
  userId?: string,
  userFlows?: UserFlowSummary[],
  prepared?: PreparedReportsCalculations
): ReportsSectionViewModel {
  const totals = sumIncomeExpenseInWindow(transactions, window, userId, accounts, prepared);
  const netFlow = totals.income - totals.expenses;

  let comparisonPercent: number | null = null;
  if (comparisonWindow) {
    const prevTotals = sumIncomeExpenseInWindow(
      transactions,
      comparisonWindow,
      userId,
      accounts,
      prepared
    );
    const prevNet = prevTotals.income - prevTotals.expenses;
    comparisonPercent = netFlowDeltaPercent(netFlow, prevNet);
  }

  const expenseStats = computeCategoryStats(
    transactions,
    categories,
    window,
    userId,
    accounts,
    prepared
  );
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
          (userFlows ?? computeUserFlows(transactions, accounts, userIds, window)).find(
            (flow) => flow.userId === userId
          )?.accounts ?? []
        )
      : computeGroupAccountTypeSummary(transactions, accounts, userIds, window, prepared);

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

  const netSavings = computePreparedNetSavings(transactions, accounts, window, userId, prepared);

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
