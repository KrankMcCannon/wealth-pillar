export type BalanceAdjustableRow = {
  amount: string | number | null;
  type: string | null;
  account_id: string | null;
  to_account_id?: string | null;
};

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
