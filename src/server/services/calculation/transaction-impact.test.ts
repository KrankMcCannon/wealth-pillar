import { describe, it, expect } from 'vitest';
import type { Transaction } from '@/lib/types';
import {
  classifyTransaction,
  calculateAccountImpact,
  calculateBalanceFromTransactions,
  aggregateTransactionsForPeriod,
  aggregateTransactionsForBudget,
  filterTransactionsByDateRange,
  calculateHistoricalBalance,
  calculateOverviewMetrics,
  toAccountIdSet,
} from './transaction-impact';

// ============================================================================
// HELPERS
// ============================================================================

function makeTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    description: 'Test',
    amount: 100,
    type: 'expense',
    category: 'food',
    date: '2025-06-15',
    user_id: 'user-1',
    account_id: 'account-a',
    to_account_id: null,
    group_id: 'group-1',
    created_at: '2025-06-15',
    updated_at: '2025-06-15',
    ...overrides,
  };
}

const userAccounts = new Set(['account-a', 'account-b']);

// ============================================================================
// classifyTransaction
// ============================================================================

describe('classifyTransaction', () => {
  it('classifies income correctly', () => {
    const t = makeTransaction({ type: 'income', account_id: 'account-a' });
    const result = classifyTransaction(t, userAccounts);
    expect(result).toEqual({
      type: 'income',
      amount: 100,
      sourceAccountId: 'account-a',
      destinationAccountId: null,
    });
  });

  it('classifies expense correctly', () => {
    const t = makeTransaction({ type: 'expense', account_id: 'account-a' });
    const result = classifyTransaction(t, userAccounts);
    expect(result).toEqual({
      type: 'expense',
      amount: 100,
      sourceAccountId: 'account-a',
      destinationAccountId: null,
    });
  });

  it('classifies internal transfer (both accounts in set)', () => {
    const t = makeTransaction({
      type: 'transfer',
      account_id: 'account-a',
      to_account_id: 'account-b',
    });
    const result = classifyTransaction(t, userAccounts);
    expect(result).toEqual({
      type: 'internal_transfer',
      amount: 100,
      sourceAccountId: 'account-a',
      destinationAccountId: 'account-b',
    });
  });

  it('classifies external transfer out (only source in set)', () => {
    const t = makeTransaction({
      type: 'transfer',
      account_id: 'account-a',
      to_account_id: 'external-acc',
    });
    const result = classifyTransaction(t, userAccounts);
    expect(result).toEqual({
      type: 'external_transfer_out',
      amount: 100,
      sourceAccountId: 'account-a',
      destinationAccountId: 'external-acc',
    });
  });

  it('classifies external transfer in (only dest in set)', () => {
    const t = makeTransaction({
      type: 'transfer',
      account_id: 'external-acc',
      to_account_id: 'account-a',
    });
    const result = classifyTransaction(t, userAccounts);
    expect(result).toEqual({
      type: 'external_transfer_in',
      amount: 100,
      sourceAccountId: 'external-acc',
      destinationAccountId: 'account-a',
    });
  });

  it('returns null for income to unrelated account', () => {
    const t = makeTransaction({ type: 'income', account_id: 'external-acc' });
    expect(classifyTransaction(t, userAccounts)).toBeNull();
  });

  it('returns null for expense from unrelated account', () => {
    const t = makeTransaction({ type: 'expense', account_id: 'external-acc' });
    expect(classifyTransaction(t, userAccounts)).toBeNull();
  });

  it('returns null for transfer between unrelated accounts', () => {
    const t = makeTransaction({
      type: 'transfer',
      account_id: 'ext-1',
      to_account_id: 'ext-2',
    });
    expect(classifyTransaction(t, userAccounts)).toBeNull();
  });

  it('handles transfer with null to_account_id', () => {
    const t = makeTransaction({
      type: 'transfer',
      account_id: 'account-a',
      to_account_id: null,
    });
    const result = classifyTransaction(t, userAccounts);
    expect(result).toEqual({
      type: 'external_transfer_out',
      amount: 100,
      sourceAccountId: 'account-a',
      destinationAccountId: null,
    });
  });
});

