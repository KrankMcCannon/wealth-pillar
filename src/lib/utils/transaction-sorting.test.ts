import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  insertTransactionSorted,
  updateTransactionSorted,
  removeTransaction,
} from './transaction-sorting';
import type { Transaction } from '@/lib/types';

// Mock date-utils to control toDateTime behavior
vi.mock('@/lib/utils/date-utils', () => ({
  toDateTime: vi.fn((date: string | Date | null) => {
    if (!date) return null;
    if (date === 'invalid') return null;
    const d = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) return null;
    // Return a mock DateTime-like object with comparison operators
    return {
      toMillis: () => d.getTime(),
      valueOf: () => d.getTime(),
      // For comparison operators to work
      [Symbol.toPrimitive]: () => d.getTime(),
    };
  }),
}));

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

describe('transaction-sorting', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('insertTransactionSorted', () => {
    it('should insert into empty array', () => {
      const newTx = createMockTransaction({ id: 'tx-new', date: '2024-01-15' });

      const result = insertTransactionSorted([], newTx);

      expect(result).toHaveLength(1);
      expect(result[0]).toBe(newTx);
    });

    it('should insert at beginning for newest transaction (descending order)', () => {
      const existing = [
        createMockTransaction({ id: 'tx-2', date: '2024-01-10' }),
        createMockTransaction({ id: 'tx-3', date: '2024-01-05' }),
      ];
      const newest = createMockTransaction({ id: 'tx-new', date: '2024-01-20' });

      const result = insertTransactionSorted(existing, newest);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('tx-new');
      expect(result[1].id).toBe('tx-2');
      expect(result[2].id).toBe('tx-3');
    });

    it('should insert at end for oldest transaction', () => {
      const existing = [
        createMockTransaction({ id: 'tx-1', date: '2024-01-20' }),
        createMockTransaction({ id: 'tx-2', date: '2024-01-15' }),
      ];
      const oldest = createMockTransaction({ id: 'tx-new', date: '2024-01-01' });

      const result = insertTransactionSorted(existing, oldest);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('tx-1');
      expect(result[1].id).toBe('tx-2');
      expect(result[2].id).toBe('tx-new');
    });

    it('should insert in middle when date falls between existing transactions', () => {
      const existing = [
        createMockTransaction({ id: 'tx-1', date: '2024-01-20' }),
        createMockTransaction({ id: 'tx-2', date: '2024-01-10' }),
        createMockTransaction({ id: 'tx-3', date: '2024-01-01' }),
      ];
      const middle = createMockTransaction({ id: 'tx-new', date: '2024-01-15' });

      const result = insertTransactionSorted(existing, middle);

      expect(result).toHaveLength(4);
      expect(result[0].id).toBe('tx-1');
      expect(result[1].id).toBe('tx-new');
      expect(result[2].id).toBe('tx-2');
      expect(result[3].id).toBe('tx-3');
    });

    it('should append to end when new transaction has invalid date', () => {
      const existing = [createMockTransaction({ id: 'tx-1', date: '2024-01-15' })];
      const invalidDate = createMockTransaction({ id: 'tx-new', date: 'invalid' });

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      const result = insertTransactionSorted(existing, invalidDate);

      expect(result).toHaveLength(2);
      expect(result[1].id).toBe('tx-new');
      expect(consoleSpy).toHaveBeenCalledWith(
        'Invalid date for transaction, appending to end:',
        invalidDate
      );
      consoleSpy.mockRestore();
    });

    it('should handle corrupted data in middle of array during binary search', () => {
      // Create array where middle element has invalid date
      const existing = [
        createMockTransaction({ id: 'tx-1', date: '2024-01-20' }),
        createMockTransaction({ id: 'tx-2', date: 'invalid' }), // Corrupted middle
        createMockTransaction({ id: 'tx-3', date: '2024-01-10' }),
      ];
      const newTx = createMockTransaction({ id: 'tx-new', date: '2024-01-15' });

      const result = insertTransactionSorted(existing, newTx);

      // Should still insert (corrupted data treated as oldest)
      expect(result).toHaveLength(4);
    });

    it('should not mutate original array', () => {
      const existing = [createMockTransaction({ id: 'tx-1', date: '2024-01-15' })];
      const original = [...existing];
      const newTx = createMockTransaction({ id: 'tx-new', date: '2024-01-20' });

      insertTransactionSorted(existing, newTx);

      expect(existing).toEqual(original);
    });
  });

  describe('updateTransactionSorted', () => {
    it('should update transaction and maintain sort order when date unchanged', () => {
      const existing = [
        createMockTransaction({ id: 'tx-1', date: '2024-01-20' }),
        createMockTransaction({ id: 'tx-2', date: '2024-01-15', description: 'Old' }),
        createMockTransaction({ id: 'tx-3', date: '2024-01-10' }),
      ];
      const updated = createMockTransaction({
        id: 'tx-2',
        date: '2024-01-15',
        description: 'Updated',
      });

      const result = updateTransactionSorted(existing, updated);

      expect(result).toHaveLength(3);
      expect(result[1].id).toBe('tx-2');
      expect(result[1].description).toBe('Updated');
    });

    it('should re-sort when updated transaction date changes to newer', () => {
      const existing = [
        createMockTransaction({ id: 'tx-1', date: '2024-01-20' }),
        createMockTransaction({ id: 'tx-2', date: '2024-01-15' }),
        createMockTransaction({ id: 'tx-3', date: '2024-01-10' }),
      ];
      const updated = createMockTransaction({ id: 'tx-3', date: '2024-01-25' });

      const result = updateTransactionSorted(existing, updated);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('tx-3'); // Now first because newest
      expect(result[1].id).toBe('tx-1');
      expect(result[2].id).toBe('tx-2');
    });

    it('should re-sort when updated transaction date changes to older', () => {
      const existing = [
        createMockTransaction({ id: 'tx-1', date: '2024-01-20' }),
        createMockTransaction({ id: 'tx-2', date: '2024-01-15' }),
        createMockTransaction({ id: 'tx-3', date: '2024-01-10' }),
      ];
      const updated = createMockTransaction({ id: 'tx-1', date: '2024-01-01' });

      const result = updateTransactionSorted(existing, updated);

      expect(result).toHaveLength(3);
      expect(result[0].id).toBe('tx-2');
      expect(result[1].id).toBe('tx-3');
      expect(result[2].id).toBe('tx-1'); // Now last because oldest
    });

    it('should handle updating non-existent transaction (insert behavior)', () => {
      const existing = [createMockTransaction({ id: 'tx-1', date: '2024-01-20' })];
      const newTx = createMockTransaction({ id: 'tx-new', date: '2024-01-25' });

      const result = updateTransactionSorted(existing, newTx);

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('tx-new');
    });
  });

  describe('removeTransaction', () => {
    it('should remove transaction by id', () => {
      const existing = [
        createMockTransaction({ id: 'tx-1' }),
        createMockTransaction({ id: 'tx-2' }),
        createMockTransaction({ id: 'tx-3' }),
      ];

      const result = removeTransaction(existing, 'tx-2');

      expect(result).toHaveLength(2);
      expect(result.map((t) => t.id)).toEqual(['tx-1', 'tx-3']);
    });

    it('should return same array contents when id not found', () => {
      const existing = [
        createMockTransaction({ id: 'tx-1' }),
        createMockTransaction({ id: 'tx-2' }),
      ];

      const result = removeTransaction(existing, 'tx-nonexistent');

      expect(result).toHaveLength(2);
    });

    it('should return empty array when removing from single-item array', () => {
      const existing = [createMockTransaction({ id: 'tx-1' })];

      const result = removeTransaction(existing, 'tx-1');

      expect(result).toHaveLength(0);
    });

    it('should return empty array when removing from empty array', () => {
      const result = removeTransaction([], 'tx-1');

      expect(result).toHaveLength(0);
    });

    it('should not mutate original array', () => {
      const existing = [
        createMockTransaction({ id: 'tx-1' }),
        createMockTransaction({ id: 'tx-2' }),
      ];
      const original = [...existing];

      removeTransaction(existing, 'tx-1');

      expect(existing).toEqual(original);
    });
  });
});
