'use server';

import { CACHE_TAGS } from '@/lib/cache/config';
import {
  createUserUseCase,
  updateUserUseCase,
  deleteUserUseCase,
  getUserByClerkIdUseCase,
} from '@/server/use-cases/users/user.use-cases';
import { createGroupUseCase, deleteGroupUseCase } from '@/server/use-cases/groups/groups.use-cases';
import { createAccountUseCase } from '@/server/use-cases/accounts/account.use-cases';
import { createBudgetUseCase } from '@/server/use-cases/budgets/create-budget.use-case';
import { revalidatePath, revalidateTag } from 'next/cache';
import { APP_ROUTE } from '@/lib/cache/revalidation-paths';
import type { CompleteOnboardingInput } from './types';
import { clerkClient } from '@clerk/nextjs/server';
import { randomUUID } from 'node:crypto';

import type { ServiceResult } from '@/lib/types/service-result';
import {
  getOnboardingActionTranslations,
  type OnboardingActionTranslator,
} from '@/features/onboarding/onboarding-action-i18n';

function getInitials(name: string) {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return 'WP';
  const first = parts[0];
  if (parts.length === 1) return first?.[0]?.toUpperCase() ?? 'W';
  const lastPart = parts.at(-1);
  return `${first?.[0] ?? ''}${lastPart?.[0] ?? ''}`.toUpperCase();
}

// Helper: Validate onboarding input (messaggi tramite namespace Onboarding.Actions)
function validateOnboardingInput(
  input: CompleteOnboardingInput,
  t: OnboardingActionTranslator
): string | null {
  const { user, group, accounts, budgets } = input;
  if (!user?.clerkId || !user.email || !user.name) return t('validation.userMissing');
  if (!group?.name?.trim()) return t('validation.groupNameRequired');
  if (!accounts || accounts.length === 0) return t('validation.accountsRequired');
  if (!budgets) return t('validation.budgetsInvalid');
  return null;
}

type OnboardingPhase = 'group' | 'user' | 'accounts' | 'default_account' | 'budgets';

function logOnboardingFailure(
  phase: OnboardingPhase,
  partial: { groupId?: string; userId?: string; accountIds?: string[] },
  clerkId: string,
  err: unknown
) {
  const message = err instanceof Error ? err.message : String(err);
  console.error(
    '[completeOnboardingAction] Failure:',
    JSON.stringify({
      phase,
      groupId: partial.groupId,
      userId: partial.userId,
      accountIds: partial.accountIds,
      clerkId,
      error: message,
      timestamp: new Date().toISOString(),
    })
  );
}

/**
 * Rollback: delete user (cascades to budgets, accounts for that user) then group.
 * Used when onboarding fails after group/user creation so no partial state persists.
 */
async function rollbackOnboarding(userId: string, groupId: string): Promise<void> {
  try {
    await deleteUserUseCase(userId);
  } catch (rollbackErr) {
    console.error('[completeOnboardingAction] Rollback deleteUser failed:', rollbackErr);
  }
  try {
    await deleteGroupUseCase(groupId);
  } catch (rollbackErr) {
    console.error('[completeOnboardingAction] Rollback deleteGroup failed:', rollbackErr);
  }
}

// Helper: Create accounts
async function createOnboardingAccounts(
  accounts: CompleteOnboardingInput['accounts'],
  userId: string,
  groupId: string,
  t: OnboardingActionTranslator
): Promise<{ defaultAccountId: string | null; createdAccountIds: string[]; error: string | null }> {
  let defaultAccountId: string | null = null;
  const createdAccountIds: string[] = [];

  for (const accountInput of accounts) {
    const accountId = randomUUID();
    const createdAccount = await createAccountUseCase({
      id: accountId,
      name: accountInput.name.trim(),
      type: accountInput.type,
      user_ids: [userId],
      group_id: groupId,
    });

    if (!createdAccount)
      return { defaultAccountId: null, createdAccountIds, error: t('createAccountFailed') };

    createdAccountIds.push(accountId);
    if (accountInput.isDefault) defaultAccountId = accountId;
  }

  if (!defaultAccountId && createdAccountIds.length > 0) {
    defaultAccountId = createdAccountIds[0] ?? null;
  }

  return { defaultAccountId, createdAccountIds, error: null };
}

// Helper: Create budgets
async function createOnboardingBudgets(
  budgets: CompleteOnboardingInput['budgets'],
  userId: string,
  groupId: string,
  t: OnboardingActionTranslator
): Promise<string | null> {
  for (const budgetInput of budgets) {
    const createdBudget = await createBudgetUseCase({
      description: budgetInput.description.trim(),
      amount: budgetInput.amount,
      type: budgetInput.type,
      categories: budgetInput.categories,
      user_id: userId,
      group_id: groupId,
    });

    if (!createdBudget) return t('createBudgetFailed');
  }
  return null;
}

