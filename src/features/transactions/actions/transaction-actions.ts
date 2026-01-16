'use server';

import { revalidatePath } from 'next/cache';

import { auth } from '@clerk/nextjs/server';
import { TransactionService, CreateTransactionInput } from '@/server/services';
import { UserService } from '@/server/services';
import { canAccessUserData, isMember } from '@/lib/utils';
import type { User, Transaction } from '@/lib/types';
import type { ServiceResult } from '@/server/services';

/**
 * Server Action: Create Transaction
 * Wraps TransactionService.createTransaction for client component usage
 * Validates permissions: members can only create transactions for themselves
 */
export async function createTransactionAction(
  input: CreateTransactionInput
): Promise<ServiceResult<Transaction>> {
  try {
    // Authentication check
    const { userId: clerkId } = await auth();
    if (!clerkId) return { data: null, error: 'Non autenticato' };

    const { data: currentUser, error: userError } = await UserService.getLoggedUserInfo(clerkId);
    if (userError || !currentUser) return { data: null, error: userError };

    if (isMember(currentUser as unknown as User) && input.user_id !== currentUser.id) {
      return { data: null, error: 'Permesso negato' };
    }

    if (!input.user_id) return { data: null, error: 'User ID richiesto' };

    if (!canAccessUserData(currentUser as unknown as User, input.user_id)) {
      return { data: null, error: 'Permesso negato' };
    }

    // Call service
    const result = await TransactionService.createTransaction(input);

    if (result.data) {
      // Revalidate paths that might not be covered by the service
      revalidatePath('/dashboard');
      revalidatePath('/transactions');
      revalidatePath('/accounts');
      revalidatePath('/budgets');
      revalidatePath('/reports');

      // Additional cache tags if needed, though Service handles most
    }

    return result;
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create transaction',
    };
  }
}

/**
 * Server Action: Update Transaction
 * Wraps TransactionService.updateTransaction for client component usage
 * Validates permissions: members can only update their own transactions
 */
export async function updateTransactionAction(
  id: string,
  input: Partial<CreateTransactionInput>
): Promise<ServiceResult<Transaction>> {
  try {
    // Authentication check
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    // Get current user
    const { data: currentUser, error: userError } = await UserService.getLoggedUserInfo(clerkId);
    if (userError || !currentUser) {
      return { data: null, error: userError || 'Utente non trovato' };
    }

    // Get existing transaction to verify ownership
    const { data: existingTransaction, error: txError } = await TransactionService.getTransactionById(id);
    if (txError || !existingTransaction) {
      return { data: null, error: txError || 'Transazione non trovata' };
    }

    // Verify transaction has a user_id
    if (!existingTransaction.user_id) {
      return {
        data: null,
        error: 'La transazione non ha un utente assegnato'
      };
    }

    // Permission validation: verify access to existing transaction
    if (!canAccessUserData(currentUser as unknown as User, existingTransaction.user_id)) {
      return { data: null, error: 'Permesso negato' };
    }

    // If changing user_id, verify permission for new user
    if (input.user_id && input.user_id !== existingTransaction.user_id) {
      if (isMember(currentUser as unknown as User)) {
        return { data: null, error: 'Non puoi assegnare la transazione a un altro utente' };
      }
      if (!canAccessUserData(currentUser as unknown as User, input.user_id)) {
        return { data: null, error: 'Permesso negato' };
      }
    }

    // Call service
    const result = await TransactionService.updateTransaction(id, input);

    if (result.data) {
      // Revalidate paths
      revalidatePath('/dashboard');
      revalidatePath('/transactions');
      revalidatePath('/accounts');
      revalidatePath('/budgets');
      revalidatePath('/reports');
    }

    return result;
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update transaction',
    };
  }
}

/**
 * Server Action: Delete Transaction
 * Wraps TransactionService.deleteTransaction for client component usage
 * Validates permissions: members can only delete their own transactions
 */
export async function deleteTransactionAction(
  id: string
): Promise<ServiceResult<{ id: string }>> {
  try {
    // Authentication check
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    // Get current user
    const { data: currentUser, error: userError } = await UserService.getLoggedUserInfo(clerkId);
    if (userError || !currentUser) {
      return { data: null, error: userError || 'Utente non trovato' };
    }

    // Get existing transaction to verify ownership
    const { data: existingTransaction, error: txError } = await TransactionService.getTransactionById(id);
    if (txError || !existingTransaction) {
      return { data: null, error: txError || 'Transazione non trovata' };
    }

    // Verify transaction has a user_id
    if (!existingTransaction.user_id) {
      return {
        data: null,
        error: 'La transazione non ha un utente assegnato'
      };
    }

    // Permission validation: verify access to transaction
    if (!canAccessUserData(currentUser as unknown as User, existingTransaction.user_id)) {
      return { data: null, error: 'Permesso negato' };
    }

    // Call service
    const result = await TransactionService.deleteTransaction(id);

    if (result.data) {
      // Revalidate paths
      revalidatePath('/dashboard');
      revalidatePath('/transactions');
      revalidatePath('/accounts');
      revalidatePath('/budgets');
      revalidatePath('/reports');
    }

    return result;
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete transaction',
    };
  }
}
