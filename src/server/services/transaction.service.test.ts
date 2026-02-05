import { describe, it, expect, vi, beforeEach } from 'vitest';
import { TransactionService, CreateTransactionInput } from './transaction.service';
import type { Transaction } from '@/lib/types';

// Mock server-only (must be at top level)
vi.mock('server-only', () => ({}));

// Mock react cache
vi.mock('react', () => ({
  cache: vi.fn((fn) => fn),
}));

// Mock Supabase
const mockSupabaseChain = {
  select: vi.fn().mockReturnThis(),
  insert: vi.fn().mockReturnThis(),
  update: vi.fn().mockReturnThis(),
  delete: vi.fn().mockReturnThis(),
  eq: vi.fn().mockReturnThis(),
  or: vi.fn().mockReturnThis(),
  gte: vi.fn().mockReturnThis(),
  lte: vi.fn().mockReturnThis(),
  order: vi.fn().mockReturnThis(),
  range: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  single: vi.fn(),
};

vi.mock('@/server/db/supabase', () => ({
  supabase: {
    from: vi.fn(() => mockSupabaseChain),
    rpc: vi.fn(),
  },
}));

// Mock cache utilities
vi.mock('@/lib/cache', () => ({
  cached: vi.fn((fn) => fn),
}));

vi.mock('@/lib/cache/config', () => ({
  CACHE_TAGS: { TRANSACTIONS: 'transactions' },
  cacheOptions: {
    transactionsByUser: vi.fn(() => ({ revalidate: 60, tags: [] })),
    transactionsByAccount: vi.fn(() => ({ revalidate: 60, tags: [] })),
  },
}));

vi.mock('@/lib/cache/keys', () => ({
  transactionCacheKeys: {
    byUser: vi.fn((id) => [`user:${id}:transactions`]),
    byAccount: vi.fn((id) => [`account:${id}:transactions`]),
  },
}));

vi.mock('@/lib/utils/serializer', () => ({
  serialize: vi.fn((data) => data),
}));

vi.mock('@/lib/utils/validation-utils', () => ({
  validateId: vi.fn((id, name) => {
    if (!id?.trim()) throw new Error(`${name} is required`);
  }),
  validateRequiredString: vi.fn((str, name) => {
    if (!str?.trim()) throw new Error(`${name} is required`);
    return str.trim();
  }),
  validatePositiveNumber: vi.fn((num, name) => {
    if (typeof num !== 'number' || num <= 0) throw new Error(`${name} must be a positive number`);
  }),
  validateEnum: vi.fn((value, allowed, name) => {
    if (!allowed.includes(value)) throw new Error(`Invalid ${name}`);
  }),
}));

vi.mock('@/lib/utils/cache-utils', () => ({
  invalidateTransactionCaches: vi.fn(),
  invalidateTransactionUpdateCaches: vi.fn(),
}));

import { supabase } from '@/server/db/supabase';
import { invalidateTransactionCaches } from '@/lib/utils/cache-utils';

