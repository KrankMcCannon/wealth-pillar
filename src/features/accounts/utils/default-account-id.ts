import type { Account, User } from '@/lib/types';

export function getDefaultAccountIdForUser(
  userId: string,
  accounts: Account[],
  groupUsers: User[]
): string {
  if (!userId) return accounts[0]?.id ?? '';

  const user = groupUsers.find((u) => u.id === userId);
  if (user?.default_account_id) {
    const defaultAccount = accounts.find(
      (acc) => acc.id === user.default_account_id && acc.user_ids.includes(userId)
    );
    if (defaultAccount) return defaultAccount.id;
  }

  const userAccounts = accounts.filter((acc) => acc.user_ids.includes(userId));
  if (userAccounts.length > 0) return userAccounts[0]?.id ?? '';

  return accounts[0]?.id ?? '';
}

export function defaultAccountUserId(
  isDefault: boolean,
  ownerIds: string[],
  currentUserId: string
): string | undefined {
  if (!isDefault || ownerIds.length === 0) return undefined;
  if (ownerIds.includes(currentUserId)) return currentUserId;
  return ownerIds.length === 1 ? ownerIds[0] : undefined;
}
