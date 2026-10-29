import type { Transaction } from '@/lib/types';
import type { TransactionFormData } from '../components/transaction-form-fields';

function formatTransactionDate(date: Transaction['date']): string {
  if (typeof date === 'string') {
    return date.split('T')[0] ?? date;
  }

  return date.toISOString().split('T')[0] ?? '';
}

export function mapTransactionToFormData(transaction: Transaction): TransactionFormData {
  return {
    description: transaction.description ?? '',
    amount: String(transaction.amount ?? ''),
    type: transaction.type,
    category: transaction.category ?? '',
    date: formatTransactionDate(transaction.date),
    user_id: transaction.user_id ?? '',
    account_id: transaction.account_id ?? '',
    to_account_id: transaction.to_account_id ?? '',
  };
}
