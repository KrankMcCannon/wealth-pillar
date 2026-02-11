import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionLogic } from './transaction-logic';
import type { Transaction, CategoryBreakdownItem } from '@/lib/types';

// Mock FinanceLogicService
vi.mock('@/server/services/finance-logic.service', () => ({
  FinanceLogicService: {
    calculateCategoryBreakdown: vi.fn(),
  },
}));

// Mock date-utils
vi.mock('@/lib/utils/date-utils', () => ({
  toDateTime: vi.fn((date: string | Date | null) => {
    if (!date) return null;
    const d = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) return null;
    return d;
  }),
  formatDateSmart: vi.fn((date: Date) => {
    if (!date) return '';
    const today = new Date();
    const inputDate = date instanceof Date ? date : new Date(date);

    // Simple mock: return 'Oggi' for today, formatted date otherwise
    if (inputDate.toDateString() === today.toDateString()) {
      return 'Oggi';
    }
    return `${inputDate.getDate()}/${inputDate.getMonth() + 1}/${inputDate.getFullYear()}`;
  }),
}));

import { FinanceLogicService } from '@/server/services/finance-logic.service';

// Factory helper for creating mock transactions
function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    description: 'Test Transaction',
    amount: 100,
    type: 'expense',
    category: 'food',
    date: '2024-01-15',
    user_id: 'user-1',
    account_id: 'account-1',
    to_account_id: null,
    frequency: 'once',
    recurring_series_id: null,
    group_id: 'group-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

