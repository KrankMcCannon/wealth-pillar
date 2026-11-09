import { roundMoney } from '@/lib/utils/money';
import { moneyToMinorUnits } from '@/lib/utils/exact-money';

export type BalanceAdjustableRow = {
  amount: string | number | null;
  type: string | null;
  account_id: string | null;
  to_account_id?: string | null;
};

/** Persisted ledger deltas never pass through binary floating point. */
export function computeExactBalanceDeltas(
  transaction: BalanceAdjustableRow,
  multiplier: number
): Map<string, bigint> {
  if (multiplier !== 1 && multiplier !== -1) throw new Error('Invalid balance multiplier');
  const deltas = new Map<string, bigint>();
  if (!transaction.account_id) return deltas;
  if (transaction.amount === null) throw new Error('Missing ledger amount');
  const amount = moneyToMinorUnits(transaction.amount) * BigInt(multiplier);
  const add = (id: string, delta: bigint) => deltas.set(id, (deltas.get(id) ?? BigInt(0)) + delta);
  if (transaction.type === 'income') add(transaction.account_id, amount);
  else if (transaction.type === 'expense') add(transaction.account_id, -amount);
  else if (transaction.type === 'transfer' && transaction.to_account_id) {
    add(transaction.account_id, -amount);
    add(transaction.to_account_id, amount);
  }
  return deltas;
}

/** Account id → balance delta for income/expense/transfer rules shared by server and client. */
export function computeBalanceDeltas(
  transaction: BalanceAdjustableRow,
  multiplier: number
): Map<string, number> {
  const deltas = new Map<string, number>();
  if (!transaction.account_id) return deltas;

  const amount = Number(transaction.amount) * multiplier;

  if (transaction.type === 'income') {
    deltas.set(transaction.account_id, amount);
  } else if (transaction.type === 'expense') {
    deltas.set(transaction.account_id, -amount);
  } else if (transaction.type === 'transfer' && transaction.to_account_id) {
    deltas.set(transaction.account_id, -amount);
    deltas.set(transaction.to_account_id, amount);
  }

  return deltas;
}

/** Rebuild stored account balance from all related transactions (ignores the current stored total). */
export function sumAccountBalanceFromRows(accountId: string, rows: BalanceAdjustableRow[]): number {
  let balance = 0;
  for (const row of rows) {
    balance += computeBalanceDeltas(row, 1).get(accountId) ?? 0;
  }
  return roundMoney(balance);
}
