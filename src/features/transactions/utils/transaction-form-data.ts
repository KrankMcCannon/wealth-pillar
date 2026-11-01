import type { Transaction } from '@/lib/types';
import { financialDateKey } from '@/lib/utils/financial-date';
import type { TransactionFormData } from '../components/transaction-form-fields';

export function mapTransactionToFormData(transaction: Transaction): TransactionFormData {
  return {
    description: transaction.description ?? '',
    amount: String(transaction.amount ?? ''),
    type: transaction.type,
    category: transaction.category ?? '',
    date: financialDateKey(transaction.date),
    user_id: transaction.user_id ?? '',
    account_id: transaction.account_id ?? '',
    to_account_id: transaction.to_account_id ?? '',
  };
}