/**
 * Completes the onboarding flow by creating the user, group, accounts and budgets.
 * On any failure after group/user creation, rolls back so no partial state persists (atomic).
 */
export async function completeOnboardingAction(
  input: CompleteOnboardingInput,
  locale?: string
): Promise<ServiceResult<{ userId: string; groupId: string }>> {
  const t = await getOnboardingActionTranslations(locale);
  const { user, group, accounts, budgets, budgetStartDay } = input;

  const validationError = validateOnboardingInput(input, t);
  if (validationError) return { data: null, error: validationError };

  const existingUser = await getUserByClerkIdUseCase(user.clerkId);
  if (existingUser) {
    return {
      data: null,
      error: t('alreadyConfigured'),
      errorCode: 'already_configured',
    };
  }

  const userId = randomUUID();
  const groupId = randomUUID();

  try {
    // Phase 1: Group + User
    const createdGroup = await createGroupUseCase({
      id: groupId,
      name: group.name.trim(),
      description: group.description?.trim() || '',
      userIds: [userId],
      plan: { name: 'Piano Gratuito', type: 'free' },
      isActive: true,
    });

    if (!createdGroup) {
      return { data: null, error: t('genericConfigurationFailed') };
    }

    const createdUser = await createUserUseCase({
      id: userId,
      name: user.name.trim(),
      email: user.email.trim().toLowerCase(),
      avatar: getInitials(user.name),
      theme_color: '#6366F1',
      budget_start_date: budgetStartDay,
      group_id: groupId,
      role: 'admin',
      clerk_id: user.clerkId,
      budget_periods: [],
    });

    if (!createdUser) {
      await rollbackOnboarding(userId, groupId);
      return { data: null, error: t('genericConfigurationFailed') };
    }

    revalidateTag(CACHE_TAGS.USERS, 'max');
    revalidateTag(CACHE_TAGS.USER(userId), 'max');
    revalidateTag(CACHE_TAGS.USER_BY_CLERK(user.clerkId), 'max');

    // Phase 2: Accounts
    const {
      defaultAccountId,
      createdAccountIds,
      error: accountError,
    } = await createOnboardingAccounts(accounts, userId, groupId, t);
    if (accountError) {
      logOnboardingFailure(
        'accounts',
        { groupId, userId, accountIds: createdAccountIds },
        user.clerkId,
        accountError
      );
      await rollbackOnboarding(userId, groupId);
      return { data: null, error: t('genericConfigurationFailed') };
    }

    // Phase 3: Default account
    if (defaultAccountId) {
      try {
        await updateUserUseCase(userId, { default_account_id: defaultAccountId });
      } catch (err) {
        logOnboardingFailure(
          'default_account',
          { groupId, userId, accountIds: createdAccountIds },
          user.clerkId,
          err
        );
        await rollbackOnboarding(userId, groupId);
        return { data: null, error: t('genericConfigurationFailed') };
      }
    }

    // Phase 4: Budgets
    const budgetError = await createOnboardingBudgets(budgets, userId, groupId, t);
    if (budgetError) {
      logOnboardingFailure(
        'budgets',
        { groupId, userId, accountIds: createdAccountIds },
        user.clerkId,
        budgetError
      );
      await rollbackOnboarding(userId, groupId);
      return { data: null, error: t('genericConfigurationFailed') };
    }

    revalidatePath(APP_ROUTE.home);

    return {
      data: { userId, groupId },
      error: null,
    };
  } catch (error) {
    logOnboardingFailure('user', { groupId, userId }, user.clerkId, error);
    try {
      await rollbackOnboarding(userId, groupId);
    } catch {
      // already logged in rollbackOnboarding
    }
    return {
      data: null,
      error: t('genericConfigurationFailed'),
    };
  }
}

const DELETE_CLERK_RETRY_DELAYS_MS = [500, 1000, 2000];
const MAX_DELETE_CLERK_ATTEMPTS = 3;

/**
 * Deletes a Clerk user - used for rollback when onboarding fails.
 * Retries up to 3 times with backoff (500ms, 1s, 2s).
 */
