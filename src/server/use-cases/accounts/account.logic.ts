import type { Account, Transaction } from '@/lib/types';

/**
 * Get default accounts for users (Pure business logic)
 */
export function getDefaultAccounts(
  accounts: Account[],
  users: Array<{ id: string; default_account_id?: string | null }>
): Account[] {
  // Get all default account IDs from users (filter out null and undefined)
  const defaultAccountIds = new Set(
    users
      .map((user) => user.default_account_id)
      .filter((id): id is string => id !== null && id !== undefined)
  );

  // Filter accounts to only include default accounts
  return accounts.filter((account) => defaultAccountIds.has(account.id));
}

/**
 * Calculate aggregated balance from a list of accounts
 * Uses the 'balance' field from the database
 */
export function calculateAggregatedBalance(accounts: Account[]): number {
  return accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
}

/**
 * Calculate account balance from transactions (Pure business logic)
 */
export function calculateAccountBalance(
  accountIds: string | Set<string>,
  transactions: Transaction[]
): number {
  const accountSet = typeof accountIds === 'string' ? new Set([accountIds]) : accountIds;

  const balance = transactions.reduce((balance, transaction) => {
    // Check if this transaction involves this account
    const isSourceAccount = accountSet.has(transaction.account_id);
    const isDestinationAccount =
      transaction.to_account_id && accountSet.has(transaction.to_account_id);

    // Skip if transaction doesn't involve this account
    if (!isSourceAccount && !isDestinationAccount) {
      return balance;
    }

    // Handle transfers (has to_account_id)
    if (transaction.to_account_id) {
      if (isSourceAccount && isDestinationAccount) {
        // Internal transfer within the set: NO NET CHANGE
        return balance;
      } else if (isSourceAccount) {
        // Money leaving this account set
        return balance - transaction.amount;
      } else if (isDestinationAccount) {
        // Money entering this account set
        return balance + transaction.amount;
      }
    }

    // Handle regular transactions (no to_account_id or not transfer)
    if (isSourceAccount) {
      if (transaction.type === 'income') {
        // Income adds to balance
        return balance + transaction.amount;
      } else if (transaction.type === 'expense') {
        // Expense subtracts from balance
        return balance - transaction.amount;
      }
    }

    return balance;
  }, 0);

  // Round to 2 decimal places to avoid floating point precision issues
  return Math.round(balance * 100) / 100;
}
