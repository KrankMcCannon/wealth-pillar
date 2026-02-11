import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createTransactionAction,
  updateTransactionAction,
  deleteTransactionAction,
} from './transaction-actions';
import type { Transaction, User } from '@/lib/types';
import type { CreateTransactionInput } from '@/server/services';

// Mock dependencies
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}));

vi.mock('@/lib/auth/cached-auth', () => ({
  getCurrentUser: vi.fn(),
}));

vi.mock('@/server/services', () => ({
  TransactionService: {
    createTransaction: vi.fn(),
    getTransactionById: vi.fn(),
    updateTransaction: vi.fn(),
    deleteTransaction: vi.fn(),
  },
}));

vi.mock('@/lib/utils', () => ({
  canAccessUserData: vi.fn(),
  isMember: vi.fn(),
}));

import { revalidatePath } from 'next/cache';
import { getCurrentUser } from '@/lib/auth/cached-auth';
import { TransactionService } from '@/server/services';
import { canAccessUserData, isMember } from '@/lib/utils';

// Factory helpers
function createMockUser(overrides: Partial<User> = {}): User {
  return {
    id: 'user-1',
    name: 'Test User',
    email: 'test@example.com',
    avatar: null,
    theme_color: null,
    budget_start_date: null,
    group_id: 'group-1',
    role: 'admin',
    clerk_id: 'clerk-1',
    default_account_id: null,
    budget_periods: null,
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    ...overrides,
  };
}

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

