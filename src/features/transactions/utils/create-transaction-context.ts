import type { Account, User } from '@/lib/types';
import { getDefaultAccountIdForUser } from '@/features/accounts/utils/default-account-id';
import { canAccessUserData } from '@/lib/utils/permissions';

export function resolveTransactionCreateContext(
  params: URLSearchParams,
  currentUser: User,
  groupUsers: User[],
  accounts: Account[]
) {
  const requestedUser = params.get('user');
  const userId =
    requestedUser &&
    groupUsers.some((user) => user.id === requestedUser) &&
    canAccessUserData(currentUser, requestedUser)
      ? requestedUser
      : currentUser.id;
  const requestedAccount = params.get('account');
  const accountId =
    accounts.find((account) => account.id === requestedAccount && account.user_ids.includes(userId))
      ?.id ??
    getDefaultAccountIdForUser(
      userId,
      accounts.filter((account) => account.user_ids.includes(userId)),
      groupUsers
    );
  const requestedType = params.get('type');
  const type =
    requestedType === 'income' || requestedType === 'transfer' ? requestedType : 'expense';
  return { user_id: userId, account_id: accountId, type } as const;
}
