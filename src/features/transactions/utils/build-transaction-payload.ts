import type { CreateTransactionInput } from '@/server/use-cases/transactions/types';
import type { TransactionFormData } from '../components/transaction-form-fields';
export function buildTransactionPayload(
  data: TransactionFormData,
  groupId: string
): CreateTransactionInput {
  const amount = Number.parseFloat(data.amount);

  return {
    description: data.description.trim(),
    amount,
    type: data.type,
    category: data.category,
    date: data.date,
    user_id: data.user_id,
    account_id: data.account_id,
    to_account_id: data.type === 'transfer' ? (data.to_account_id ?? null) : null,
    group_id: groupId,
  };
}
