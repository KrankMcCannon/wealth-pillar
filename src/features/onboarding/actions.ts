'use server';

import { CACHE_TAGS } from '@/lib/cache/config';
import { AccountService, BudgetService, UserService, GroupService } from '@/server/services';
import { revalidateTag } from 'next/cache';
import type { CompleteOnboardingInput } from './types';
import { clerkClient } from '@clerk/nextjs/server';
import { randomUUID } from 'node:crypto';

/**
 * Service Result type
 */
type ServiceResult<T> = {
  data: T | null;
  error: string | null;
};

function getInitials(name: string) {
  const parts = name.trim().split(' ').filter(Boolean);
  if (parts.length === 0) return 'WP';
  if (parts.length === 1) return parts[0][0]?.toUpperCase() ?? 'W';
  const lastPart = parts.at(-1);
  return `${parts[0][0] ?? ''}${lastPart?.[0] ?? ''}`.toUpperCase();
}

// Helper: Validate onboarding input
function validateOnboardingInput(input: CompleteOnboardingInput): string | null {
  const { user, group, accounts, budgets } = input;
  if (!user?.clerkId || !user.email || !user.name) return "Dati utente mancanti per l'onboarding";
  if (!group?.name?.trim()) return 'Il nome del gruppo è obbligatorio';
  if (!accounts || accounts.length === 0) return 'Aggiungi almeno un conto bancario';
  if (!budgets || budgets.length === 0) return 'Aggiungi almeno un budget';
  return null;
}

const ONBOARDING_ERROR_MESSAGE = 'Configurazione non completata, riprova.';

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
    await UserService.deleteUser(userId);
  } catch (rollbackErr) {
    console.error('[completeOnboardingAction] Rollback deleteUser failed:', rollbackErr);
  }
  try {
    await GroupService.deleteGroup(groupId);
  } catch (rollbackErr) {
    console.error('[completeOnboardingAction] Rollback deleteGroup failed:', rollbackErr);
  }
}

// Helper: Create accounts
async function createOnboardingAccounts(
  accounts: CompleteOnboardingInput['accounts'],
  userId: string,
  groupId: string
): Promise<{ defaultAccountId: string | null; createdAccountIds: string[]; error: string | null }> {
  let defaultAccountId: string | null = null;
  const createdAccountIds: string[] = [];

  for (const accountInput of accounts) {
    const accountId = randomUUID();
    const createdAccount = await AccountService.createAccount({
      id: accountId,
      name: accountInput.name.trim(),
      type: accountInput.type,
      user_ids: [userId],
      group_id: groupId,
    });

    if (!createdAccount)
      return { defaultAccountId: null, createdAccountIds, error: 'Failed to create account' };

    createdAccountIds.push(accountId);
    if (accountInput.isDefault) defaultAccountId = accountId;
  }

  if (!defaultAccountId && createdAccountIds.length > 0) {
    defaultAccountId = createdAccountIds[0];
  }

  return { defaultAccountId, createdAccountIds, error: null };
}

// Helper: Create budgets
async function createOnboardingBudgets(
  budgets: CompleteOnboardingInput['budgets'],
  userId: string,
  groupId: string
): Promise<string | null> {
  for (const budgetInput of budgets) {
    const createdBudget = await BudgetService.createBudget({
      description: budgetInput.description.trim(),
      amount: budgetInput.amount,
      type: budgetInput.type,
      categories: budgetInput.categories,
      user_id: userId,
      group_id: groupId,
    });

    if (!createdBudget) return 'Failed to create budget';
  }
  return null;
}

/**
 * Completes the onboarding flow by creating the user, group, accounts and budgets.
 * On any failure after group/user creation, rolls back so no partial state persists (atomic).
 */
