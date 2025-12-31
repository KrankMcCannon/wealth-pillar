'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

import { auth } from '@clerk/nextjs/server';
import { BudgetService, CreateBudgetInput } from '@/lib/services/budget.service';
import { UserService } from '@/lib/services';
import { canAccessUserData, isMember } from '@/lib/utils/permissions';
import { CACHE_TAGS } from '@/lib/cache';
import type { Budget } from '@/lib/types';
import type { ServiceResult } from '@/lib/services/user.service';

/**
 * Server Action: Create Budget
 * Wraps BudgetService.createBudget for client component usage
 * Validates permissions: members can only create budgets for themselves
 */
export async function createBudgetAction(
  input: CreateBudgetInput
): Promise<ServiceResult<Budget>> {
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
        error: 'Non hai i permessi per creare budget per altri utenti'
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

    const result = await BudgetService.createBudget(input);

    if (!result.error) {
      // Revalidate paths
      revalidatePath('/budgets');
      revalidatePath('/dashboard');

      // Invalidate budget cache
      revalidateTag(CACHE_TAGS.USER_BUDGETS(input.user_id));
    }

    return result;
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create budget',
    };
  }
}

/**
 * Server Action: Update Budget
 * Wraps BudgetService.updateBudget for client component usage
 * Validates permissions: members can only update their own budgets
 */
export async function updateBudgetAction(
  id: string,
  input: Partial<CreateBudgetInput>
): Promise<ServiceResult<Budget>> {
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

    // Get existing budget to verify ownership
    const { data: existingBudget, error: budgetError } = await BudgetService.getBudgetById(id);
    if (budgetError || !existingBudget) {
      return { data: null, error: budgetError || 'Budget non trovato' };
    }

    // Verify budget has a user_id
    if (!existingBudget.user_id) {
      return {
        data: null,
        error: 'Il budget non ha un utente assegnato'
      };
    }

    // Permission validation: verify access to existing budget
    if (!canAccessUserData(currentUser, existingBudget.user_id)) {
      return {
        data: null,
        error: 'Non hai i permessi per modificare questo budget'
      };
    }

    // If changing user_id, verify permission for new user
    if (input.user_id && input.user_id !== existingBudget.user_id) {
      if (isMember(currentUser)) {
        return {
          data: null,
          error: 'Non puoi assegnare il budget a un altro utente'
        };
      }

      if (!canAccessUserData(currentUser, input.user_id)) {
        return {
          data: null,
          error: 'Non hai i permessi per assegnare questo budget a questo utente'
        };
      }
    }

    const result = await BudgetService.updateBudget(id, input);

    if (!result.error) {
      // Revalidate paths
      revalidatePath('/budgets');
      revalidatePath('/dashboard');

      // Invalidate cache for old user
      revalidateTag(CACHE_TAGS.USER_BUDGETS(existingBudget.user_id));

      // If user_id changed, invalidate cache for new user too
      if (input.user_id && input.user_id !== existingBudget.user_id) {
        revalidateTag(CACHE_TAGS.USER_BUDGETS(input.user_id));
      }
    }

    return result;
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update budget',
    };
  }
}

/**
 * Server Action: Delete Budget
 * Wraps BudgetService.deleteBudget for client component usage
 * Validates permissions: members can only delete their own budgets
 */
export async function deleteBudgetAction(
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

    // Get existing budget to verify ownership
    const { data: existingBudget, error: budgetError } = await BudgetService.getBudgetById(id);
    if (budgetError || !existingBudget) {
      return { data: null, error: budgetError || 'Budget non trovato' };
    }

    // Verify budget has a user_id
    if (!existingBudget.user_id) {
      return {
        data: null,
        error: 'Il budget non ha un utente assegnato'
      };
    }

    // Permission validation: verify access to budget
    if (!canAccessUserData(currentUser, existingBudget.user_id)) {
      return {
        data: null,
        error: 'Non hai i permessi per eliminare questo budget'
      };
    }

    const result = await BudgetService.deleteBudget(id);

    if (!result.error) {
      // Revalidate paths
      revalidatePath('/budgets');
      revalidatePath('/dashboard');

      // Invalidate budget cache
      revalidateTag(CACHE_TAGS.USER_BUDGETS(existingBudget.user_id));
    }

    return result;
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete budget',
    };
  }
}
