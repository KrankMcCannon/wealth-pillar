import type { Account } from '@/lib/types';

/**
 * Group-shared savings accounts whose balance is included when viewing a single user's total.
 * Centralizza la vecchia regola hardcoded su nome display; in futuro preferire id/metadata DB.
 */
export const SHARED_SAVINGS_ACCOUNT_NAMES = ['Risparmi Casa'] as const;

export function findSharedSavingsAccount(accounts: Account[]): Account | undefined {
  const names = SHARED_SAVINGS_ACCOUNT_NAMES as readonly string[];
  return accounts.find((a) => names.includes(a.name));
}
