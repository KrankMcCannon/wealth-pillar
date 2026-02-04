'use server';

import { revalidatePath } from 'next/cache';

import { getCurrentUser } from '@/lib/auth/cached-auth';
import { CreateBudgetInput, BudgetService } from '@/server/services';
import { canAccessUserData, isMember } from '@/lib/utils';
import type { Budget, User } from '@/lib/types';

type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

/**
 * Server Action: Create Budget
 * Wrapper for BudgetService.createBudget with additional validation
 */
export async function createBudgetAction(input: CreateBudgetInput): Promise<ServiceResult<Budget>> {
  try {
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    // Permission validation: members can only create for themselves
    if (isMember(currentUser as unknown as User) && input.user_id !== currentUser.id) {
      return {
        data: null,
        error: 'Non hai i permessi per creare budget per altri utenti',
      };
    }

    // Verify user_id is provided
    if (!input.user_id) {
      return {
        data: null,
        error: "L'utente è obbligatorio",
      };
    }

    // Admins can create for anyone, but verify target user exists
    if (!canAccessUserData(currentUser as unknown as User, input.user_id)) {
      return {
        data: null,
        error: 'Non hai i permessi per accedere ai dati di questo utente',
      };
    }

    // Resolve group_id (BudgetService handles default logic but we can do it here explicitly if needed)
    // BudgetService.createBudget handles permission/group resolution too, but we keep this action as a wrapper
    // Actually, let's delegate to service which now has robust validation

    // We can just call BudgetService.createBudget - it handles validation.
    // However, the action is responsible for revalidating paths that might not be known to service (though service does tags)

    const budget = await BudgetService.createBudget(input);

    if (budget) {
      // Revalidate paths
      revalidatePath('/budgets');
      revalidatePath('/dashboard');

      return { data: budget, error: null };
    }

    return { data: null, error: 'Failed to create budget' };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create budget',
    };
  }
}

/**
 * Server Action: Update Budget
 */
export async function updateBudgetAction(
  id: string,
  input: Partial<CreateBudgetInput>
): Promise<ServiceResult<Budget>> {
  try {
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    // Get existing budget to verify ownership
    const existingBudget = await BudgetService.getBudgetById(id);

    // Verify budget has a user_id
    if (!existingBudget.user_id) {
      return {
        data: null,
        error: 'Il budget non ha un utente assegnato',
      };
    }

    // Permission validation: verify access to existing budget
    if (!canAccessUserData(currentUser as unknown as User, existingBudget.user_id)) {
      return {
        data: null,
        error: 'Non hai i permessi per modificare questo budget',
      };
    }

    // If changing user_id, verify permission for new user
    if (input.user_id && input.user_id !== existingBudget.user_id) {
      if (isMember(currentUser as unknown as User)) {
        return {
          data: null,
          error: 'Non puoi assegnare il budget a un altro utente',
        };
      }

      if (!canAccessUserData(currentUser as unknown as User, input.user_id)) {
        return {
          data: null,
          error: 'Non hai i permessi per assegnare questo budget a questo utente',
        };
      }
    }

    const budget = await BudgetService.updateBudget(id, input);

    if (budget) {
      // Revalidate paths
      revalidatePath('/budgets');
      revalidatePath('/dashboard');

      return { data: budget, error: null };
    }

    return { data: null, error: 'Failed to update budget' };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update budget',
    };
  }
}

/**
 * Server Action: Delete Budget
 */
export async function deleteBudgetAction(id: string): Promise<ServiceResult<{ id: string }>> {
  try {
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    // Get existing budget to verify ownership
    const existingBudget = await BudgetService.getBudgetById(id);

    // Verify budget has a user_id
    if (!existingBudget.user_id) {
      return {
        data: null,
        error: 'Il budget non ha un utente assegnato',
      };
    }

    // Permission validation: verify access to budget
    if (!canAccessUserData(currentUser as unknown as User, existingBudget.user_id)) {
      return {
        data: null,
        error: 'Non hai i permessi per eliminare questo budget',
      };
    }

    const result = await BudgetService.deleteBudget(id);

    if (result) {
      // Revalidate paths
      revalidatePath('/budgets');
      revalidatePath('/dashboard');

      return { data: { id }, error: null };
    }

    return { data: null, error: 'Failed to delete budget' };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete budget',
    };
  }
}
