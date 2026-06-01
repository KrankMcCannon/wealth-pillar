import type { Account, Transaction } from '@/lib/types';

export type BalanceAdjustableTransaction = Pick<
  Transaction,
  'amount' | 'type' | 'account_id' | 'to_account_id'
>;

/** Account id → balance delta (matches server adjustBalance in transaction use-cases). */
export function getTransactionBalanceDeltas(
  transaction: BalanceAdjustableTransaction,
  multiplier: number
): Map<string, number> {
  const deltas = new Map<string, number>();
  if (!transaction.account_id) return deltas;

  const amt = Number(transaction.amount) * multiplier;
  if (transaction.type === 'income') {
    deltas.set(transaction.account_id, amt);
  } else if (transaction.type === 'expense') {
    deltas.set(transaction.account_id, -amt);
  } else if (transaction.type === 'transfer' && transaction.to_account_id) {
    deltas.set(transaction.account_id, -amt);
    deltas.set(transaction.to_account_id, amt);
  }

  return deltas;
}

export function applyTransactionBalanceDelta(
  accounts: Account[],
  transaction: BalanceAdjustableTransaction,
  multiplier: number
): Account[] {
  const deltas = getTransactionBalanceDeltas(transaction, multiplier);
  if (deltas.size === 0) return accounts;

  return accounts.map((account) => {
    const delta = deltas.get(account.id);
    if (delta === undefined) return account;
    const current = Number(account.balance ?? 0);
    return { ...account, balance: current + delta };
  });
}

export type AccountBalanceSnapshot = Record<string, number | undefined>;

export function snapshotAffectedBalances(
  accounts: Account[],
  ...adjustments: { transaction: BalanceAdjustableTransaction; multiplier: number }[]
): AccountBalanceSnapshot {
  const ids = new Set<string>();
  for (const { transaction, multiplier } of adjustments) {
    getTransactionBalanceDeltas(transaction, multiplier).forEach((_, id) => ids.add(id));
  }
  return Object.fromEntries(
    [...ids].map((id) => {
      const account = accounts.find((a) => a.id === id);
      return [id, account?.balance];
    })
  );
}

export function applyBalanceSnapshotToStore(
  snapshot: AccountBalanceSnapshot,
  updateAccount: (id: string, updates: Partial<Account>) => void
): void {
  for (const [id, balance] of Object.entries(snapshot)) {
    if (balance === undefined) continue;
    updateAccount(id, { balance });
  }
}

export function patchStoreBalancesFromTransaction(
  accounts: Account[],
  updateAccount: (id: string, updates: Partial<Account>) => void,
  transaction: BalanceAdjustableTransaction,
  multiplier: number
): void {
  const next = applyTransactionBalanceDelta(accounts, transaction, multiplier);
  for (const account of next) {
    const prev = accounts.find((a) => a.id === account.id);
    const nextBalance = account.balance;
    if (prev && nextBalance !== undefined && prev.balance !== nextBalance) {
      updateAccount(account.id, { balance: nextBalance });
    }
  }
}

export function patchStoreBalancesForEdit(
  accounts: Account[],
  updateAccount: (id: string, updates: Partial<Account>) => void,
  original: BalanceAdjustableTransaction,
  updated: BalanceAdjustableTransaction
): void {
  let next = applyTransactionBalanceDelta(accounts, original, -1);
  next = applyTransactionBalanceDelta(next, updated, 1);
  for (const account of next) {
    const prev = accounts.find((a) => a.id === account.id);
    const nextBalance = account.balance;
    if (prev && nextBalance !== undefined && prev.balance !== nextBalance) {
      updateAccount(account.id, { balance: nextBalance });
    }
  }
}
