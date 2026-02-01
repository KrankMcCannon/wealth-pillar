"use server";

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
  if (!user?.clerkId || !user.email || !user.name) return 'Dati utente mancanti per l\'onboarding';
  if (!group?.name?.trim()) return 'Il nome del gruppo è obbligatorio';
  if (!accounts || accounts.length === 0) return 'Aggiungi almeno un conto bancario';
  if (!budgets || budgets.length === 0) return 'Aggiungi almeno un budget';
  return null;
}

// Helper: Create accounts
async function createOnboardingAccounts(
  accounts: CompleteOnboardingInput['accounts'],
  userId: string,
  groupId: string
): Promise<{ defaultAccountId: string | null; error: string | null }> {
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

    if (!createdAccount) return { defaultAccountId: null, error: "Failed to create account" };

    createdAccountIds.push(accountId);
    if (accountInput.isDefault) defaultAccountId = accountId;
  }

  // Fallback: if no default specified, use first account
  if (!defaultAccountId && createdAccountIds.length > 0) {
    defaultAccountId = createdAccountIds[0];
  }

  return { defaultAccountId, error: null };
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

    if (!createdBudget) return "Failed to create budget";
  }
  return null;
}

/**
 * Completes the onboarding flow by creating the user, group, accounts and budgets.
 */
export async function completeOnboardingAction(
  input: CompleteOnboardingInput
): Promise<ServiceResult<{ userId: string; groupId: string }>> {
  try {
    const { user, group, accounts, budgets, budgetStartDay } = input;

    // 1. Validation
    const validationError = validateOnboardingInput(input);
    if (validationError) return { data: null, error: validationError };

    // 2. Check existing user
    const existingUser = await UserService.userExistsByClerkId(user.clerkId);
    if (existingUser) {
      return { data: null, error: 'L\'utente risulta già configurato. Aggiorna la pagina per accedere alla dashboard.' };
    }

    const userId = randomUUID();
    const groupId = randomUUID();

    // 3. Create Group
    const createdGroup = await GroupService.createGroup({
      id: groupId,
      name: group.name.trim(),
      description: group.description?.trim() || undefined,
      userIds: [userId],
      plan: { name: "Piano Gratuito", type: "free" },
      isActive: true
    });

    if (!createdGroup) return { data: null, error: 'Errore durante la creazione del gruppo' };

    // 4. Create User
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

    if (!createdUser) return { data: null, error: 'Errore durante la creazione del profilo utente' };

    // 5. Invalidate caches
    revalidateTag(CACHE_TAGS.USERS, 'max');
    revalidateTag(CACHE_TAGS.USER(userId), 'max');
    revalidateTag(CACHE_TAGS.USER_BY_CLERK(user.clerkId), 'max');

    // 6. Create Accounts
    const { defaultAccountId, error: accountError } = await createOnboardingAccounts(accounts, userId, groupId);
    if (accountError) return { data: null, error: accountError };

    // 7. Set default account
    if (defaultAccountId) {
      await UserService.update(userId, { default_account_id: defaultAccountId } as { default_account_id: string });
    }

    // 8. Create Budgets
    const budgetError = await createOnboardingBudgets(budgets, userId, groupId);
    if (budgetError) return { data: null, error: budgetError };

    return {
      data: { userId, groupId },
      error: null,
    };
  } catch (error) {
    console.error("[completeOnboardingAction] Error:", error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Errore durante il completamento dell\'onboarding',
    };
  }
}

/**
 * Deletes a Clerk user - used for rollback when onboarding fails
 */
export async function deleteClerkUserAction(clerkUserId: string): Promise<ServiceResult<void>> {
  try {
    if (!clerkUserId) {
      return { data: null, error: 'ID utente Clerk mancante' };
    }

    const client = await clerkClient();
    await client.users.deleteUser(clerkUserId);

    return { data: undefined, error: null };
  } catch (error) {
    console.error('Error deleting Clerk user:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Errore durante l\'eliminazione dell\'utente Clerk',
    };
  }
}

/**
 * Checks if a user exists in DB by Clerk ID
 * This is a server action safe for use in client components
 */
export async function checkUserExistsAction(
  clerkId: string
): Promise<ServiceResult<{ exists: boolean; userId?: string }>> {
  try {
    if (!clerkId) {
      return { data: null, error: 'Clerk ID mancante' };
    }

    const user = await UserService.getLoggedUserInfo(clerkId);

    return {
      data: {
        exists: !!user,
        userId: user ? user.id : undefined,
      },
      error: null,
    };
  } catch (error) {
    console.error('[checkUserExistsAction] Unexpected error:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Errore durante la verifica dell\'utente',
    };
  }
}
