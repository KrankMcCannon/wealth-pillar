import { serialize } from '@/lib/utils/serializer';
import { cached } from '@/lib/cache';
import { CACHE_TAGS, cacheOptions } from '@/lib/cache/config';
import { accountCacheKeys } from '@/lib/cache/keys';
import { AccountsRepository } from '@/server/repositories/accounts.repository';
import {
  validateId,
  validateRequiredString,
  validateNonEmptyArray,
} from '@/lib/utils/validation-utils';
import { invalidateAccountCaches } from '@/lib/utils/cache-utils';
import { deleteTransactionsByAccountUseCase } from '@/server/use-cases/transactions/delete-transaction.use-case';
import type { Account } from '@/lib/types';

export interface CreateAccountInput {
  id?: string;
  name: string;
  type: Account['type'];
  user_ids: string[];
  group_id: string;
}

export interface UpdateAccountInput {
  name?: string;
  type?: Account['type'];
  user_ids?: string[];
  group_id?: string;
}

export const getAccountByIdUseCase = async (accountId: string): Promise<Account> => {
  if (!accountId?.trim()) throw new Error('Account ID is required');

  const getCachedAccount = cached(
    async () => {
      const account = await AccountsRepository.findById(accountId);
      if (!account) return null;
      return serialize({ ...account, balance: Number(account.balance) }) as Account;
    },
    accountCacheKeys.byId(accountId),
    cacheOptions.account(accountId)
  );

  const account = await getCachedAccount();
  if (!account) throw new Error('Account not found');
  return account;
};

export const getAccountsByUserUseCase = async (userId: string): Promise<Account[]> => {
  if (!userId?.trim()) throw new Error('User ID is required');

  const getCachedAccounts = cached(
    async () => {
      const accounts = await AccountsRepository.findByUser(userId);
      return serialize(accounts.map((a) => ({ ...a, balance: Number(a.balance) }))) as Account[];
    },
    accountCacheKeys.byUser(userId),
    cacheOptions.accountsByUser(userId)
  );

  return getCachedAccounts();
};

export const getAccountsByGroupUseCase = async (groupId: string): Promise<Account[]> => {
  if (!groupId?.trim()) throw new Error('Group ID is required');

  const getCachedAccounts = cached(
    async () => {
      const accounts = await AccountsRepository.findByGroup(groupId);
      return serialize(accounts.map((a) => ({ ...a, balance: Number(a.balance) }))) as Account[];
    },
    accountCacheKeys.byGroup(groupId),
    cacheOptions.accountsByGroup(groupId)
  );

  return getCachedAccounts();
};

export const getAccountCountByUserUseCase = async (userId: string): Promise<number> => {
  if (!userId?.trim()) throw new Error('User ID is required');

  const getCachedCount = cached(
    async () => AccountsRepository.countByUser(userId),
    [`user:${userId}:accounts:count`],
    { revalidate: 300, tags: [CACHE_TAGS.ACCOUNTS, `user:${userId}:accounts`] }
  );

  return getCachedCount();
};

export const accountExistsUseCase = async (accountId: string): Promise<boolean> => {
  try {
    if (!accountId?.trim()) return false;
    const account = await AccountsRepository.findById(accountId);
    return !!account;
  } catch {
    return false;
  }
};

export const createAccountUseCase = async (data: CreateAccountInput): Promise<Account> => {
  const name = validateRequiredString(data.name, 'Account name');
  if (!data.type) throw new Error('Account type is required');
  validateId(data.group_id, 'Group ID');
  validateNonEmptyArray(data.user_ids, 'user');

  const now = new Date();

  const account = await AccountsRepository.create({
    ...(data.id !== undefined && { id: data.id }),
    name,
    type: data.type,
    user_ids: data.user_ids,
    group_id: data.group_id,
    created_at: now,
    updated_at: now,
  });

  if (!account) throw new Error('Failed to create account');

  invalidateAccountCaches({
    accountId: account.id,
    groupId: data.group_id,
    userIds: data.user_ids,
  });

  return serialize(account);
};

export const updateAccountUseCase = async (
  accountId: string,
  data: UpdateAccountInput
): Promise<Account> => {
  validateId(accountId, 'Account ID');

  const account = await AccountsRepository.update(accountId, data);

  if (!account) throw new Error('Failed to update account');

  invalidateAccountCaches({
    accountId,
    groupId: account.group_id ?? undefined,
    userIds: account.user_ids,
  });

  return serialize(account);
};

export const deleteAccountUseCase = async (accountId: string): Promise<boolean> => {
  validateId(accountId, 'Account ID');

  const account = await getAccountByIdUseCase(accountId);

  // Delete related transactions first
  await deleteTransactionsByAccountUseCase(accountId);

  // Delete the account
  await AccountsRepository.delete(accountId);

  invalidateAccountCaches({
    accountId,
    groupId: account.group_id ?? undefined,
    userIds: account.user_ids,
  });

  return true;
};
