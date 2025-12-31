'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

import { auth } from '@clerk/nextjs/server';
import { TransactionService, CreateTransactionInput } from '@/lib/services/transaction.service';
import { UserService } from '@/lib/services';
import { canAccessUserData, isMember } from '@/lib/utils/permissions';
import { CACHE_TAGS } from '@/lib/cache';
import type { Transaction } from '@/lib/types';
import type { ServiceResult } from '@/lib/services/user.service';

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
    if (!clerkId) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    // Get current user
    const { data: currentUser, error: userError } = await UserService.getLoggedUserInfo(clerkId);
    if (userError || !currentUser) {
      return { data: null, error: userError || 'Utente non trovato' };
    }

    // Permission validation: members can only create for themselves
    if (isMember(currentUser) && input.user_id !== currentUser.id) {
      return {
        data: null,
        error: 'Non hai i permessi per creare transazioni per altri utenti'
      };
    }

    // Verify user_id is provided
    if (!input.user_id) {
      return {
        data: null,
        error: 'L\'utente è obbligatorio'
      };
    }

    // Admins can create for anyone, but verify target user exists
    if (!canAccessUserData(currentUser, input.user_id)) {
      return {
        data: null,
        error: 'Non hai i permessi per accedere ai dati di questo utente'
      };
    }

    const result = await TransactionService.createTransaction(input);

    if (!result.error) {
      // Revalidate paths
      revalidatePath('/dashboard');
      revalidatePath('/transactions');
      revalidatePath('/accounts');
      revalidatePath('/budgets');
      revalidatePath('/reports');

      // Invalidate budget period and budget caches (PostgreSQL triggers handle DB updates)
      revalidateTag(CACHE_TAGS.USER_BUDGET_PERIODS(input.user_id));
      revalidateTag(CACHE_TAGS.USER_ACTIVE_BUDGET_PERIOD(input.user_id));
      revalidateTag(CACHE_TAGS.USER_BUDGETS(input.user_id));
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
    if (!canAccessUserData(currentUser, existingTransaction.user_id)) {
      return {
        data: null,
        error: 'Non hai i permessi per modificare questa transazione'
      };
    }

    // If changing user_id, verify permission for new user
    if (input.user_id && input.user_id !== existingTransaction.user_id) {
      if (isMember(currentUser)) {
        return {
          data: null,
          error: 'Non puoi assegnare la transazione a un altro utente'
        };
      }

      if (!canAccessUserData(currentUser, input.user_id)) {
        return {
          data: null,
          error: 'Non hai i permessi per assegnare questa transazione a questo utente'
        };
      }
    }

    const result = await TransactionService.updateTransaction(id, input);

    if (!result.error) {
      // Revalidate paths
      revalidatePath('/dashboard');
      revalidatePath('/transactions');
      revalidatePath('/accounts');
      revalidatePath('/budgets');
      revalidatePath('/reports');

      // Invalidate caches for old user
      revalidateTag(CACHE_TAGS.USER_BUDGET_PERIODS(existingTransaction.user_id));
      revalidateTag(CACHE_TAGS.USER_ACTIVE_BUDGET_PERIOD(existingTransaction.user_id));
      revalidateTag(CACHE_TAGS.USER_BUDGETS(existingTransaction.user_id));

      // If user_id changed, invalidate caches for new user too
      if (input.user_id && input.user_id !== existingTransaction.user_id) {
        revalidateTag(CACHE_TAGS.USER_BUDGET_PERIODS(input.user_id));
        revalidateTag(CACHE_TAGS.USER_ACTIVE_BUDGET_PERIOD(input.user_id));
        revalidateTag(CACHE_TAGS.USER_BUDGETS(input.user_id));
      }
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
    if (!canAccessUserData(currentUser, existingTransaction.user_id)) {
      return {
        data: null,
        error: 'Non hai i permessi per eliminare questa transazione'
      };
    }

    const result = await TransactionService.deleteTransaction(id);

    if (!result.error) {
      // Revalidate paths
      revalidatePath('/dashboard');
      revalidatePath('/transactions');
      revalidatePath('/accounts');
      revalidatePath('/budgets');
      revalidatePath('/reports');

      // Invalidate budget period and budget caches (PostgreSQL triggers handle DB updates)
      revalidateTag(CACHE_TAGS.USER_BUDGET_PERIODS(existingTransaction.user_id));
      revalidateTag(CACHE_TAGS.USER_ACTIVE_BUDGET_PERIOD(existingTransaction.user_id));
      revalidateTag(CACHE_TAGS.USER_BUDGETS(existingTransaction.user_id));
    }

    return result;
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete transaction',
    };
  }
}