// ============================================================================
// calculateAccountImpact
// ============================================================================

describe('calculateAccountImpact', () => {
  it('income adds to balance', () => {
    const t = makeTransaction({ type: 'income', amount: 500 });
    expect(calculateAccountImpact(t, userAccounts)).toEqual({ delta: 500 });
  });

  it('expense subtracts from balance', () => {
    const t = makeTransaction({ type: 'expense', amount: 200 });
    expect(calculateAccountImpact(t, userAccounts)).toEqual({ delta: -200 });
  });

  it('internal transfer has zero impact', () => {
    const t = makeTransaction({
      type: 'transfer',
      account_id: 'account-a',
      to_account_id: 'account-b',
      amount: 300,
    });
    expect(calculateAccountImpact(t, userAccounts)).toEqual({ delta: 0 });
  });

  it('external transfer out subtracts from balance', () => {
    const t = makeTransaction({
      type: 'transfer',
      account_id: 'account-a',
      to_account_id: 'external-acc',
      amount: 150,
    });
    expect(calculateAccountImpact(t, userAccounts)).toEqual({ delta: -150 });
  });

  it('external transfer in adds to balance', () => {
    const t = makeTransaction({
      type: 'transfer',
      account_id: 'external-acc',
      to_account_id: 'account-a',
      amount: 250,
    });
    expect(calculateAccountImpact(t, userAccounts)).toEqual({ delta: 250 });
  });

  it('unrelated transaction has zero impact', () => {
    const t = makeTransaction({ account_id: 'external-acc' });
    expect(calculateAccountImpact(t, userAccounts)).toEqual({ delta: 0 });
  });
});

// ============================================================================
// calculateBalanceFromTransactions
// ============================================================================

describe('calculateBalanceFromTransactions', () => {
  it('calculates balance from mixed transactions', () => {
    const transactions = [
      makeTransaction({ type: 'income', amount: 1000 }),
      makeTransaction({ type: 'expense', amount: 300 }),
      makeTransaction({ type: 'expense', amount: 200 }),
      makeTransaction({
        type: 'transfer',
        account_id: 'account-a',
        to_account_id: 'account-b',
        amount: 100,
      }),
    ];
    // 1000 - 300 - 200 + 0 (internal) = 500
    expect(calculateBalanceFromTransactions(transactions, userAccounts)).toBe(500);
  });

  it('returns 0 for empty transactions', () => {
    expect(calculateBalanceFromTransactions([], userAccounts)).toBe(0);
  });

  it('handles floating point precision', () => {
    const transactions = [
      makeTransaction({ type: 'income', amount: 10.1 }),
      makeTransaction({ type: 'income', amount: 10.2 }),
    ];
    expect(calculateBalanceFromTransactions(transactions, userAccounts)).toBe(20.3);
  });
});

// ============================================================================
// filterTransactionsByDateRange
// ============================================================================

describe('filterTransactionsByDateRange', () => {
  const transactions = [
    makeTransaction({ id: 'tx-1', date: '2025-06-01' }),
    makeTransaction({ id: 'tx-2', date: '2025-06-15' }),
    makeTransaction({ id: 'tx-3', date: '2025-06-30' }),
    makeTransaction({ id: 'tx-4', date: '2025-07-01' }),
  ];

  it('filters within date range', () => {
    const result = filterTransactionsByDateRange(transactions, '2025-06-01', '2025-06-30');
    expect(result.map((t) => t.id)).toEqual(['tx-1', 'tx-2', 'tx-3']);
  });

  it('includes transactions on boundary dates', () => {
    const result = filterTransactionsByDateRange(transactions, '2025-06-15', '2025-06-15');
    expect(result.map((t) => t.id)).toEqual(['tx-2']);
  });

  it('returns all from start when endDate is null', () => {
    const result = filterTransactionsByDateRange(transactions, '2025-06-15', null);
    expect(result.map((t) => t.id)).toEqual(['tx-2', 'tx-3', 'tx-4']);
  });

  it('returns empty for invalid start date', () => {
    const result = filterTransactionsByDateRange(transactions, '', null);
    expect(result).toEqual([]);
  });
});

