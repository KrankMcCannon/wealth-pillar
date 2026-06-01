import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import type { DbExecutor } from '@/server/repositories/db-executor';

export type BalanceAdjustableRow = {
  amount: string | number | null;
  type: string | null;
  account_id: string | null;
  to_account_id: string | null;
};

export async function applyTransactionBalanceAdjustments(
  transaction: BalanceAdjustableRow,
  multiplier: number,
  executor?: DbExecutor
): Promise<void> {
  if (!transaction.account_id) return;

  const amount = Number(transaction.amount) * multiplier;

  if (transaction.type === 'income') {
    await TransactionsRepository.updateAccountBalance(transaction.account_id, amount, executor);
  } else if (transaction.type === 'expense') {
    await TransactionsRepository.updateAccountBalance(transaction.account_id, -amount, executor);
  } else if (transaction.type === 'transfer' && transaction.to_account_id) {
    await TransactionsRepository.updateAccountBalance(transaction.account_id, -amount, executor);
    await TransactionsRepository.updateAccountBalance(transaction.to_account_id, amount, executor);
  }
}
