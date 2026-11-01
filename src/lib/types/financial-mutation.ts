import type { Transaction } from '@/lib/types';

export type TransactionMutationResult = Transaction & {
  accountBalances: Record<string, number>;
};

export type TransactionDeleteResult = {
  id: string;
  accountBalances: Record<string, number>;
};
