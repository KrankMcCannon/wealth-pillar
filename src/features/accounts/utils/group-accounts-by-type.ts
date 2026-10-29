import type { Account, AccountType } from '@/lib/types';

/** Checking → cash → savings → investments. */
export const ACCOUNT_TYPE_ORDER: readonly AccountType[] = [
  'payroll',
  'cash',
  'savings',
  'investments',
];

export function groupAccountsByType(
  accounts: Account[]
): { type: AccountType; accounts: Account[] }[] {
  const buckets: Record<AccountType, Account[]> = {
    payroll: [],
    cash: [],
    savings: [],
    investments: [],
  };
  for (const account of accounts) {
    buckets[account.type].push(account);
  }
  return ACCOUNT_TYPE_ORDER.flatMap((type) => {
    const items = buckets[type];
    return items.length > 0 ? [{ type, accounts: items }] : [];
  });
}