describe('TransactionLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateReportMetrics', () => {
    it('should calculate report metrics from transactions', () => {
      const mockBreakdown: CategoryBreakdownItem[] = [
        { category: 'food', spent: 500, received: 0, net: 500, percentage: 50, count: 5 },
        { category: 'salary', spent: 0, received: 1000, net: -1000, percentage: 0, count: 1 },
        { category: 'transport', spent: 300, received: 0, net: 300, percentage: 30, count: 3 },
      ];

      vi.mocked(FinanceLogicService.calculateCategoryBreakdown).mockReturnValue(mockBreakdown);

      const transactions = [
        createMockTransaction({ id: 'tx-1', type: 'expense', amount: 500, category: 'food' }),
        createMockTransaction({ id: 'tx-2', type: 'income', amount: 1000, category: 'salary' }),
        createMockTransaction({ id: 'tx-3', type: 'expense', amount: 300, category: 'transport' }),
      ];

      const result = TransactionLogic.calculateReportMetrics(transactions);

      expect(result.income).toBe(1000);
      expect(result.expenses).toBe(800); // 500 + 300
      expect(result.netSavings).toBe(200);
      expect(result.savingsRate).toBe(20); // (200 / 1000) * 100
      expect(result.categories).toHaveLength(3);
    });

    it('should filter by userId when provided', () => {
      const mockBreakdown: CategoryBreakdownItem[] = [
        { category: 'food', spent: 200, received: 0, net: 200, percentage: 100, count: 2 },
      ];
      vi.mocked(FinanceLogicService.calculateCategoryBreakdown).mockReturnValue(mockBreakdown);

      const transactions = [
        createMockTransaction({ id: 'tx-1', user_id: 'user-1', amount: 100 }),
        createMockTransaction({ id: 'tx-2', user_id: 'user-2', amount: 200 }),
        createMockTransaction({ id: 'tx-3', user_id: 'user-1', amount: 100 }),
      ];

      TransactionLogic.calculateReportMetrics(transactions, 'user-1');

      // Verify calculateCategoryBreakdown was called with filtered transactions
      expect(FinanceLogicService.calculateCategoryBreakdown).toHaveBeenCalledWith(
        expect.arrayContaining([expect.objectContaining({ user_id: 'user-1' })])
      );
      // Should not include user-2
      const callArg = vi.mocked(FinanceLogicService.calculateCategoryBreakdown).mock.calls[0][0];
      expect(callArg.every((t) => t.user_id === 'user-1')).toBe(true);
    });

    it('should return 0 savings rate when income is 0', () => {
      const mockBreakdown: CategoryBreakdownItem[] = [
        { category: 'food', spent: 500, received: 0, net: 500, percentage: 100, count: 5 },
      ];
      vi.mocked(FinanceLogicService.calculateCategoryBreakdown).mockReturnValue(mockBreakdown);

      const transactions = [createMockTransaction({ type: 'expense', amount: 500 })];

      const result = TransactionLogic.calculateReportMetrics(transactions);

      expect(result.income).toBe(0);
      expect(result.expenses).toBe(500);
      expect(result.savingsRate).toBe(0);
    });

    it('should handle empty transactions array', () => {
      vi.mocked(FinanceLogicService.calculateCategoryBreakdown).mockReturnValue([]);

      const result = TransactionLogic.calculateReportMetrics([]);

      expect(result.income).toBe(0);
      expect(result.expenses).toBe(0);
      expect(result.netSavings).toBe(0);
      expect(result.savingsRate).toBe(0);
      expect(result.categories).toHaveLength(0);
    });
  });

  describe('groupTransactionsByDate', () => {
    it('should group transactions by formatted date', () => {
      const transactions = [
        createMockTransaction({ id: 'tx-1', date: '2024-01-15' }),
        createMockTransaction({ id: 'tx-2', date: '2024-01-15' }),
        createMockTransaction({ id: 'tx-3', date: '2024-01-16' }),
      ];

      const result = TransactionLogic.groupTransactionsByDate(transactions);

      // Should have 2 groups (2 different dates)
      expect(Object.keys(result)).toHaveLength(2);
    });

    it('should handle transactions with same date in one group', () => {
      const transactions = [
        createMockTransaction({ id: 'tx-1', date: '2024-01-15' }),
        createMockTransaction({ id: 'tx-2', date: '2024-01-15' }),
      ];

      const result = TransactionLogic.groupTransactionsByDate(transactions);

      const groups = Object.values(result);
      expect(groups.length).toBe(1);
      expect(groups[0]).toHaveLength(2);
    });

    it('should skip transactions with invalid dates', () => {
      const transactions = [
        createMockTransaction({ id: 'tx-1', date: '2024-01-15' }),
        createMockTransaction({ id: 'tx-2', date: null as unknown as string }), // Invalid
      ];

      const result = TransactionLogic.groupTransactionsByDate(transactions);

      // Only valid transaction should be grouped
      const totalGrouped = Object.values(result).flat().length;
      expect(totalGrouped).toBe(1);
    });

    it('should return empty object for empty transactions array', () => {
      const result = TransactionLogic.groupTransactionsByDate([]);

      expect(result).toEqual({});
    });
  });

  describe('calculateDailyTotals', () => {
    it('should calculate income and expense totals per date', () => {
      const groupedTransactions = {
        Oggi: [
          createMockTransaction({ id: 'tx-1', type: 'income', amount: 1000 }),
          createMockTransaction({ id: 'tx-2', type: 'expense', amount: 200 }),
          createMockTransaction({ id: 'tx-3', type: 'expense', amount: 100 }),
        ],
        '15/1/2024': [createMockTransaction({ id: 'tx-4', type: 'expense', amount: 500 })],
      };

      const result = TransactionLogic.calculateDailyTotals(groupedTransactions);

      expect(result['Oggi']).toEqual({ income: 1000, expense: 300 });
      expect(result['15/1/2024']).toEqual({ income: 0, expense: 500 });
    });

    it('should ignore transfer transactions in totals', () => {
      const groupedTransactions = {
        Oggi: [
          createMockTransaction({ id: 'tx-1', type: 'income', amount: 1000 }),
          createMockTransaction({ id: 'tx-2', type: 'transfer', amount: 500 }),
        ],
      };

      const result = TransactionLogic.calculateDailyTotals(groupedTransactions);

      expect(result['Oggi']).toEqual({ income: 1000, expense: 0 });
    });

    it('should return empty object for empty grouped transactions', () => {
      const result = TransactionLogic.calculateDailyTotals({});

      expect(result).toEqual({});
    });

    it('should handle groups with only transfers (zero totals)', () => {
      const groupedTransactions = {
        Oggi: [
          createMockTransaction({ id: 'tx-1', type: 'transfer', amount: 500 }),
          createMockTransaction({ id: 'tx-2', type: 'transfer', amount: 300 }),
        ],
      };

      const result = TransactionLogic.calculateDailyTotals(groupedTransactions);

      expect(result['Oggi']).toEqual({ income: 0, expense: 0 });
    });
  });
});