// ============================================================================
// aggregateTransactionsForPeriod
// ============================================================================

describe('aggregateTransactionsForPeriod', () => {
  it('aggregates all transaction types correctly', () => {
    const transactions = [
      makeTransaction({ type: 'income', amount: 1000 }),
      makeTransaction({ type: 'expense', amount: 300 }),
      makeTransaction({
        type: 'transfer',
        account_id: 'account-a',
        to_account_id: 'account-b',
        amount: 200,
      }),
      makeTransaction({
        type: 'transfer',
        account_id: 'account-a',
        to_account_id: 'external-acc',
        amount: 150,
      }),
      makeTransaction({
        type: 'transfer',
        account_id: 'external-acc',
        to_account_id: 'account-a',
        amount: 50,
      }),
    ];

    const result = aggregateTransactionsForPeriod(transactions, userAccounts);

    expect(result.totalIncome).toBe(1000);
    expect(result.totalExpense).toBe(300);
    expect(result.internalTransfers).toBe(200);
    expect(result.totalTransfersOut).toBe(150);
    expect(result.totalTransfersIn).toBe(50);
    // net = 1000 - 300 + 50 - 150 = 600
    expect(result.netChange).toBe(600);
  });

  it('returns zeros for empty transactions', () => {
    const result = aggregateTransactionsForPeriod([], userAccounts);
    expect(result.totalIncome).toBe(0);
    expect(result.totalExpense).toBe(0);
    expect(result.netChange).toBe(0);
  });

  it('ignores transactions for unrelated accounts', () => {
    const transactions = [
      makeTransaction({ type: 'income', amount: 500, account_id: 'external-acc' }),
    ];
    const result = aggregateTransactionsForPeriod(transactions, userAccounts);
    expect(result.totalIncome).toBe(0);
    expect(result.netChange).toBe(0);
  });
});

// ============================================================================
// aggregateTransactionsForBudget
// ============================================================================

describe('aggregateTransactionsForBudget', () => {
  const budgetCategories = ['food', 'transport'];

  it('counts expenses matching budget categories', () => {
    const transactions = [
      makeTransaction({ type: 'expense', category: 'food', amount: 50 }),
      makeTransaction({ type: 'expense', category: 'transport', amount: 30 }),
      makeTransaction({ type: 'expense', category: 'entertainment', amount: 100 }),
    ];
    const result = aggregateTransactionsForBudget(transactions, budgetCategories);
    expect(result.spent).toBe(80);
    expect(result.income).toBe(0);
    expect(result.net).toBe(80);
  });

  it('income matching category reduces net spent', () => {
    const transactions = [
      makeTransaction({ type: 'expense', category: 'food', amount: 100 }),
      makeTransaction({ type: 'income', category: 'food', amount: 30 }),
    ];
    const result = aggregateTransactionsForBudget(transactions, budgetCategories);
    expect(result.spent).toBe(100);
    expect(result.income).toBe(30);
    expect(result.net).toBe(70);
  });

  it('internal transfers have no budget impact when accountIds provided', () => {
    const transactions = [
      makeTransaction({
        type: 'transfer',
        category: 'food',
        account_id: 'account-a',
        to_account_id: 'account-b',
        amount: 200,
      }),
    ];
    const result = aggregateTransactionsForBudget(transactions, budgetCategories, userAccounts);
    expect(result.spent).toBe(0);
    expect(result.income).toBe(0);
    expect(result.net).toBe(0);
  });

  it('external transfer out counts as budget spent', () => {
    const transactions = [
      makeTransaction({
        type: 'transfer',
        category: 'food',
        account_id: 'account-a',
        to_account_id: 'external-acc',
        amount: 75,
      }),
    ];
    const result = aggregateTransactionsForBudget(transactions, budgetCategories, userAccounts);
    expect(result.spent).toBe(75);
    expect(result.net).toBe(75);
  });

  it('external transfer in counts as budget income', () => {
    const transactions = [
      makeTransaction({
        type: 'transfer',
        category: 'food',
        account_id: 'external-acc',
        to_account_id: 'account-a',
        amount: 40,
      }),
    ];
    const result = aggregateTransactionsForBudget(transactions, budgetCategories, userAccounts);
    expect(result.income).toBe(40);
    expect(result.net).toBe(-40);
  });

  it('returns zeros for empty transactions', () => {
    const result = aggregateTransactionsForBudget([], budgetCategories);
    expect(result).toEqual({ spent: 0, income: 0, net: 0 });
  });

  it('returns zeros when no categories match', () => {
    const transactions = [
      makeTransaction({ type: 'expense', category: 'entertainment', amount: 999 }),
    ];
    const result = aggregateTransactionsForBudget(transactions, budgetCategories);
    expect(result).toEqual({ spent: 0, income: 0, net: 0 });
  });
});

