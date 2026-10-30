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
import { invalidateAccountCaches, invalidateTransactionCaches } from '@/lib/utils/cache-utils';
import { db } from '@/server/db/drizzle';
import { TransactionsRepository } from '@/server/repositories/transactions.repository';
import {
  computeBalanceDeltas,
  sumAccountBalanceFromRows,
} from '@/server/use-cases/transactions/transaction-balance-delta.core';
import type { Account, AccountLiquidity } from '@/lib/types';
import { defaultLiquidityForType } from '@/lib/utils/account-classification';

export interface CreateAccountInput {
  id?: string;
  name: string;
  type: Account['type'];
  liquidity?: AccountLiquidity | null;
  user_ids: string[];
  group_id: string;
}

export interface UpdateAccountInput {
  name?: string;
  type?: Account['type'];
  liquidity?: AccountLiquidity | null;
  user_ids?: string[];
}

function serializeAccountRow(account: Account): Account {
  const row = { ...account, balance: Number(account.balance) } as Account;
  const liquidity = row.liquidity ?? defaultLiquidityForType(row.type);
  return { ...row, liquidity };
}

export const getAccountByIdUseCase = async (accountId: string): Promise<Account> => {
  if (!accountId?.trim()) throw new Error('Account ID is required');

  const getCachedAccount = cached(
    async () => {
      const account = await AccountsRepository.findById(accountId);
      if (!account) return null;
      return serialize(serializeAccountRow(account));
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
      return serialize(accounts.map((a) => serializeAccountRow(a)));
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
      return serialize(accounts.map((a) => serializeAccountRow(a)));
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

  const liquidity = data.liquidity ?? defaultLiquidityForType(data.type);

  const account = await AccountsRepository.create({
    ...(data.id !== undefined && { id: data.id }),
    name,
    type: data.type,
    liquidity,
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

  return serialize(serializeAccountRow(account));
};

export const updateAccountUseCase = async (
  accountId: string,
  data: UpdateAccountInput
): Promise<Account> => {
  validateId(accountId, 'Account ID');

  // Whitelist mutable fields, including for untyped Server Action payloads.
  const updatePayload: Parameters<typeof AccountsRepository.update>[1] = {};
  if (data.name !== undefined) updatePayload.name = data.name;
  if (data.type !== undefined) updatePayload.type = data.type;
  if (data.liquidity !== undefined) updatePayload.liquidity = data.liquidity;
  if (data.user_ids !== undefined) updatePayload.user_ids = data.user_ids;
  if (data.type !== undefined && data.liquidity === undefined) {
    updatePayload.liquidity = defaultLiquidityForType(data.type);
  }

  const account = await AccountsRepository.update(accountId, updatePayload);

  if (!account) throw new Error('Failed to update account');

  invalidateAccountCaches({
    accountId,
    groupId: account.group_id ?? undefined,
    userIds: account.user_ids,
  });

  return serialize(serializeAccountRow(account));
};

export const recalculateAccountBalanceUseCase = async (accountId: string): Promise<Account> => {
  validateId(accountId, 'Account ID');

  const account = await db.transaction(
    async (tx) => {
      // Balance deltas UPDATE this same row. Lock before reading the ledger, using
      // READ COMMITTED so a writer that committed while we waited is included.
      // Pending ledger writes remain invisible and apply their delta after commit.
      if (!(await AccountsRepository.findByIdForUpdate(accountId, tx))) {
        throw new Error('Account not found');
      }
      const rows = await TransactionsRepository.getByAccount(accountId, tx);
      const balance = sumAccountBalanceFromRows(accountId, rows);
      const updated = await AccountsRepository.update(
        accountId,
        { balance: balance.toFixed(2) },
        tx
      );
      if (!updated) throw new Error('Failed to update account');
      return updated;
    },
    { isolationLevel: 'read committed' }
  );

  invalidateAccountCaches({
    accountId,
    groupId: account.group_id ?? undefined,
    userIds: account.user_ids,
  });

  return serialize(serializeAccountRow(account));
};

export const deleteAccountUseCase = async (accountId: string): Promise<boolean> => {
  validateId(accountId, 'Account ID');

  const { account, removed } = await db.transaction(async (tx) => {
    const account = await AccountsRepository.findById(accountId, tx);
    if (!account) throw new Error('Account not found');

    // RETURNING gives the exact rows removed, so concurrent deletes cannot reverse them twice.
    const removed = await TransactionsRepository.deleteByAccount(accountId, tx);
    const deltas = new Map<string, number>();
    for (const row of removed) {
      for (const [id, delta] of computeBalanceDeltas(row, -1)) {
        if (id !== accountId) deltas.set(id, (deltas.get(id) ?? 0) + delta);
      }
    }
    for (const [id, delta] of [...deltas].sort(([a], [b]) => a.localeCompare(b))) {
      await TransactionsRepository.updateAccountBalance(id, delta, tx);
    }
    if (!(await AccountsRepository.delete(accountId, tx))) throw new Error('Account not found');
    return { account, removed };
  });

  for (const row of removed) {
    invalidateTransactionCaches({
      groupId: row.group_id ?? account.group_id,
      accountId: row.account_id,
      toAccountId: row.to_account_id,
      userId: row.user_id,
      transactionId: row.id,
    });
  }

  invalidateAccountCaches({
    accountId,
    groupId: account.group_id ?? undefined,
    userIds: account.user_ids,
  });

  return true;
};
