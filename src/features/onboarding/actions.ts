'use server';

import { CACHE_TAGS } from '@/lib/cache';
import { supabaseServer } from '@/lib/database/server';
import type { Database } from '@/lib/database/types';
import { AccountService, BudgetService, GroupService, UserService } from '@/lib/services';
import type { ServiceResult } from '@/lib/services/user.service';
import { nowISO } from '@/lib/utils/date-utils';
import { clerkClient } from '@clerk/nextjs/server';
import { randomUUID } from 'node:crypto';
import type { CompleteOnboardingInput } from './types';

async function revalidateCacheTags(tags: string[]) {
  if (globalThis.window === undefined) {
    const { revalidateTag } = await import('next/cache');
    for (const tag of tags) {
      revalidateTag(tag);
    }
  }
}

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

    const alreadyExists = await UserService.userExistsByClerkId(user.clerkId);
    if (alreadyExists) {
      return {
        data: null,
        error: 'L\'utente risulta già configurato. Aggiorna la pagina per accedere alla dashboard.',
      };
    }

    const userId = randomUUID();
    const groupId = randomUUID();
    const now = nowISO();

    const groupResult = await GroupService.createGroup({
      id: groupId,
      name: group.name.trim(),
      description: group.description?.trim() || '',
      userIds: [userId],
    });

    if (groupResult.error || !groupResult.data) {
      return { data: null, error: groupResult.error || 'Errore durante la creazione del gruppo' };
    }

    const themeColor = '#6366F1';

    const newUser: Database['public']['Tables']['users']['Insert'] = {
      id: userId,
      name: user.name.trim(),
      email: user.email.trim().toLowerCase(),
      avatar: getInitials(user.name),
      theme_color: themeColor,
      budget_start_date: budgetStartDay,
      group_id: groupId,
      role: 'admin',
      budget_periods: [],
      clerk_id: user.clerkId,
      created_at: now,
      updated_at: now,
    };

    const { data: createdUser, error: userError } = await supabaseServer
      .from('users')
      .insert(newUser)
      .select()
      .single();

    if (userError || !createdUser) {
      return {
        data: null,
        error: userError?.message || 'Errore durante la creazione del profilo utente',
      };
    }

    await revalidateCacheTags([
      CACHE_TAGS.USERS,
      CACHE_TAGS.USER(userId),
      CACHE_TAGS.USER_BY_CLERK(user.clerkId),
    ]);

    // Track created account IDs and default account
    let defaultAccountId: string | null = null;
    const createdAccountIds: string[] = [];

    for (const accountInput of accounts) {
      // Generate account ID upfront so we can reference it
      const accountId = randomUUID();

      const result = await AccountService.createAccount({
        id: accountId,
        name: accountInput.name.trim(),
        type: accountInput.type,
        user_ids: [userId],
        group_id: groupId,
      });

      if (result.error) {
        return { data: null, error: result.error };
      }

      createdAccountIds.push(accountId);

      // Track which account is marked as default
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
      const setDefaultResult = await UserService.setDefaultAccount(userId, defaultAccountId);
      if (setDefaultResult.error) {
        console.error('[Onboarding] Failed to set default account:', setDefaultResult.error);
        // Non-blocking: don't fail entire onboarding
      }
    }

    for (const budgetInput of budgets) {
      const result = await BudgetService.createBudget({
        description: budgetInput.description.trim(),
        amount: budgetInput.amount,
        type: budgetInput.type,
        categories: budgetInput.categories,
        user_id: userId,
        group_id: groupId,
      });

      if (result.error) {
        return { data: null, error: result.error };
      }
    }

    return {
      data: { userId, groupId },
      error: null,
    };
  } catch (error) {
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