// ============================================================================
// calculateHistoricalBalance
// ============================================================================

describe('calculateHistoricalBalance', () => {
  it('reverses future transactions to find historical balance', () => {
    const transactions = [
      makeTransaction({ type: 'income', amount: 500, date: '2025-06-01' }),
      makeTransaction({ type: 'expense', amount: 200, date: '2025-06-10' }),
      makeTransaction({ type: 'expense', amount: 100, date: '2025-06-20' }),
    ];
    // Current balance: 1000
    // Reverse from June 10: -(-200) -(-100) = +300, so subtract netChange
    // Net of future tx (June 10+): 0 - 200 - 100 = -300
    // Historical = 1000 - (-300) = 1300
    const result = calculateHistoricalBalance(transactions, userAccounts, 1000, '2025-06-10');
    expect(result).toBe(1300);
  });

  it('returns current balance when no future transactions', () => {
    const transactions = [makeTransaction({ type: 'income', amount: 500, date: '2025-01-01' })];
    const result = calculateHistoricalBalance(transactions, userAccounts, 1000, '2025-12-01');
    expect(result).toBe(1000);
  });

  it('returns current balance for invalid target date', () => {
    expect(calculateHistoricalBalance([], userAccounts, 1000, '')).toBe(1000);
  });
});

// ============================================================================
// calculateOverviewMetrics
// ============================================================================

describe('calculateOverviewMetrics', () => {
  it('calculates overview metrics correctly', () => {
    const transactions = [
      makeTransaction({ type: 'income', amount: 2000, user_id: 'user-1' }),
      makeTransaction({ type: 'expense', amount: 500, user_id: 'user-1' }),
      makeTransaction({
        type: 'transfer',
        account_id: 'account-a',
        to_account_id: 'external-acc',
        amount: 300,
        user_id: 'user-1',
      }),
    ];

    const result = calculateOverviewMetrics(transactions, userAccounts);

    expect(result.totalEarned).toBe(2000); // income only
    expect(result.totalSpent).toBe(800); // 500 expense + 300 external transfer out
    expect(result.totalTransferred).toBe(300);
    expect(result.totalBalance).toBe(1200); // 2000 - 800
  });

  it('filters by userId when provided', () => {
    const transactions = [
      makeTransaction({ type: 'income', amount: 1000, user_id: 'user-1' }),
      makeTransaction({ type: 'income', amount: 500, user_id: 'user-2' }),
    ];

    const result = calculateOverviewMetrics(transactions, userAccounts, 'user-1');
    expect(result.totalEarned).toBe(1000);
  });
});

// ============================================================================
// toAccountIdSet
// ============================================================================

describe('toAccountIdSet', () => {
  it('converts string to set', () => {
    const set = toAccountIdSet('acc-1');
    expect(set.has('acc-1')).toBe(true);
    expect(set.size).toBe(1);
  });

  it('converts array to set', () => {
    const set = toAccountIdSet(['acc-1', 'acc-2']);
    expect(set.has('acc-1')).toBe(true);
    expect(set.has('acc-2')).toBe(true);
  });

  it('passes through existing set', () => {
    const original = new Set(['acc-1']);
    const result = toAccountIdSet(original);
    expect(result).toBe(original);
  });
});
