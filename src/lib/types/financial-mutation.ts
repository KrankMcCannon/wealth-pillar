import type { Transaction } from '@/lib/types';

export type TransactionMutationResult = Transaction & {
  accountBalances: Record<string, number>;
  accountBalanceVersions?: Record<string, string>;
};

export type TransactionDeleteResult = {
  id: string;
  accountBalances: Record<string, number>;
  accountBalanceVersions?: Record<string, string>;
};