export async function completeOnboardingAction(
  input: CompleteOnboardingInput
): Promise<ServiceResult<{ userId: string; groupId: string }>> {
  const { user, group, accounts, budgets, budgetStartDay } = input;

  const validationError = validateOnboardingInput(input);
  if (validationError) return { data: null, error: validationError };

  const existingUser = await UserService.userExistsByClerkId(user.clerkId);
  if (existingUser) {
    return {
      data: null,
      error: "L'utente risulta già configurato. Aggiorna la pagina per accedere alla dashboard.",
    };
  }

  const userId = randomUUID();
  const groupId = randomUUID();

  try {
    // Phase 1: Group + User
    const createdGroup = await GroupService.createGroup({
      id: groupId,
      name: group.name.trim(),
      description: group.description?.trim() || undefined,
      userIds: [userId],
      plan: { name: 'Piano Gratuito', type: 'free' },
      isActive: true,
    });

    if (!createdGroup) {
      return { data: null, error: ONBOARDING_ERROR_MESSAGE };
    }

    const createdUser = await UserService.create({
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
      return { data: null, error: ONBOARDING_ERROR_MESSAGE };
    }

    revalidateTag(CACHE_TAGS.USERS, 'max');
    revalidateTag(CACHE_TAGS.USER(userId), 'max');
    revalidateTag(CACHE_TAGS.USER_BY_CLERK(user.clerkId), 'max');

    // Phase 2: Accounts
    const {
      defaultAccountId,
      createdAccountIds,
      error: accountError,
    } = await createOnboardingAccounts(accounts, userId, groupId);
    if (accountError) {
      logOnboardingFailure(
        'accounts',
        { groupId, userId, accountIds: createdAccountIds },
        user.clerkId,
        accountError
      );
      await rollbackOnboarding(userId, groupId);
      return { data: null, error: ONBOARDING_ERROR_MESSAGE };
    }

    // Phase 3: Default account
    if (defaultAccountId) {
      try {
        await UserService.update(userId, { default_account_id: defaultAccountId } as {
          default_account_id: string;
        });
      } catch (err) {
        logOnboardingFailure(
          'default_account',
          { groupId, userId, accountIds: createdAccountIds },
          user.clerkId,
          err
        );
        await rollbackOnboarding(userId, groupId);
        return { data: null, error: ONBOARDING_ERROR_MESSAGE };
      }
    }

    // Phase 4: Budgets
    const budgetError = await createOnboardingBudgets(budgets, userId, groupId);
    if (budgetError) {
      logOnboardingFailure(
        'budgets',
        { groupId, userId, accountIds: createdAccountIds },
        user.clerkId,
        budgetError
      );
      await rollbackOnboarding(userId, groupId);
      return { data: null, error: ONBOARDING_ERROR_MESSAGE };
    }

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
      error: ONBOARDING_ERROR_MESSAGE,
    };
  }
}

const DELETE_CLERK_RETRY_DELAYS_MS = [500, 1000, 2000];
const MAX_DELETE_CLERK_ATTEMPTS = 3;

/**
 * Deletes a Clerk user - used for rollback when onboarding fails.
 * Retries up to 3 times with backoff (500ms, 1s, 2s).
 */
export async function deleteClerkUserAction(clerkUserId: string): Promise<ServiceResult<void>> {
  if (!clerkUserId) {
    return { data: null, error: 'ID utente Clerk mancante' };
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

  return {
    data: null,
    error:
      lastError instanceof Error
        ? lastError.message
        : "Errore durante l'eliminazione dell'utente Clerk",
  };
}

/**
 * Registers an orphan Clerk user (Clerk account without Supabase profile) for manual remediation.
 * Call when onboarding fails and deleteClerkUserAction has failed after retries.
 */
export async function registerOrphanUserAction(clerkId: string): Promise<ServiceResult<void>> {
  try {
    const { supabase } = await import('@/server/db/supabase');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- orphan_users table added via migration; types may lag
    const { error } = await supabase.from('orphan_users').insert({ clerk_id: clerkId } as any);

    if (error) {
      console.error('[registerOrphanUserAction] Insert failed:', error);
      return { data: null, error: error.message };
    }
    return { data: undefined, error: null };
  } catch (err) {
    console.error('[registerOrphanUserAction] Error:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to register orphan user',
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
  clerkId: string
): Promise<ServiceResult<{ exists: boolean; userId?: string }>> {
  if (!clerkId) {
    return { data: null, error: 'Clerk ID mancante' };
  }

  let lastErrorType: 'timeout' | 'not_found' | 'unknown' = 'unknown';

  for (let attempt = 1; attempt <= MAX_CHECK_USER_ATTEMPTS; attempt++) {
    try {
      const user = await UserService.getLoggedUserInfo(clerkId);
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
    lastErrorType === 'timeout'
      ? 'Errore temporaneo. Riprova tra poco.'
      : 'Errore di verifica account. Riprova o torna al login.';

  return {
    data: null,
    error: userFacingMessage,
  };
}
