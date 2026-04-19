import type { Account, Transaction } from '@/lib/types';
import { toDateTime } from '@/lib/utils';
import type { DateInput } from '@/lib/utils/date-utils';

export function getDefaultAccounts(
  accounts: Account[],
  users: Array<{ id: string; default_account_id?: string | null }>
): Account[] {
  const defaultAccountIds = new Set(
    users
      .map((user) => user.default_account_id)
      .filter((id): id is string => id !== null && id !== undefined)
  );

  return accounts.filter((account) => defaultAccountIds.has(account.id));
}

export function calculateAggregatedBalance(accounts: Account[]): number {
  return accounts.reduce((sum, account) => sum + (account.balance || 0), 0);
}

export function calculateAccountBalance(
  accountIds: string | Set<string>,
  transactions: Transaction[]
): number {
  const accountSet = typeof accountIds === 'string' ? new Set([accountIds]) : accountIds;

  const balance = transactions.reduce((balance, transaction) => {
    const isSourceAccount = accountSet.has(transaction.account_id);
    const isDestinationAccount =
      transaction.to_account_id && accountSet.has(transaction.to_account_id);

    if (!isSourceAccount && !isDestinationAccount) {
      return balance;
    }

    if (transaction.to_account_id) {
      if (isSourceAccount && isDestinationAccount) {
        return balance;
      } else if (isSourceAccount) {
        return balance - transaction.amount;
      } else if (isDestinationAccount) {
        return balance + transaction.amount;
      }
    }

    if (isSourceAccount) {
      if (transaction.type === 'income') {
        return balance + transaction.amount;
      } else if (transaction.type === 'expense') {
        return balance - transaction.amount;
      }
    }

    return balance;
  }, 0);

  return Math.round(balance * 100) / 100;
}

export function calculateHistoricalBalance(
  allTransactions: Transaction[],
  accountIds: string | Set<string>,
  currentBalance: number,
  targetDate: DateInput
): number {
  const targetDt = toDateTime(targetDate)?.startOf('day');
  if (!targetDt) return currentBalance;

  const accountSet = typeof accountIds === 'string' ? new Set([accountIds]) : accountIds;

  const futureTransactions = allTransactions.filter((t) => {
    const tDate = toDateTime(t.date);
    return tDate && tDate >= targetDt;
  });

  let historicalBalance = currentBalance;

  for (const t of futureTransactions) {
    const isSource = accountSet.has(t.account_id);
    const isDest = t.to_account_id && accountSet.has(t.to_account_id);

    if (!isSource && !isDest) continue;

    if (t.type === 'expense' && isSource) {
      historicalBalance += t.amount;
    } else if (t.type === 'income' && isSource) {
      historicalBalance -= t.amount;
    } else if (t.type === 'transfer') {
      if (isSource && isDest) {
        // Internal
      } else if (isSource) {
        historicalBalance += t.amount;
      } else if (isDest) {
        historicalBalance -= t.amount;
      }
    }
  }

  return historicalBalance;
}

export function calculatePeriodTotalSpent(
  periodTransactions: Transaction[],
  accountIds: string | Set<string>
): number {
  const accountSet = typeof accountIds === 'string' ? new Set([accountIds]) : accountIds;

  return periodTransactions.reduce((sum, t) => {
    const isSource = accountSet.has(t.account_id);
    if (!isSource) return sum;

    if (t.type === 'expense') {
      return sum + t.amount;
    }

    if (t.type === 'transfer') {
      const isDestInternal = t.to_account_id && accountSet.has(t.to_account_id);
      if (!isDestInternal) {
        return sum + t.amount;
      }
    }

    return sum;
  }, 0);
}

export function calculatePeriodTotalIncome(
  periodTransactions: Transaction[],
  accountIds: string | Set<string>
): number {
  const accountSet = typeof accountIds === 'string' ? new Set([accountIds]) : accountIds;

  return periodTransactions.reduce((sum, t) => {
    if (t.type === 'income' && accountSet.has(t.account_id)) {
      return sum + t.amount;
    }

    if (t.type === 'transfer' && t.to_account_id && accountSet.has(t.to_account_id)) {
      const isSourceInternal = accountSet.has(t.account_id);
      if (!isSourceInternal) {
        return sum + t.amount;
      }
    }

    return sum;
  }, 0);
}

export function calculatePeriodTotalTransfers(
  periodTransactions: Transaction[],
  accountIds: string | Set<string>
): number {
  const accountSet = typeof accountIds === 'string' ? new Set([accountIds]) : accountIds;

  return periodTransactions.reduce((sum, t) => {
    if (t.type !== 'transfer') return sum;

    const isSource = accountSet.has(t.account_id);
    const isDest = t.to_account_id && accountSet.has(t.to_account_id);

    if (isSource || isDest) {
      return sum + t.amount;
    }
    return sum;
  }, 0);
}