describe('transaction-actions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(canAccessUserData).mockReturnValue(true);
    vi.mocked(isMember).mockReturnValue(false);
  });

  describe('createTransactionAction', () => {
    it('should return error when user is not authenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const result = await createTransactionAction(createMockInput());

      expect(result).toEqual({ data: null, error: 'Non autenticato' });
      expect(TransactionService.createTransaction).not.toHaveBeenCalled();
    });

    it('should return error when member tries to create transaction for another user', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: 'user-1' }));
      vi.mocked(isMember).mockReturnValue(true);

      const result = await createTransactionAction(createMockInput({ user_id: 'user-2' }));

      expect(result).toEqual({ data: null, error: 'Permesso negato' });
    });

    it('should return error when user_id is not provided', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(createMockUser());

      const result = await createTransactionAction(createMockInput({ user_id: null }));

      expect(result).toEqual({ data: null, error: 'User ID richiesto' });
    });

    it('should return error when user cannot access target user data', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(createMockUser());
      vi.mocked(canAccessUserData).mockReturnValue(false);

      const result = await createTransactionAction(createMockInput({ user_id: 'user-2' }));

      expect(result).toEqual({ data: null, error: 'Permesso negato' });
    });

    it('should create transaction successfully and revalidate paths', async () => {
      const mockUser = createMockUser();
      const mockTransaction = createMockTransaction();
      const input = createMockInput();

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(TransactionService.createTransaction).mockResolvedValue(mockTransaction);

      const result = await createTransactionAction(input);

      expect(result).toEqual({ data: mockTransaction, error: null });
      expect(TransactionService.createTransaction).toHaveBeenCalledWith(input);
      expect(revalidatePath).toHaveBeenCalledWith('/transactions');
      expect(revalidatePath).toHaveBeenCalledWith('/accounts');
    });

    it('should not revalidate paths when service returns null', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(createMockUser());
      vi.mocked(TransactionService.createTransaction).mockResolvedValue(
        null as unknown as Transaction
      );

      const result = await createTransactionAction(createMockInput());

      expect(result).toEqual({ data: null, error: null });
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should handle service errors gracefully', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(createMockUser());
      vi.mocked(TransactionService.createTransaction).mockRejectedValue(
        new Error('Database error')
      );

      const result = await createTransactionAction(createMockInput());

      expect(result).toEqual({ data: null, error: 'Database error' });
    });

    it('should handle non-Error exceptions with fallback message', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(createMockUser());
      vi.mocked(TransactionService.createTransaction).mockRejectedValue('string error');

      const result = await createTransactionAction(createMockInput());

      expect(result).toEqual({ data: null, error: 'Failed to create transaction' });
    });
  });

  describe('updateTransactionAction', () => {
    it('should return error when user is not authenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const result = await updateTransactionAction('tx-1', { description: 'Updated' });

      expect(result).toEqual({
        data: null,
        error: 'Non autenticato. Effettua il login per continuare.',
      });
    });

    it('should return error when transaction is not found', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(createMockUser());
      vi.mocked(TransactionService.getTransactionById).mockResolvedValue(
        null as unknown as Transaction
      );

      const result = await updateTransactionAction('tx-nonexistent', { description: 'Updated' });

      expect(result).toEqual({ data: null, error: 'Transazione non trovata' });
    });

    it('should return error when transaction has no user_id', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(createMockUser());
      vi.mocked(TransactionService.getTransactionById).mockResolvedValue(
        createMockTransaction({ user_id: null })
      );

      const result = await updateTransactionAction('tx-1', { description: 'Updated' });

      expect(result).toEqual({
        data: null,
        error: 'La transazione non ha un utente assegnato',
      });
    });

    it('should return error when user cannot access existing transaction', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: 'user-1' }));
      vi.mocked(TransactionService.getTransactionById).mockResolvedValue(
        createMockTransaction({ user_id: 'user-2' })
      );
      vi.mocked(canAccessUserData).mockReturnValue(false);

      const result = await updateTransactionAction('tx-1', { description: 'Updated' });

      expect(result).toEqual({ data: null, error: 'Permesso negato' });
    });

    it('should return error when member tries to reassign transaction to another user', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: 'user-1' }));
      vi.mocked(TransactionService.getTransactionById).mockResolvedValue(
        createMockTransaction({ user_id: 'user-1' })
      );
      vi.mocked(isMember).mockReturnValue(true);

      const result = await updateTransactionAction('tx-1', { user_id: 'user-2' });

      expect(result).toEqual({
        data: null,
        error: 'Non puoi assegnare la transazione a un altro utente',
      });
    });

    it('should return error when admin cannot access new user for reassignment', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: 'admin-1', role: 'admin' }));
      vi.mocked(TransactionService.getTransactionById).mockResolvedValue(
        createMockTransaction({ user_id: 'user-1' })
      );
      vi.mocked(isMember).mockReturnValue(false); // Not a member (is admin)
      vi.mocked(canAccessUserData)
        .mockReturnValueOnce(true) // Can access existing transaction
        .mockReturnValueOnce(false); // Cannot access new user

      const result = await updateTransactionAction('tx-1', { user_id: 'user-restricted' });

      expect(result).toEqual({ data: null, error: 'Permesso negato' });
    });

    it('should allow admin to reassign transaction to accessible user', async () => {
      const mockUser = createMockUser({ id: 'admin-1', role: 'admin' });
      const existingTx = createMockTransaction({ user_id: 'user-1' });
      const updatedTx = createMockTransaction({ user_id: 'user-2' });

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(TransactionService.getTransactionById).mockResolvedValue(existingTx);
      vi.mocked(TransactionService.updateTransaction).mockResolvedValue(updatedTx);
      vi.mocked(isMember).mockReturnValue(false); // Not a member (is admin)
      vi.mocked(canAccessUserData)
        .mockReturnValueOnce(true) // Can access existing transaction
        .mockReturnValueOnce(true); // Can access new user

      const result = await updateTransactionAction('tx-1', { user_id: 'user-2' });

      expect(result).toEqual({ data: updatedTx, error: null });
      expect(TransactionService.updateTransaction).toHaveBeenCalledWith('tx-1', {
        user_id: 'user-2',
      });
    });

    it('should update transaction successfully and revalidate paths', async () => {
      const mockUser = createMockUser();
      const existingTx = createMockTransaction();
      const updatedTx = createMockTransaction({ description: 'Updated' });

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(TransactionService.getTransactionById).mockResolvedValue(existingTx);
      vi.mocked(TransactionService.updateTransaction).mockResolvedValue(updatedTx);

      const result = await updateTransactionAction('tx-1', { description: 'Updated' });

      expect(result).toEqual({ data: updatedTx, error: null });
      expect(TransactionService.updateTransaction).toHaveBeenCalledWith('tx-1', {
        description: 'Updated',
      });
      expect(revalidatePath).toHaveBeenCalledWith('/transactions');
      expect(revalidatePath).toHaveBeenCalledWith('/accounts');
    });

    it('should handle service errors gracefully', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(createMockUser());
      vi.mocked(TransactionService.getTransactionById).mockResolvedValue(createMockTransaction());
      vi.mocked(TransactionService.updateTransaction).mockRejectedValue(new Error('Update failed'));

      const result = await updateTransactionAction('tx-1', { description: 'Updated' });

      expect(result).toEqual({ data: null, error: 'Update failed' });
    });

    it('should not revalidate paths when service returns null', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(createMockUser());
      vi.mocked(TransactionService.getTransactionById).mockResolvedValue(createMockTransaction());
      vi.mocked(TransactionService.updateTransaction).mockResolvedValue(
        null as unknown as Transaction
      );

      const result = await updateTransactionAction('tx-1', { description: 'Updated' });

      expect(result).toEqual({ data: null, error: null });
      expect(revalidatePath).not.toHaveBeenCalled();
    });

    it('should handle non-Error exceptions with fallback message', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(createMockUser());
      vi.mocked(TransactionService.getTransactionById).mockResolvedValue(createMockTransaction());
      vi.mocked(TransactionService.updateTransaction).mockRejectedValue({ code: 'UNKNOWN' });

      const result = await updateTransactionAction('tx-1', { description: 'Updated' });

      expect(result).toEqual({ data: null, error: 'Failed to update transaction' });
    });
  });

  describe('deleteTransactionAction', () => {
    it('should return error when user is not authenticated', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(null);

      const result = await deleteTransactionAction('tx-1');

      expect(result).toEqual({
        data: null,
        error: 'Non autenticato. Effettua il login per continuare.',
      });
    });

    it('should return error when transaction is not found', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(createMockUser());
      vi.mocked(TransactionService.getTransactionById).mockResolvedValue(
        null as unknown as Transaction
      );

      const result = await deleteTransactionAction('tx-nonexistent');

      expect(result).toEqual({ data: null, error: 'Transazione non trovata' });
    });

    it('should return error when transaction has no user_id', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(createMockUser());
      vi.mocked(TransactionService.getTransactionById).mockResolvedValue(
        createMockTransaction({ user_id: null })
      );

      const result = await deleteTransactionAction('tx-1');

      expect(result).toEqual({
        data: null,
        error: 'La transazione non ha un utente assegnato',
      });
    });

    it('should return error when user cannot access transaction', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(createMockUser({ id: 'user-1' }));
      vi.mocked(TransactionService.getTransactionById).mockResolvedValue(
        createMockTransaction({ user_id: 'user-2' })
      );
      vi.mocked(canAccessUserData).mockReturnValue(false);

      const result = await deleteTransactionAction('tx-1');

      expect(result).toEqual({ data: null, error: 'Permesso negato' });
    });

    it('should delete transaction successfully and revalidate paths', async () => {
      const mockUser = createMockUser();
      const existingTx = createMockTransaction();

      vi.mocked(getCurrentUser).mockResolvedValue(mockUser);
      vi.mocked(TransactionService.getTransactionById).mockResolvedValue(existingTx);
      vi.mocked(TransactionService.deleteTransaction).mockResolvedValue({ id: 'tx-1' });

      const result = await deleteTransactionAction('tx-1');

      expect(result).toEqual({ data: { id: 'tx-1' }, error: null });
      expect(TransactionService.deleteTransaction).toHaveBeenCalledWith('tx-1');
      expect(revalidatePath).toHaveBeenCalledWith('/transactions');
      expect(revalidatePath).toHaveBeenCalledWith('/accounts');
    });

    it('should handle service errors gracefully', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(createMockUser());
      vi.mocked(TransactionService.getTransactionById).mockResolvedValue(createMockTransaction());
      vi.mocked(TransactionService.deleteTransaction).mockRejectedValue(new Error('Delete failed'));

      const result = await deleteTransactionAction('tx-1');

      expect(result).toEqual({ data: null, error: 'Delete failed' });
    });

    it('should handle non-Error exceptions with fallback message', async () => {
      vi.mocked(getCurrentUser).mockResolvedValue(createMockUser());
      vi.mocked(TransactionService.getTransactionById).mockResolvedValue(createMockTransaction());
      vi.mocked(TransactionService.deleteTransaction).mockRejectedValue(null);

      const result = await deleteTransactionAction('tx-1');

      expect(result).toEqual({ data: null, error: 'Failed to delete transaction' });
    });
  });
});
