import type { Account } from '@/lib/types';

export function formatDateForInput(date: string | Date | null | undefined): string {
  if (!date) return '';
  if (typeof date === 'string') return date.split('T')[0] ?? '';
  return date.toISOString().split('T')[0] ?? '';
}

export function calculateDefaultAccountId(
  watchedUserIds: string[] | undefined,
  filteredAccounts: Account[],
  accounts: Account[],
  currentUser: { id: string },
  groupUsers: { id: string; default_account_id?: string | null }[]
): string {
  if (!watchedUserIds || watchedUserIds.length === 0 || filteredAccounts.length === 0) {
    return '';
  }

  if (watchedUserIds.length === 1) {
    const selectedUser = groupUsers.find((u) => u.id === watchedUserIds[0]);

    if (selectedUser?.default_account_id) {
      const defaultAcc = filteredAccounts.find((acc) => acc.id === selectedUser.default_account_id);
      if (defaultAcc) {
        return defaultAcc.id;
      }
    }

    return filteredAccounts[0]?.id ?? '';
  }

  if (filteredAccounts.length > 0) {
    return filteredAccounts[0]?.id ?? '';
  }

  const creator = groupUsers.find((u) => u.id === currentUser.id);
  if (creator?.default_account_id) {
    const creatorDefaultAcc = accounts.find((acc) => acc.id === creator.default_account_id);
    if (creatorDefaultAcc) {
      return creatorDefaultAcc.id;
    }
  }

  return accounts.length > 0 ? (accounts[0]?.id ?? '') : '';
}
