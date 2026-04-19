import type { TransactionType } from '@/lib/types';

/**
 * Input data for creating a new transaction
 */
export interface CreateTransactionInput {
  description: string;
  amount: number;
  type: TransactionType;
  category: string;
  date: string | Date;
  user_id: string | null;
  account_id: string;
  to_account_id?: string | null;
  group_id: string;
  frequency?: string;
  recurring_series_id?: string;
}

/**
 * Input data for updating an existing transaction
 */
export type UpdateTransactionInput = Partial<CreateTransactionInput>;