export async function deleteClerkUserAction(
  clerkUserId: string,
  locale?: string
): Promise<ServiceResult<void>> {
  const t = await getOnboardingActionTranslations(locale);
  if (!clerkUserId) {
    return { data: null, error: t('deleteClerk.missingId') };
  }

  let lastError: unknown = null;
  for (let attempt = 1; attempt <= MAX_DELETE_CLERK_ATTEMPTS; attempt++) {
    try {
      const client = await clerkClient();
      await client.users.deleteUser(clerkUserId);
      return { data: undefined, error: null };
    } catch (error) {
      lastError = error;
      console.error(
        '[deleteClerkUserAction] Attempt failed:',
        JSON.stringify({
          clerkUserId,
          attemptNumber: attempt,
          timestamp: new Date().toISOString(),
          message: error instanceof Error ? error.message : String(error),
        })
      );
      if (attempt < MAX_DELETE_CLERK_ATTEMPTS) {
        const delayMs = DELETE_CLERK_RETRY_DELAYS_MS[attempt - 1] ?? 2000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  console.error('[deleteClerkUserAction] All attempts failed:', lastError);

  return {
    data: null,
    error: t('deleteClerk.failed'),
  };
}

/**
 * Registers an orphan Clerk user (Clerk account without Supabase profile) for manual remediation.
 * Call when onboarding fails and deleteClerkUserAction has failed after retries.
 */
export async function registerOrphanUserAction(
  clerkId: string,
  locale?: string
): Promise<ServiceResult<void>> {
  const t = await getOnboardingActionTranslations(locale);
  try {
    const { supabase } = await import('@/server/db/supabase');
    // Orphan_users Insert is in database.types.ts; Supabase client infers insert as never for this table
    const { error } = await supabase.from('orphan_users').insert({ clerk_id: clerkId } as never);

    if (error) {
      console.error('[registerOrphanUserAction] Insert failed:', error);
      return { data: null, error: t('registerOrphan.failed') };
    }
    return { data: undefined, error: null };
  } catch (err) {
    console.error('[registerOrphanUserAction] Error:', err);
    return {
      data: null,
      error: t('registerOrphan.failed'),
    };
  }
}

const CHECK_USER_RETRY_DELAYS_MS = [500, 1000, 2000];
const MAX_CHECK_USER_ATTEMPTS = 3;

function isNotFoundError(message: string): boolean {
  return message.includes('User not found') || message.includes('not found');
}

function getErrorType(message: string): 'timeout' | 'not_found' | 'unknown' {
  const lower = message.toLowerCase();
  if (lower.includes('timeout') || lower.includes('timed out')) return 'timeout';
  if (isNotFoundError(message)) return 'not_found';
  return 'unknown';
}

/**
 * Checks if a user exists in DB by Clerk ID.
 * Uses retry with exponential backoff (500ms → 1s → 2s, max 3 attempts) for transient errors.
 * "Not found" is not retried; after 3 failures returns differentiated error message.
 */
export async function checkUserExistsAction(
  clerkId: string,
  locale?: string
): Promise<ServiceResult<{ exists: boolean; userId?: string | undefined }>> {
  const t = await getOnboardingActionTranslations(locale);
  if (!clerkId) {
    return { data: null, error: t('checkUser.missingClerkId') };
  }

  let lastErrorType: 'timeout' | 'not_found' | 'unknown' = 'unknown';

  for (let attempt = 1; attempt <= MAX_CHECK_USER_ATTEMPTS; attempt++) {
    try {
      const user = await getUserByClerkIdUseCase(clerkId);
      return {
        data: {
          exists: !!user,
          userId: user ? user.id : undefined,
        },
        error: null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      lastErrorType = getErrorType(message);

      // Not found: do not retry, allow onboarding
      if (isNotFoundError(message)) {
        return {
          data: { exists: false, userId: undefined },
          error: null,
        };
      }

      const logPayload = {
        userId: clerkId,
        attemptNumber: attempt,
        errorType: lastErrorType,
        timestamp: new Date().toISOString(),
        message,
      };
      console.error('[checkUserExistsAction] Attempt failed:', JSON.stringify(logPayload));

      if (attempt < MAX_CHECK_USER_ATTEMPTS) {
        const delayMs = CHECK_USER_RETRY_DELAYS_MS[attempt - 1] ?? 2000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }
  }

  // After 3 failures: differentiated message and final log
  const finalLog = {
    userId: clerkId,
    attemptNumber: MAX_CHECK_USER_ATTEMPTS,
    errorType: lastErrorType,
    timestamp: new Date().toISOString(),
  };
  console.error('[checkUserExistsAction] All attempts failed:', JSON.stringify(finalLog));

  const userFacingMessage =
    lastErrorType === 'timeout' ? t('checkUser.timeout') : t('checkUser.verificationFailed');

  return {
    data: null,
    error: userFacingMessage,
  };
}
