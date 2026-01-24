'use server';

import { revalidatePath, revalidateTag } from 'next/cache';

import { getCurrentUser } from '@/lib/auth/cached-auth';
import { CreateBudgetInput, UserService } from '@/server/services';
import { canAccessUserData, isMember } from '@/lib/utils';
import { CACHE_TAGS } from '@/lib/cache/config';
import type { Budget, User } from '@/lib/types';
import { BudgetRepository } from '@/server/dal';
import { serialize } from '@/lib/utils/serializer';

type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

/**
 * Server Action: Create Budget
 * Wraps BudgetRepository.create for client component usage
 * Validates permissions and input data
 */
export async function createBudgetAction(
  input: CreateBudgetInput
): Promise<ServiceResult<Budget>> {
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
    if (!canAccessUserData(currentUser as unknown as User, input.user_id)) {
      return {
        data: null,
        error: 'Non hai i permessi per accedere ai dati di questo utente'
      };
    }

    // Input Validation (replicating Service logic)
    if (!input.description || input.description.trim() === '') {
      return { data: null, error: 'Description is required' };
    }
    if (input.description.trim().length < 2) {
      return { data: null, error: 'Description must be at least 2 characters' };
    }
    if (!input.amount || input.amount <= 0) {
      return { data: null, error: 'Amount must be greater than zero' };
    }
    if (!input.type) {
      return { data: null, error: 'Budget type is required' };
    }
    if (!['monthly', 'annually'].includes(input.type)) {
      return { data: null, error: 'Invalid budget type' };
    }
    if (!input.categories || input.categories.length === 0) {
      return { data: null, error: 'At least one category is required' };
    }

    // Resolve group_id
    let groupId = input.group_id;
    if (!groupId) {
      // If we are creating for current user, use their group_id
      if (input.user_id === currentUser.id) {
        groupId = currentUser.group_id || undefined;
      } else {
        // Creating for another user (Admin), fetch that user
        const targetUser = await UserService.getUserById(input.user_id);
        if (targetUser) {
          groupId = targetUser.group_id || undefined;
        }
      }
    }

    const budget = await BudgetRepository.create({
      description: input.description.trim(),
      amount: input.amount,
      type: input.type,
      icon: input.icon || null,
      categories: input.categories, // Prisma handles string[] -> Json mapping implicitly usually
      user_id: input.user_id,
      group_id: groupId,
    });

    if (budget) {
      // Revalidate paths
      revalidatePath('/budgets');
      revalidatePath('/dashboard');

      // Invalidate budget cache
      revalidateTag(CACHE_TAGS.USER_BUDGETS(input.user_id), 'max');
      revalidateTag(CACHE_TAGS.BUDGETS, 'max'); // Global budgets tag if used
      revalidateTag(`user:${input.user_id}:budgets`, 'max'); // Legacy tag support

      return { data: serialize(budget) as unknown as Budget, error: null };
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
 * Wraps BudgetRepository.update for client component usage
 * Validates permissions: members can only update their own budgets
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
    const existingBudget = await BudgetRepository.getById(id);

    if (!existingBudget) {
      return { data: null, error: 'Budget non trovato' };
    }

    // Verify budget has a user_id
    if (!existingBudget.user_id) {
      return {
        data: null,
        error: 'Il budget non ha un utente assegnato'
      };
    }

    // Permission validation: verify access to existing budget
    if (!canAccessUserData(currentUser as unknown as User, existingBudget.user_id)) {
      return {
        data: null,
        error: 'Non hai i permessi per modificare questo budget'
      };
    }

    // If changing user_id, verify permission for new user
    if (input.user_id && input.user_id !== existingBudget.user_id) {
      if (isMember(currentUser as unknown as User)) {
        return {
          data: null,
          error: 'Non puoi assegnare il budget a un altro utente'
        };
      }

      if (!canAccessUserData(currentUser as unknown as User, input.user_id)) {
        return {
          data: null,
          error: 'Non hai i permessi per assegnare questo budget a questo utente'
        };
      }
    }

    // Input Validation for updates
    if (input.description !== undefined && input.description.trim() === '') {
      return { data: null, error: 'Description cannot be empty' };
    }
    if (input.description !== undefined && input.description.trim().length < 2) {
      return { data: null, error: 'Description must be at least 2 characters' };
    }
    if (input.amount !== undefined && input.amount <= 0) {
      return { data: null, error: 'Amount must be greater than zero' };
    }
    if (input.type !== undefined && !['monthly', 'annually'].includes(input.type)) {
      return { data: null, error: 'Invalid budget type' };
    }
    if (input.categories !== undefined && input.categories.length === 0) {
      return { data: null, error: 'At least one category is required' };
    }

    const budget = await BudgetRepository.update(id, {
      description: input.description?.trim(),
      amount: input.amount,
      type: input.type,
      icon: input.icon,
      categories: input.categories,
      user_id: input.user_id,
      group_id: input.group_id
    });

    if (budget) {
      // Revalidate paths
      revalidatePath('/budgets');
      revalidatePath('/dashboard');

      // Invalidate cache for old user
      revalidateTag(CACHE_TAGS.USER_BUDGETS(existingBudget.user_id), 'max');
      revalidateTag(CACHE_TAGS.BUDGET(id), 'max');
      revalidateTag(`user:${existingBudget.user_id}:budgets`, 'max');

      // If user_id changed, invalidate cache for new user too
      if (input.user_id && input.user_id !== existingBudget.user_id) {
        revalidateTag(CACHE_TAGS.USER_BUDGETS(input.user_id), 'max');
        revalidateTag(`user:${input.user_id}:budgets`, 'max');
      }

      return { data: serialize(budget) as unknown as Budget, error: null };
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
 * Wraps BudgetRepository.delete for client component usage
 * Validates permissions: members can only delete their own budgets
 */
export async function deleteBudgetAction(
  id: string
): Promise<ServiceResult<{ id: string }>> {
  try {
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: 'Non autenticato. Effettua il login per continuare.' };
    }

    // Get existing budget to verify ownership
    const existingBudget = await BudgetRepository.getById(id);
    if (!existingBudget) {
      return { data: null, error: 'Budget non trovato' };
    }

    // Verify budget has a user_id
    if (!existingBudget.user_id) {
      return {
        data: null,
        error: 'Il budget non ha un utente assegnato'
      };
    }

    // Permission validation: verify access to budget
    if (!canAccessUserData(currentUser as unknown as User, existingBudget.user_id)) {
      return {
        data: null,
        error: 'Non hai i permessi per eliminare questo budget'
      };
    }

    const result = await BudgetRepository.delete(id);

    if (result) {
      // Revalidate paths
      revalidatePath('/budgets');
      revalidatePath('/dashboard');

      // Invalidate budget cache
      revalidateTag(CACHE_TAGS.USER_BUDGETS(existingBudget.user_id), 'max');
      revalidateTag(CACHE_TAGS.BUDGET(id), 'max');
      revalidateTag(`user:${existingBudget.user_id}:budgets`, 'max');

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
