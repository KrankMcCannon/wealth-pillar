"use server";

import { CACHE_TAGS } from '@/lib/cache/config';
import { AccountService, BudgetService, UserService, GroupService } from '@/server/services';
import { revalidateTag } from 'next/cache';
import type { CompleteOnboardingInput } from './types';
import { clerkClient } from '@clerk/nextjs/server';
import { randomUUID } from 'node:crypto';
import type { Database } from '@/lib/types/database.types';

type UserInsert = Database['public']['Tables']['users']['Insert'];
type GroupInsert = Database['public']['Tables']['groups']['Insert'];

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

/**
 * Completes the onboarding flow by creating the user, group, accounts and budgets.
 */
export async function completeOnboardingAction(
  input: CompleteOnboardingInput
): Promise<ServiceResult<{ userId: string; groupId: string }>> {
  try {
    const { user, group, accounts, budgets, budgetStartDay } = input;

    if (!user?.clerkId || !user.email || !user.name) {
      return { data: null, error: 'Dati utente mancanti per l\'onboarding' };
    }

    if (!group?.name?.trim()) {
      return { data: null, error: 'Il nome del gruppo è obbligatorio' };
    }

    if (!accounts || accounts.length === 0) {
      return { data: null, error: 'Aggiungi almeno un conto bancario' };
    }

    if (!budgets || budgets.length === 0) {
      return { data: null, error: 'Aggiungi almeno un budget' };
    }

    // Check if user already exists
    const existingUser = await UserService.userExistsByClerkId(user.clerkId);
    if (existingUser) {
      return {
        data: null,
        error: 'L\'utente risulta già configurato. Aggiorna la pagina per accedere alla dashboard.',
      };
    }

    const userId = randomUUID();
    const groupId = randomUUID();

    // Create Group
    const groupData: GroupInsert = {
      id: groupId,
      name: group.name.trim(),
      description: group.description?.trim() || '',
      user_ids: [userId],
      is_active: true,
      plan: { name: "Piano Gratuito", type: "free" },
    };

    // Use GroupService to create group
    const createdGroup = await GroupService.createGroup({
      id: groupId,
      name: groupData.name,
      description: groupData.description || undefined,
      userIds: groupData.user_ids as string[],
      plan: groupData.plan as Record<string, unknown>,
      isActive: groupData.is_active
    });

    if (!createdGroup) {
      return { data: null, error: 'Errore durante la creazione del gruppo' };
    }

    const themeColor = '#6366F1';

    // Create User
    const userData: UserInsert = {
      id: userId,
      name: user.name.trim(),
      email: user.email.trim().toLowerCase(),
      avatar: getInitials(user.name),
      theme_color: themeColor,
      budget_start_date: budgetStartDay,
      group_id: groupId,
      role: 'admin',
      clerk_id: user.clerkId,
      budget_periods: [],
    };

    const createdUser = await UserService.create(userData);

    if (!createdUser) {
      return {
        data: null,
        error: 'Errore durante la creazione del profilo utente',
      };
    }

    // Revalidate caches
    revalidateTag(CACHE_TAGS.USERS, 'max');
    revalidateTag(CACHE_TAGS.USER(userId), 'max');
    revalidateTag(CACHE_TAGS.USER_BY_CLERK(user.clerkId), 'max');

    // Track created account IDs and default account
    let defaultAccountId: string | null = null;
    const createdAccountIds: string[] = [];

    // Create Accounts
    for (const accountInput of accounts) {
      const accountId = randomUUID();

      const createdAccount = await AccountService.createAccount({
        id: accountId,
        name: accountInput.name.trim(),
        type: accountInput.type,
        user_ids: [userId],
        group_id: groupId,
      });

      if (!createdAccount) {
        return { data: null, error: "Failed to create account" };
      }

      createdAccountIds.push(accountId);

      if (accountInput.isDefault) {
        defaultAccountId = accountId;
      }
    }

    // Fallback: if no default specified, use first account
    if (!defaultAccountId && createdAccountIds.length > 0) {
      defaultAccountId = createdAccountIds[0];
    }

    // Set default account on user
    if (defaultAccountId) {
      // Type assertion needed because default_account_id may not be in generated types yet
      await UserService.update(userId, { default_account_id: defaultAccountId } as { default_account_id: string });
    }

    // Create Budgets
    for (const budgetInput of budgets) {
      const createdBudget = await BudgetService.createBudget({
        description: budgetInput.description.trim(),
        amount: budgetInput.amount,
        type: budgetInput.type,
        categories: budgetInput.categories,
        user_id: userId,
        group_id: groupId,
      });

      if (!createdBudget) {
        return { data: null, error: "Failed to create budget" };
      }
    }

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
