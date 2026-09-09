import type { Account } from '@/lib/types';

export function getTransferDestinationAccounts(
  accounts: Account[],
  sourceAccountId: string | undefined
): Account[] {
  return accounts.filter((account) => account.id !== sourceAccountId);
}

export function accountSelectLabel(
  account: Account,
  users: ReadonlyArray<{ id: string; name: string | null }>
): string {
  const owners = users
    .filter((user) => account.user_ids.includes(user.id))
    .map((user) => user.name?.trim())
    .filter((name): name is string => Boolean(name));
  return owners.length > 0 ? `${account.name} (${owners.join(', ')})` : account.name;
}