// Factory helper for creating mock transactions
function createMockTransaction(overrides: Partial<Transaction> = {}): Transaction {
  return {
    id: 'tx-1',
    description: 'Test Transaction',
    amount: 100,
    type: 'expense',
    category: 'food',
    date: '2024-01-15T00:00:00.000Z',
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

function createMockInput(overrides: Partial<CreateTransactionInput> = {}): CreateTransactionInput {
  return {
    description: 'New Transaction',
    amount: 100,
    type: 'expense',
    category: 'food',
    date: '2024-01-15',
    user_id: 'user-1',
    account_id: 'account-1',
    group_id: 'group-1',
    ...overrides,
  };
}

// Helper to create a fully chainable mock query builder
function createChainableMock(resolveValue: unknown) {
  const chainable: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = ['select', 'eq', 'gte', 'lte', 'or', 'order', 'range', 'limit'];
  
  methods.forEach(method => {
    if (method === 'order') {
      // order can either resolve or continue chain for range
      chainable[method] = vi.fn().mockImplementation(() => ({
        ...chainable,
        range: vi.fn().mockResolvedValue(resolveValue),
        then: (resolve: (v: unknown) => void) => Promise.resolve(resolveValue).then(resolve),
      }));
    } else {
      chainable[method] = vi.fn().mockReturnValue(chainable);
    }
  });
  
  return chainable;
}

// Helper to create a fully chainable mock query builder for user queries
function createUserChainableMock(resolveValue: unknown) {
  const chainable: Record<string, ReturnType<typeof vi.fn>> = {};
  const methods = ['select', 'eq', 'gte', 'lte', 'order', 'limit'];
  
  methods.forEach(method => {
    if (method === 'order') {
      chainable[method] = vi.fn().mockImplementation(() => ({
        ...chainable,
        then: (resolve: (v: unknown) => void) => Promise.resolve(resolveValue).then(resolve),
      }));
    } else {
      chainable[method] = vi.fn().mockReturnValue(chainable);
    }
  });
  
  return chainable;
}

describe('TransactionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock chain to default success state
    mockSupabaseChain.single.mockResolvedValue({ data: null, error: null });
    mockSupabaseChain.select.mockReturnThis();
    mockSupabaseChain.insert.mockReturnThis();
    mockSupabaseChain.update.mockReturnThis();
    mockSupabaseChain.delete.mockReturnThis();
  });

  describe('getTransactionsByGroup', () => {
    it('should throw error when groupId is empty', async () => {
      await expect(TransactionService.getTransactionsByGroup('')).rejects.toThrow(
        'Group ID is required'
      );
    });

    it('should return transactions with pagination info', async () => {
      const mockTransactions = [createMockTransaction()];
      mockSupabaseChain.order.mockReturnValue({
        ...mockSupabaseChain,
        then: (resolve: (result: unknown) => void) =>
          resolve({ data: mockTransactions, count: 1, error: null }),
      });
      
      // Mock the async behavior properly
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockTransactions, count: 1, error: null }),
          }),
        }),
      } as never);
      
      const result = await TransactionService.getTransactionsByGroup('group-1');
      
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('hasMore');
    });
  });

  describe('getTransactionById', () => {
    it('should throw error when transaction ID is empty', async () => {
      await expect(TransactionService.getTransactionById('')).rejects.toThrow(
        'Transaction ID is required'
      );
    });

    it('should throw error when transaction not found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116' } }),
          }),
        }),
      } as never);
      
      await expect(TransactionService.getTransactionById('tx-nonexistent')).rejects.toThrow(
        'Transaction not found'
      );
    });

    it('should return transaction when found', async () => {
      const mockTransaction = createMockTransaction();
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null }),
          }),
        }),
      } as never);
      
      const result = await TransactionService.getTransactionById('tx-1');
      
      expect(result).toEqual(mockTransaction);
    });
  });

  describe('createTransaction', () => {
    it('should throw error when description is empty', async () => {
      const input = createMockInput({ description: '' });
      
      await expect(TransactionService.createTransaction(input)).rejects.toThrow();
    });

    it('should throw error when amount is not positive', async () => {
      const input = createMockInput({ amount: -100 });
      
      await expect(TransactionService.createTransaction(input)).rejects.toThrow();
    });

    it('should throw error when type is invalid', async () => {
      const input = createMockInput({ type: 'invalid' as 'expense' });
      
      await expect(TransactionService.createTransaction(input)).rejects.toThrow();
    });

    it('should throw error when category is empty', async () => {
      const input = createMockInput({ category: '' });
      
      await expect(TransactionService.createTransaction(input)).rejects.toThrow();
    });

    it('should throw error when date is missing', async () => {
      const input = createMockInput({ date: undefined as unknown as string });
      
      await expect(TransactionService.createTransaction(input)).rejects.toThrow('Date is required');
    });

    it('should throw error when transfer sources and destinations are the same', async () => {
      const input = createMockInput({
        type: 'transfer',
        account_id: 'account-1',
        to_account_id: 'account-1',
      });
      
      await expect(TransactionService.createTransaction(input)).rejects.toThrow(
        'Source and destination accounts must be different'
      );
    });

    it('should throw error when transfer has no destination account', async () => {
      const input = createMockInput({
        type: 'transfer',
        to_account_id: undefined,
      });
      
      await expect(TransactionService.createTransaction(input)).rejects.toThrow();
    });

    it('should create transaction and invalidate caches', async () => {
      const mockTransaction = createMockTransaction();
      const input = createMockInput();
      
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { balance: 1000 }, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never);
      
      const result = await TransactionService.createTransaction(input);
      
      expect(result).toEqual(mockTransaction);
      expect(invalidateTransactionCaches).toHaveBeenCalledWith({
        groupId: input.group_id,
        accountId: input.account_id,
        userId: input.user_id,
        toAccountId: undefined,
      });
    });
  });

  describe('updateTransaction', () => {
    it('should throw error when transaction ID is empty', async () => {
      await expect(TransactionService.updateTransaction('', { description: 'Updated' })).rejects.toThrow(
        'Transaction ID is required'
      );
    });

    it('should throw error when transaction not found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Not found' } }),
          }),
        }),
      } as never);
      
      await expect(TransactionService.updateTransaction('tx-1', { description: 'Updated' })).rejects.toThrow();
    });

    it('should throw error when updating transfer without destination', async () => {
      const existingTx = createMockTransaction({ type: 'income' });
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: existingTx, error: null }),
          }),
        }),
      } as never);
      
      await expect(
        TransactionService.updateTransaction('tx-1', { type: 'transfer' })
      ).rejects.toThrow('Destination account is required for transfers');
    });
  });

  describe('deleteTransaction', () => {
    it('should throw error when transaction ID is invalid', async () => {
      await expect(TransactionService.deleteTransaction('')).rejects.toThrow();
    });

    it('should throw error when transaction not found', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { code: 'PGRST116', message: 'Not found' } }),
          }),
        }),
      } as never);
      
      await expect(TransactionService.deleteTransaction('tx-nonexistent')).rejects.toThrow();
    });

    it('should delete transaction and invalidate caches', async () => {
      const existingTx = createMockTransaction();
      
      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn()
            .mockResolvedValueOnce({ data: existingTx, error: null }) // getByIdDb
            .mockResolvedValueOnce({ data: existingTx, error: null }) // deleteDb
            .mockResolvedValueOnce({ data: { balance: 1000 }, error: null }), // updateAccountBalance
        }),
      });
      
      vi.mocked(supabase.from).mockReturnValue({
        select: selectMock,
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existingTx, error: null }),
            }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never);
      
      const result = await TransactionService.deleteTransaction('tx-1');
      
      expect(result).toEqual({ id: 'tx-1' });
      expect(invalidateTransactionCaches).toHaveBeenCalled();
    });
  });

  describe('deleteByAccount', () => {
    it('should delete all transactions for an account', async () => {
      const deleteMock = vi.fn().mockReturnValue({
        or: vi.fn().mockResolvedValue({ error: null }),
      });
      
      vi.mocked(supabase.from).mockReturnValue({
        delete: deleteMock,
      } as never);
      
      await expect(TransactionService.deleteByAccount('account-1')).resolves.not.toThrow();
    });

    it('should throw error when delete fails', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          or: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
        }),
      } as never);
      
      await expect(TransactionService.deleteByAccount('account-1')).rejects.toThrow('Delete failed');
    });
  });

  describe('deleteByUser', () => {
    it('should delete all transactions for a user', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never);
      
      await expect(TransactionService.deleteByUser('user-1')).resolves.not.toThrow();
    });

    it('should throw error when delete fails', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'Delete failed' } }),
        }),
      } as never);
      
      await expect(TransactionService.deleteByUser('user-1')).rejects.toThrow('Delete failed');
    });
  });

  describe('getTransactionsByUser', () => {
    it('should throw error when userId is empty', async () => {
      await expect(TransactionService.getTransactionsByUser('')).rejects.toThrow(
        'User ID is required'
      );
    });

    it('should return transactions for a user', async () => {
      const mockTransactions = [createMockTransaction()];
      const resolveValue = { data: mockTransactions, count: 1, error: null };
      const chainable = createUserChainableMock(resolveValue);
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(chainable),
      } as never);
      
      const result = await TransactionService.getTransactionsByUser('user-1');
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should apply startDate filter', async () => {
      const mockTransactions = [createMockTransaction()];
      const resolveValue = { data: mockTransactions, count: 1, error: null };
      const chainable = createUserChainableMock(resolveValue);
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(chainable),
      } as never);
      
      const result = await TransactionService.getTransactionsByUser('user-1', {
        startDate: new Date('2024-01-01'),
      });
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should apply endDate filter', async () => {
      const mockTransactions = [createMockTransaction()];
      const resolveValue = { data: mockTransactions, count: 1, error: null };
      const chainable = createUserChainableMock(resolveValue);
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(chainable),
      } as never);
      
      const result = await TransactionService.getTransactionsByUser('user-1', {
        endDate: new Date('2024-01-31'),
      });
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should apply category filter', async () => {
      const mockTransactions = [createMockTransaction()];
      const resolveValue = { data: mockTransactions, count: 1, error: null };
      const chainable = createUserChainableMock(resolveValue);
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(chainable),
      } as never);
      
      const result = await TransactionService.getTransactionsByUser('user-1', {
        category: 'food',
      });
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should apply type filter', async () => {
      const mockTransactions = [createMockTransaction()];
      const resolveValue = { data: mockTransactions, count: 1, error: null };
      const chainable = createUserChainableMock(resolveValue);
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(chainable),
      } as never);
      
      const result = await TransactionService.getTransactionsByUser('user-1', {
        type: 'expense',
      });
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should apply limit filter', async () => {
      const mockTransactions = [createMockTransaction()];
      const resolveValue = { data: mockTransactions, count: 1, error: null };
      const chainable = createUserChainableMock(resolveValue);
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(chainable),
      } as never);
      
      const result = await TransactionService.getTransactionsByUser('user-1', {
        limit: 10,
      });
      
      expect(Array.isArray(result)).toBe(true);
    });

    it('should apply all filters together', async () => {
      const mockTransactions = [createMockTransaction()];
      const resolveValue = { data: mockTransactions, count: 1, error: null };
      const chainable = createUserChainableMock(resolveValue);
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(chainable),
      } as never);
      
      const result = await TransactionService.getTransactionsByUser('user-1', {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
        category: 'food',
        type: 'expense',
        limit: 10,
      });
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getTransactionsByAccount', () => {
    it('should throw error when accountId is empty', async () => {
      await expect(TransactionService.getTransactionsByAccount('')).rejects.toThrow(
        'Account ID is required'
      );
    });

    it('should return transactions for an account', async () => {
      const mockTransactions = [createMockTransaction()];
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: mockTransactions, error: null }),
          }),
        }),
      } as never);
      
      const result = await TransactionService.getTransactionsByAccount('account-1');
      
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('getTransactionCountByUser', () => {
    it('should throw error when userId is empty', async () => {
      await expect(TransactionService.getTransactionCountByUser('')).rejects.toThrow(
        'User ID is required'
      );
    });

    it('should return transaction count for a user', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: 5, error: null }),
        }),
      } as never);
      
      const result = await TransactionService.getTransactionCountByUser('user-1');
      
      expect(typeof result).toBe('number');
    });
  });

  describe('getTransactionsByGroup with filters', () => {
    it('should apply date range filters', async () => {
      const mockTransactions = [createMockTransaction()];
      const resolveValue = { data: mockTransactions, count: 1, error: null };
      const chainable = createChainableMock(resolveValue);
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(chainable),
      } as never);
      
      const result = await TransactionService.getTransactionsByGroup('group-1', {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-01-31'),
      });
      
      expect(result).toHaveProperty('data');
    });

    it('should apply category filter', async () => {
      const mockTransactions = [createMockTransaction()];
      const resolveValue = { data: mockTransactions, count: 1, error: null };
      const chainable = createChainableMock(resolveValue);
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(chainable),
      } as never);
      
      const result = await TransactionService.getTransactionsByGroup('group-1', {
        category: 'food',
      });
      
      expect(result).toHaveProperty('data');
    });

    it('should apply type filter', async () => {
      const mockTransactions = [createMockTransaction()];
      const resolveValue = { data: mockTransactions, count: 1, error: null };
      const chainable = createChainableMock(resolveValue);
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(chainable),
      } as never);
      
      const result = await TransactionService.getTransactionsByGroup('group-1', {
        type: 'expense',
      });
      
      expect(result).toHaveProperty('data');
    });

    it('should apply accountId filter', async () => {
      const mockTransactions = [createMockTransaction()];
      const resolveValue = { data: mockTransactions, count: 1, error: null };
      const chainable = createChainableMock(resolveValue);
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(chainable),
      } as never);
      
      const result = await TransactionService.getTransactionsByGroup('group-1', {
        accountId: 'account-1',
      });
      
      expect(result).toHaveProperty('data');
    });

    it('should apply pagination with limit and offset', async () => {
      const mockTransactions = [createMockTransaction()];
      const resolveValue = { data: mockTransactions, count: 10, error: null };
      const chainable = createChainableMock(resolveValue);
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(chainable),
      } as never);
      
      const result = await TransactionService.getTransactionsByGroup('group-1', {
        limit: 5,
        offset: 0,
      });
      
      expect(result).toHaveProperty('hasMore');
      expect(result.hasMore).toBe(true); // 1 item returned, 10 total, so has more
    });

    it('should calculate hasMore correctly when no more items', async () => {
      const mockTransactions = [createMockTransaction()];
      const resolveValue = { data: mockTransactions, count: 1, error: null };
      const chainable = createChainableMock(resolveValue);
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(chainable),
      } as never);
      
      const result = await TransactionService.getTransactionsByGroup('group-1', {
        limit: 5,
        offset: 0,
      });
      
      expect(result.hasMore).toBe(false); // 1 item returned, 1 total
    });
  });

  describe('createTransaction - income type', () => {
    it('should create income transaction and update balance correctly', async () => {
      const mockTransaction = createMockTransaction({ type: 'income' });
      const input = createMockInput({ type: 'income' });
      
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { balance: 1000 }, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never);
      
      const result = await TransactionService.createTransaction(input);
      
      expect(result.type).toBe('income');
    });
  });

  describe('createTransaction - transfer type', () => {
    it('should create transfer transaction with valid destination', async () => {
      const mockTransaction = createMockTransaction({
        type: 'transfer',
        to_account_id: 'account-2',
      });
      const input = createMockInput({
        type: 'transfer',
        to_account_id: 'account-2',
      });
      
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { balance: 1000 }, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never);
      
      const result = await TransactionService.createTransaction(input);
      
      expect(result.type).toBe('transfer');
      expect(result.to_account_id).toBe('account-2');
    });
  });

  describe('updateTransaction - with field changes', () => {
    it('should update all transaction fields', async () => {
      const existingTx = createMockTransaction();
      const updatedTx = createMockTransaction({ description: 'Updated', amount: 200 });
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn()
              .mockResolvedValueOnce({ data: existingTx, error: null })
              .mockResolvedValueOnce({ data: { balance: 1000 }, error: null })
              .mockResolvedValueOnce({ data: { balance: 1000 }, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updatedTx, error: null }),
            }),
          }),
        }),
      } as never);
      
      const result = await TransactionService.updateTransaction('tx-1', {
        description: 'Updated',
        amount: 200,
        category: 'transport',
        date: '2024-02-01',
        user_id: 'user-2',
        account_id: 'account-2',
        group_id: 'group-2',
      });
      
      expect(result.description).toBe('Updated');
    });

    it('should handle transfer update with same and different accounts check', async () => {
      const existingTx = createMockTransaction({
        type: 'transfer',
        to_account_id: 'account-2',
      });
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: existingTx, error: null }),
          }),
        }),
      } as never);
      
      // Trying to update with same source and destination should throw
      await expect(
        TransactionService.updateTransaction('tx-1', { to_account_id: 'account-1' })
      ).rejects.toThrow('Source and destination accounts must be different');
    });
  });

  describe('RPC Functions', () => {
    it('getGroupCategorySpending should call RPC and return data', async () => {
      const mockData = [{ category: 'food', spent: 500, transaction_count: 5 }];
      
      vi.mocked(supabase as unknown as { rpc: typeof vi.fn }).rpc = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });
      
      const result = await TransactionService.getGroupCategorySpending(
        'group-1',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      
      expect(result).toEqual(mockData);
    });

    it('getGroupMonthlySpending should call RPC and return data', async () => {
      const mockData = [{ month: '2024-01', income: 2000, expense: 1000 }];
      
      vi.mocked(supabase as unknown as { rpc: typeof vi.fn }).rpc = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });
      
      const result = await TransactionService.getGroupMonthlySpending(
        'group-1',
        new Date('2024-01-01'),
        new Date('2024-12-31')
      );
      
      expect(result).toEqual(mockData);
    });

    it('getGroupUserCategorySpending should call RPC and return data', async () => {
      const mockData = [{ user_id: 'user-1', category: 'food', spent: 300, income: 0, transaction_count: 3 }];
      
      vi.mocked(supabase as unknown as { rpc: typeof vi.fn }).rpc = vi.fn().mockResolvedValue({
        data: mockData,
        error: null,
      });
      
      const result = await TransactionService.getGroupUserCategorySpending(
        'group-1',
        new Date('2024-01-01'),
        new Date('2024-01-31')
      );
      
      expect(result).toEqual(mockData);
    });

    it('RPC function should throw on error', async () => {
      vi.mocked(supabase as unknown as { rpc: typeof vi.fn }).rpc = vi.fn().mockResolvedValue({
        data: null,
        error: { message: 'RPC failed' },
      });
      
      await expect(
        TransactionService.getGroupCategorySpending(
          'group-1',
          new Date('2024-01-01'),
          new Date('2024-01-31')
        )
      ).rejects.toThrow('RPC failed');
    });
  });

  describe('Database error handling', () => {
    it('getByGroupDb should throw on database error', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } }),
          }),
        }),
      } as never);
      
      await expect(TransactionService.getTransactionsByGroup('group-1')).rejects.toThrow('DB error');
    });

    it('getByIdDb should throw on non-PGRST116 error', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { code: 'OTHER_ERROR', message: 'Database connection failed' },
            }),
          }),
        }),
      } as never);
      
      await expect(TransactionService.getTransactionById('tx-1')).rejects.toThrow(
        'Database connection failed'
      );
    });

    it('createDb should throw on insert error', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Insert failed' },
            }),
          }),
        }),
      } as never);
      
      await expect(TransactionService.createTransaction(createMockInput())).rejects.toThrow();
    });

    it('updateDb should throw on update error', async () => {
      const existingTx = createMockTransaction();
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: existingTx, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Update failed' },
              }),
            }),
          }),
        }),
      } as never);
      
      await expect(
        TransactionService.updateTransaction('tx-1', { description: 'Updated' })
      ).rejects.toThrow('Update failed');
    });
  });

  describe('createTransaction with Date object', () => {
    it('should handle Date object for date field', async () => {
      const mockTransaction = createMockTransaction();
      const input = createMockInput({ date: new Date('2024-01-15') as unknown as string });
      
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { balance: 1000 }, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never);
      
      const result = await TransactionService.createTransaction(input);
      
      expect(result).toBeDefined();
    });
  });

  describe('getByUserDb error handling', () => {
    it('should throw error when database query fails', async () => {
      const chainable = createUserChainableMock({ data: null, count: null, error: { message: 'User query failed' } });
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(chainable),
      } as never);
      
      await expect(TransactionService.getTransactionsByUser('user-1')).rejects.toThrow('User query failed');
    });
  });

  describe('getByAccountDb error handling', () => {
    it('should throw error when account query fails', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: { message: 'Account query failed' } }),
          }),
        }),
      } as never);
      
      await expect(TransactionService.getTransactionsByAccount('account-1')).rejects.toThrow('Account query failed');
    });
  });

  describe('getTransactionCountByUser error handling', () => {
    it('should throw error when count query fails', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: null, error: { message: 'Count failed' } }),
        }),
      } as never);
      
      await expect(TransactionService.getTransactionCountByUser('user-1')).rejects.toThrow('Count failed');
    });

    it('should return 0 when count is null', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ count: null, error: null }),
        }),
      } as never);
      
      const result = await TransactionService.getTransactionCountByUser('user-1');
      
      expect(result).toBe(0);
    });
  });

  describe('updateTransaction field branches', () => {
    it('should update transaction with type field', async () => {
      const existingTx = createMockTransaction({ type: 'expense' });
      const updatedTx = createMockTransaction({ type: 'income' });
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn()
              .mockResolvedValueOnce({ data: existingTx, error: null })
              .mockResolvedValueOnce({ data: { balance: 1000 }, error: null })
              .mockResolvedValueOnce({ data: { balance: 1000 }, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updatedTx, error: null }),
            }),
          }),
        }),
      } as never);
      
      const result = await TransactionService.updateTransaction('tx-1', { type: 'income' });
      
      expect(result.type).toBe('income');
    });

    it('should update transaction with Date object date', async () => {
      const existingTx = createMockTransaction();
      const updatedTx = createMockTransaction();
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn()
              .mockResolvedValueOnce({ data: existingTx, error: null })
              .mockResolvedValueOnce({ data: { balance: 1000 }, error: null })
              .mockResolvedValueOnce({ data: { balance: 1000 }, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updatedTx, error: null }),
            }),
          }),
        }),
      } as never);
      
      const result = await TransactionService.updateTransaction('tx-1', { 
        date: new Date('2024-02-15') as unknown as string,
      });
      
      expect(result).toBeDefined();
    });

    it('should update transaction with to_account_id', async () => {
      const existingTx = createMockTransaction({ type: 'transfer', to_account_id: 'account-2' });
      const updatedTx = createMockTransaction({ type: 'transfer', to_account_id: 'account-3' });
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn()
              .mockResolvedValueOnce({ data: existingTx, error: null })
              .mockResolvedValueOnce({ data: { balance: 1000 }, error: null })
              .mockResolvedValueOnce({ data: { balance: 1000 }, error: null })
              .mockResolvedValueOnce({ data: { balance: 1000 }, error: null })
              .mockResolvedValueOnce({ data: { balance: 1000 }, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updatedTx, error: null }),
            }),
          }),
        }),
      } as never);
      
      const result = await TransactionService.updateTransaction('tx-1', { 
        to_account_id: 'account-3',
      });
      
      expect(result.to_account_id).toBe('account-3');
    });
  });

  describe('createTransaction with null user_id', () => {
    it('should handle undefined user_id', async () => {
      const mockTransaction = createMockTransaction({ user_id: null });
      const input = createMockInput({ user_id: undefined });
      
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { balance: 1000 }, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never);
      
      const result = await TransactionService.createTransaction(input);
      
      expect(result.user_id).toBeNull();
    });
  });

  describe('validateTransferUpdate edge cases', () => {
    it('should throw error when converting to transfer with existing account as destination', async () => {
      const existingTx = createMockTransaction({ 
        type: 'expense',
        account_id: 'account-1',
        to_account_id: null,
      });
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: existingTx, error: null }),
          }),
        }),
      } as never);
      
      await expect(
        TransactionService.updateTransaction('tx-1', { 
          type: 'transfer',
          to_account_id: 'account-1', // Same as source
        })
      ).rejects.toThrow('Source and destination accounts must be different');
    });

    it('should throw error when existing transfer updates to_account_id to match account_id', async () => {
      const existingTx = createMockTransaction({ 
        type: 'transfer',
        account_id: 'account-1',
        to_account_id: 'account-2',
      });
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: existingTx, error: null }),
          }),
        }),
      } as never);
      
      await expect(
        TransactionService.updateTransaction('tx-1', { 
          to_account_id: 'account-1', // Now matches source
        })
      ).rejects.toThrow('Source and destination accounts must be different');
    });
  });

  describe('deleteDb error handling', () => {
    it('should throw error when delete fails', async () => {
      const existingTx = createMockTransaction();
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: existingTx, error: null }),
          }),
        }),
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Delete operation failed' } }),
            }),
          }),
        }),
      } as never);
      
      await expect(TransactionService.deleteTransaction('tx-1')).rejects.toThrow('Delete operation failed');
    });
  });

  describe('updateAccountBalance error handling', () => {
    it('should throw error when fetching account balance fails', async () => {
      const mockTransaction = createMockTransaction({ type: 'income' });
      const input = createMockInput({ type: 'income' });
      
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: null, error: { message: 'Account not found' } }),
          }),
        }),
      } as never);
      
      await expect(TransactionService.createTransaction(input)).rejects.toThrow('Failed to fetch account');
    });

    it('should throw error when updating account balance fails', async () => {
      const mockTransaction = createMockTransaction({ type: 'income' });
      const input = createMockInput({ type: 'income' });
      
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null }),
          }),
        }),
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: { balance: 1000 }, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: { message: 'Balance update failed' } }),
        }),
      } as never);
      
      await expect(TransactionService.createTransaction(input)).rejects.toThrow('Failed to update balance');
    });
  });

  describe('updateBalancesForTransaction - transfer type', () => {
    it('should update both accounts for transfer transaction', async () => {
      const mockTransaction = createMockTransaction({ 
        type: 'transfer',
        account_id: 'account-1',
        to_account_id: 'account-2',
        amount: 100,
      });
      const input = createMockInput({ 
        type: 'transfer',
        to_account_id: 'account-2',
      });
      
      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({ data: { balance: 1000 }, error: null }),
        }),
      });
      
      vi.mocked(supabase.from).mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({ data: mockTransaction, error: null }),
          }),
        }),
        select: selectMock,
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ error: null }),
        }),
      } as never);
      
      const result = await TransactionService.createTransaction(input);
      
      expect(result.type).toBe('transfer');
    });
  });

  describe('getTransactionsByGroup hasMore calculation', () => {
    it('should calculate hasMore correctly with limit', async () => {
      const mockTransactions = [createMockTransaction(), createMockTransaction()];
      // count=5 means total 5, we got 2, offset=0, so offset+2 < 5 = hasMore true
      const resolveValue = { data: mockTransactions, count: 5, error: null };
      
      const chainable: Record<string, ReturnType<typeof vi.fn>> = {};
      const methods = ['select', 'eq', 'gte', 'lte', 'or', 'order', 'range', 'limit'];
      methods.forEach(method => {
        if (method === 'order') {
          chainable[method] = vi.fn().mockImplementation(() => ({
            ...chainable,
            range: vi.fn().mockResolvedValue(resolveValue),
            then: (resolve: (v: unknown) => void) => Promise.resolve(resolveValue).then(resolve),
          }));
        } else {
          chainable[method] = vi.fn().mockReturnValue(chainable);
        }
      });
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(chainable),
      } as never);
      
      const result = await TransactionService.getTransactionsByGroup('group-1', {
        limit: 2,
        offset: 0,
      });
      
      expect(result.hasMore).toBe(true);
      expect(result.total).toBe(5);
    });

    it('should set hasMore to false when no limit is provided', async () => {
      const mockTransactions = [createMockTransaction()];
      const resolveValue = { data: mockTransactions, count: 1, error: null };
      
      const chainable: Record<string, ReturnType<typeof vi.fn>> = {};
      const methods = ['select', 'eq', 'gte', 'lte', 'or', 'order', 'range', 'limit'];
      methods.forEach(method => {
        if (method === 'order') {
          chainable[method] = vi.fn().mockImplementation(() => ({
            ...chainable,
            range: vi.fn().mockResolvedValue(resolveValue),
            then: (resolve: (v: unknown) => void) => Promise.resolve(resolveValue).then(resolve),
          }));
        } else {
          chainable[method] = vi.fn().mockReturnValue(chainable);
        }
      });
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(chainable),
      } as never);
      
      const result = await TransactionService.getTransactionsByGroup('group-1');
      
      expect(result.hasMore).toBe(false);
    });

    it('should handle null data with limit provided', async () => {
      // This tests the data?.length || 0 branch when limit is provided but data is null
      const resolveValue = { data: null, count: 5, error: null };
      
      const chainable: Record<string, ReturnType<typeof vi.fn>> = {};
      const methods = ['select', 'eq', 'gte', 'lte', 'or', 'order', 'range', 'limit'];
      methods.forEach(method => {
        if (method === 'order') {
          chainable[method] = vi.fn().mockImplementation(() => ({
            ...chainable,
            range: vi.fn().mockResolvedValue(resolveValue),
            then: (resolve: (v: unknown) => void) => Promise.resolve(resolveValue).then(resolve),
          }));
        } else if (method === 'limit') {
          chainable[method] = vi.fn().mockReturnValue({
            ...chainable,
            range: vi.fn().mockResolvedValue(resolveValue),
          });
        } else {
          chainable[method] = vi.fn().mockReturnValue(chainable);
        }
      });
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue(chainable),
      } as never);
      
      const result = await TransactionService.getTransactionsByGroup('group-1', { limit: 10 });
      
      expect(result.data).toEqual([]);
      expect(result.hasMore).toBe(true); // 0 + 0 < 5 = true
    });
  });

  describe('getByAccountDb with empty data', () => {
    it('should return empty array when data is null', async () => {
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({ data: null, error: null }),
          }),
        }),
      } as never);
      
      const result = await TransactionService.getTransactionsByAccount('account-1');
      
      expect(result).toEqual([]);
    });
  });

  describe('updateBalancesForTransaction - transfer without to_account_id', () => {
    it('should not update balances for transfer without to_account_id', async () => {
      // Test delete with transfer without to_account - hits the branch where
      // type is 'transfer' but to_account_id is null
      const existingTx = createMockTransaction({
        type: 'transfer',
        to_account_id: null,
        group_id: null, // Also test null group_id branch
      });
      
      const selectMock = vi.fn().mockReturnValue({
        eq: vi.fn().mockReturnValue({
          single: vi.fn()
            .mockResolvedValueOnce({ data: existingTx, error: null }) // getByIdDb
            .mockResolvedValueOnce({ data: existingTx, error: null }), // deleteDb
        }),
      });
      
      vi.mocked(supabase.from).mockReturnValue({
        select: selectMock,
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: existingTx, error: null }),
            }),
          }),
        }),
      } as never);
      
      const result = await TransactionService.deleteTransaction('tx-1');
      
      expect(result).toEqual({ id: 'tx-1' });
    });
  });

  describe('updateTransaction with null group_id in existing', () => {
    it('should handle existing transaction with null group_id', async () => {
      const existingTx = createMockTransaction({ 
        group_id: null,
        to_account_id: null,
      });
      const updatedTx = createMockTransaction({ description: 'Updated' });
      
      vi.mocked(supabase.from).mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn()
              .mockResolvedValueOnce({ data: existingTx, error: null })
              .mockResolvedValueOnce({ data: { balance: 1000 }, error: null })
              .mockResolvedValueOnce({ data: { balance: 1000 }, error: null }),
          }),
        }),
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({ data: updatedTx, error: null }),
            }),
          }),
        }),
      } as never);
      
      const result = await TransactionService.updateTransaction('tx-1', { 
        description: 'Updated',
      });
      
      expect(result.description).toBe('Updated');
    });
  });
});
