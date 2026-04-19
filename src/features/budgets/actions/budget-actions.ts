'use server';

import { revalidateBudgetRelatedPaths } from '@/lib/cache/revalidation-paths';
import { getTranslations } from 'next-intl/server';

import { getCurrentUser } from '@/lib/auth/cached-auth';
import type { CreateBudgetInput } from '@/server/use-cases/budgets/types';
import { canAccessUserData, isMember } from '@/lib/utils';
import type { Budget, User } from '@/lib/types';
import { createBudgetUseCase } from '@/server/use-cases/budgets/create-budget.use-case';
import { updateBudgetUseCase } from '@/server/use-cases/budgets/update-budget.use-case';
import { deleteBudgetUseCase } from '@/server/use-cases/budgets/delete-budget.use-case';
import { getBudgetByIdUseCase } from '@/server/use-cases/budgets/get-budgets.use-case';

import type { ServiceResult } from '@/lib/types/service-result';

async function getBudgetsActionTranslator(locale?: string) {
  if (locale) {
    return getTranslations({ locale, namespace: 'Budgets.Actions' });
  }
  return getTranslations('Budgets.Actions');
}

/**
 * Server Action: Create Budget
 * Wrapper for BudgetService.createBudget with additional validation
 */
export async function createBudgetAction(
  input: CreateBudgetInput,
  locale?: string
): Promise<ServiceResult<Budget>> {
  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  try {
    t = await getBudgetsActionTranslator(locale);
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: t('errors.unauthenticated') };
    }

    // Permission validation: members can only create for themselves
    if (isMember(currentUser as unknown as User) && input.user_id !== currentUser.id) {
      return {
        data: null,
        error: t('errors.noPermissionCreateOthers'),
      };
    }

    // Verify user_id is provided
    if (!input.user_id) {
      return {
        data: null,
        error: t('errors.userRequired'),
      };
    }

    // Admins can create for anyone, but verify target user exists
    if (!canAccessUserData(currentUser as unknown as User, input.user_id)) {
      return {
        data: null,
        error: t('errors.noPermissionUserData'),
      };
    }

    // Resolve group_id (BudgetService handles default logic but we can do it here explicitly if needed)
    // BudgetService.createBudget handles permission/group resolution too, but we keep this action as a wrapper
    // Actually, let's delegate to service which now has robust validation

    // We can just call createBudgetUseCase - it handles validation.
    // However, the action is responsible for revalidating paths that might not be known to service (though service does tags)

    const budget = await createBudgetUseCase(input);

    if (budget) {
      revalidateBudgetRelatedPaths();

      return { data: budget, error: null };
    }

    return { data: null, error: t('errors.createFailed') };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : (t?.('errors.createFailed') ?? 'Failed to create budget'),
    };
  }
}

/**
 * Server Action: Update Budget
 */
export async function updateBudgetAction(
  id: string,
  input: Partial<CreateBudgetInput>,
  locale?: string
): Promise<ServiceResult<Budget>> {
  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  try {
    t = await getBudgetsActionTranslator(locale);
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: t('errors.unauthenticated') };
    }

    // Get existing budget to verify ownership
    const existingBudget = await getBudgetByIdUseCase(id);

    // Verify budget has a user_id
    if (!existingBudget || !existingBudget.user_id) {
      return {
        data: null,
        error: t('errors.userMissing'),
      };
    }

    // Permission validation: verify access to existing budget
    if (!canAccessUserData(currentUser as unknown as User, existingBudget.user_id)) {
      return {
        data: null,
        error: t('errors.noPermissionUpdate'),
      };
    }

    // If changing user_id, verify permission for new user
    if (input.user_id && input.user_id !== existingBudget.user_id) {
      if (isMember(currentUser as unknown as User)) {
        return {
          data: null,
          error: t('errors.cannotReassignAsMember'),
        };
      }

      if (!canAccessUserData(currentUser as unknown as User, input.user_id)) {
        return {
          data: null,
          error: t('errors.noPermissionAssignUser'),
        };
      }
    }

    const budget = await updateBudgetUseCase(id, input);

    if (budget) {
      revalidateBudgetRelatedPaths();

      return { data: budget, error: null };
    }

    return { data: null, error: t('errors.updateFailed') };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : (t?.('errors.updateFailed') ?? 'Failed to update budget'),
    };
  }
}

/**
 * Server Action: Delete Budget
 */
export async function deleteBudgetAction(
  id: string,
  locale?: string
): Promise<ServiceResult<{ id: string }>> {
  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  try {
    t = await getBudgetsActionTranslator(locale);
    // Authentication check (cached per request)
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: t('errors.unauthenticated') };
    }

    // Get existing budget to verify ownership
    const existingBudget = await getBudgetByIdUseCase(id);

    // Verify budget has a user_id
    if (!existingBudget || !existingBudget.user_id) {
      return {
        data: null,
        error: t('errors.userMissing'),
      };
    }

    // Permission validation: verify access to budget
    if (!canAccessUserData(currentUser as unknown as User, existingBudget.user_id)) {
      return {
        data: null,
        error: t('errors.noPermissionDelete'),
      };
    }

    const result = await deleteBudgetUseCase(id);

    if (result) {
      revalidateBudgetRelatedPaths();

      return { data: { id }, error: null };
    }

    return { data: null, error: t('errors.deleteFailed') };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : (t?.('errors.deleteFailed') ?? 'Failed to delete budget'),
    };
  }
}
