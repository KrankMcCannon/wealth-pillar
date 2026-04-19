'use server';

import { getCurrentUser } from '@/lib/auth/cached-auth';
import { revalidateTransactionRelatedPaths } from '@/lib/cache/revalidation-paths';
import type { ServiceResult } from '@/lib/types/service-result';
import { assertCanActOnUser } from '@/features/permissions/assert-can-act-on-user';
import { createTransactionUseCase } from '@/server/use-cases/transactions/create-transaction.use-case';
import { updateTransactionUseCase } from '@/server/use-cases/transactions/update-transaction.use-case';
import { deleteTransactionUseCase } from '@/server/use-cases/transactions/delete-transaction.use-case';
import { getTransactionByIdUseCase } from '@/server/use-cases/transactions/get-transactions.use-case';
import type { CreateTransactionInput } from '@/server/use-cases/transactions/types';
import { canAccessUserData, isMember } from '@/lib/utils';
import type { User, Transaction } from '@/lib/types';

/**
 * Server Action: Create Transaction
 * Wraps TransactionService.createTransaction for client component usage
 * Validates permissions: members can only create transactions for themselves
 */
export async function createTransactionAction(
  input: CreateTransactionInput
): Promise<ServiceResult<Transaction>> {
  try {
    const currentUser = await getCurrentUser();
    const gate = assertCanActOnUser(currentUser as unknown as User, input.user_id ?? undefined);
    if (!gate.ok) return { data: null, error: gate.error };

    const data = await createTransactionUseCase(input);

    if (data) {
      revalidateTransactionRelatedPaths();
    }

    return { data, error: null };
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
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    // Get existing transaction to verify ownership
    const existingTransaction = await getTransactionByIdUseCase(id);
    if (!existingTransaction) {
      return { data: null, error: 'Transazione non trovata' };
    }

    // Verify transaction has a user_id
    if (!existingTransaction.user_id) {
      return {
        data: null,
        error: 'La transazione non ha un utente assegnato',
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
    const data = await updateTransactionUseCase(id, input);

    if (data) {
      revalidateTransactionRelatedPaths();
    }

    return { data, error: null };
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
export async function deleteTransactionAction(id: string): Promise<ServiceResult<{ id: string }>> {
  try {
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    // Get existing transaction to verify ownership
    const existingTransaction = await getTransactionByIdUseCase(id);
    if (!existingTransaction) {
      return { data: null, error: 'Transazione non trovata' };
    }

    // Verify transaction has a user_id
    if (!existingTransaction.user_id) {
      return {
        data: null,
        error: 'La transazione non ha un utente assegnato',
      };
    }

    // Permission validation: verify access to transaction
    if (!canAccessUserData(currentUser as unknown as User, existingTransaction.user_id)) {
      return { data: null, error: 'Permesso negato' };
    }

    // Call service
    await deleteTransactionUseCase(id);

    revalidateTransactionRelatedPaths();

    return { data: { id }, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete transaction',
    };
  }
}
