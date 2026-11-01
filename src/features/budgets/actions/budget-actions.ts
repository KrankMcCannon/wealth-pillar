'use server';

import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { runAuthorizedMutation } from '@/lib/server-action/run-authorized-mutation';

import { getCurrentUser } from '@/lib/auth/cached-auth';
import type { CreateBudgetInput } from '@/server/use-cases/budgets/types';
import { AccessScope } from '@/lib/permissions/access-scope';
import { FinancialResourcePolicy } from '@/server/permissions/financial-resource-policy';
import { isMember } from '@/lib/utils';
import type { Budget } from '@/lib/types';
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
    if (isMember(currentUser) && input.user_id !== currentUser.id) {
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

    if (!AccessScope.for(currentUser).canViewUser(input.user_id)) {
      return {
        data: null,
        error: t('errors.noPermissionUserData'),
      };
    }

    const policy = new FinancialResourcePolicy(currentUser);
    await policy.assertUsers([input.user_id]);
    const budget = await createBudgetUseCase({ ...input, group_id: policy.groupId });

    if (budget) {
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
    const policy = new FinancialResourcePolicy(currentUser);
    const existingBudget = await getBudgetByIdUseCase(id, policy.resourceScope);
    policy.assertGroup(existingBudget.group_id);
    if (input.group_id !== undefined) policy.assertGroup(input.group_id);

    // Verify budget has a user_id
    if (!existingBudget || !existingBudget.user_id) {
      return {
        data: null,
        error: t('errors.userMissing'),
      };
    }

    const scope = AccessScope.for(currentUser);
    if (!scope.canViewOwned(existingBudget)) {
      return {
        data: null,
        error: t('errors.noPermissionUpdate'),
      };
    }

    if (input.user_id && input.user_id !== existingBudget.user_id) {
      if (isMember(currentUser)) {
        return {
          data: null,
          error: t('errors.cannotReassignAsMember'),
        };
      }

      if (!scope.canViewUser(input.user_id)) {
        return {
          data: null,
          error: t('errors.noPermissionAssignUser'),
        };
      }
    }

    await policy.assertUsers([input.user_id ?? existingBudget.user_id]);
    const budget = await updateBudgetUseCase(id, input, policy.resourceScope);

    if (budget) {
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

export async function getBudgetByIdAction(
  id: string,
  locale?: string
): Promise<ServiceResult<Budget>> {
  const t = await getBudgetsActionTranslator(locale);
  try {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: t('errors.unauthenticated') };
    }

    const policy = new FinancialResourcePolicy(currentUser);
    const budget = await getBudgetByIdUseCase(id, policy.resourceScope);
    policy.assertGroup(budget.group_id);
    if (!budget?.user_id) {
      return { data: null, error: t('errors.notFound') };
    }

    if (!AccessScope.for(currentUser).canViewOwned(budget)) {
      return { data: null, error: t('errors.permissionDenied') };
    }

    return { data: budget, error: null };
  } catch (error) {
    return {
      data: null,
      error: error instanceof Error ? error.message : t('errors.loadFailed'),
    };
  }
}

/**
 * Server Action: Delete Budget
 */
export async function deleteBudgetAction(
  id: string,
  locale?: string,
  returnToList = false
): Promise<ServiceResult<{ id: string }>> {
  const t = await getBudgetsActionTranslator(locale);
  let ownerId: string | undefined;
  const result = await runAuthorizedMutation({
    unauthenticatedError: t('errors.unauthenticated'),
    authorize: async (currentUser) => {
      const policy = new FinancialResourcePolicy(currentUser);
      const existingBudget = await getBudgetByIdUseCase(id, policy.resourceScope);
      policy.assertGroup(existingBudget.group_id);
      if (!existingBudget?.user_id) {
        return { data: null, error: t('errors.userMissing') };
      }
      if (!AccessScope.for(currentUser).canViewOwned(existingBudget)) {
        return { data: null, error: t('errors.noPermissionDelete') };
      }
      ownerId = existingBudget.user_id;
      return null;
    },
    mutate: async (currentUser) => {
      const policy = new FinancialResourcePolicy(currentUser);
      const result = await deleteBudgetUseCase(id, policy.resourceScope);
      if (!result) {
        throw new Error(t('errors.deleteFailed'));
      }
      return { id };
    },
    formatError: (error) => (error instanceof Error ? error.message : t('errors.deleteFailed')),
  });
  if (result.data && returnToList && ownerId)
    redirect(`/${locale === 'en' ? 'en' : 'it'}/budgets?user=${encodeURIComponent(ownerId)}`);
  return result;
}
