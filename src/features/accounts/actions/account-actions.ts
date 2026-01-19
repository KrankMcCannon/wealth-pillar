"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { CreateAccountInput, UpdateAccountInput } from "@/server/services";
import { UserService } from "@/server/services";
import { Account, User } from "@/lib/types";
import { AccountRepository } from "@/server/dal";
import { auth } from "@clerk/nextjs/server";
import { canAccessUserData } from "@/lib/utils/permissions";
import { CACHE_TAGS } from "@/lib/cache/config";

export type ServiceResult<T> = {
    data: T | null;
    error: string | null;
};

/**
 * Creates a new account
 */
export async function createAccountAction(
    input: CreateAccountInput,
    isDefault: boolean = false
): Promise<ServiceResult<Account>> {
    try {
        // Authentication check
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return { data: null, error: "Non autenticato. Effettua il login per continuare." };
        }

        // Get current user
        const currentUser = await UserService.getLoggedUserInfo(clerkId);
        if (!currentUser) {
            return { data: null, error: "Utente non trovato" };
        }

        // Validate permissions (e.g., creating account for user in same group)
        // Check if current user has access to all target users
        for (const userId of input.user_ids) {
            if (!canAccessUserData(currentUser as unknown as User, userId)) {
                return { data: null, error: "Non hai i permessi per creare un account per questo utente" };
            }
        }

        // Input Validation
        if (!input.name || input.name.trim() === '') return { data: null, error: 'Nome account obbligatorio' };
        if (!input.type) return { data: null, error: 'Tipo account obbligatorio' };
        if (!input.group_id) return { data: null, error: 'Gruppo obbligatorio' };
        if (!input.user_ids || input.user_ids.length === 0) return { data: null, error: 'Almeno un utente è richiesto' };

        const account = await AccountRepository.create({
            id: input.id,
            name: input.name.trim(),
            type: input.type,
            user_ids: input.user_ids,
            group_id: input.group_id,
        });

        if (!account) {
            return { data: null, error: "Failed to create account" };
        }

        // Handle default account setting
        if (isDefault && input.user_ids.length === 1) {
            const userId = input.user_ids[0];
            await UserService.setDefaultAccount(userId, account.id);
        }

        // Revalidate paths
        revalidatePath("/accounts");
        revalidatePath("/dashboard");

        // Invalidate caches
        revalidateTag(CACHE_TAGS.ACCOUNTS, 'max');
        revalidateTag(CACHE_TAGS.ACCOUNT(account.id), 'max');
        revalidateTag(`group:${input.group_id}:accounts`, 'max');
        input.user_ids.forEach((userId: string) => revalidateTag(`user:${userId}:accounts`, 'max'));

        return { data: account as unknown as Account, error: null };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error.message : "Failed to create account" };
    }
}

/**
 * Updates an existing account
 */
export async function updateAccountAction(
    accountId: string,
    input: UpdateAccountInput,
    isDefault: boolean = false
): Promise<ServiceResult<Account>> {
    try {
        // Authentication check
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return { data: null, error: "Non autenticato." };
        }

        // Get current user
        const currentUser = await UserService.getLoggedUserInfo(clerkId);
        if (!currentUser) {
            return { data: null, error: "Utente non trovato" };
        }

        // Get existing account to verify ownership
        const existingAccount = await AccountRepository.getById(accountId);
        if (!existingAccount) {
            return { data: null, error: "Account non trovato" };
        }

        // Validate permissions: Current user must be in the group of the account OR be one of the account users (if logic allows)
        // Usually accounts stick to a group.
        if (currentUser.group_id !== existingAccount.group_id) {
            // Admin check? Assuming group isolation for now strictly?
            // Or verify explicit access
            // Simplest check: Must be in same group
            return { data: null, error: "Non hai i permessi per modificare questo account" };
        }

        // Input validation for updates
        if (input.name !== undefined && input.name.trim() === '') return { data: null, error: 'Nome account non può essere vuoto' };
        if (input.user_ids !== undefined && input.user_ids.length === 0) return { data: null, error: 'Almeno un utente è richiesto' };

        const account = await AccountRepository.update(accountId, {
            name: input.name?.trim(),
            type: input.type,
            user_ids: input.user_ids,
            group_id: input.group_id
        });

        if (!account) {
            return { data: null, error: "Failed to update account" };
        }

        // Handle default account setting
        if (input.user_ids?.length === 1 || (!input.user_ids && existingAccount.user_ids.length === 1)) {
            const userId = input.user_ids ? input.user_ids[0] : existingAccount.user_ids[0];
            if (isDefault) {
                await UserService.setDefaultAccount(userId, accountId);
            }
        }

        revalidatePath("/accounts");
        revalidatePath("/dashboard");

        // Invalidate caches
        revalidateTag(CACHE_TAGS.ACCOUNTS, 'max');
        revalidateTag(CACHE_TAGS.ACCOUNT(accountId), 'max');

        // Revalidate group
        const groupId = input.group_id || existingAccount.group_id;
        revalidateTag(`group:${groupId}:accounts`, 'max');

        // Revalidate users (both old and new to be safe)
        const userIds = new Set([...existingAccount.user_ids, ...(input.user_ids || [])]);
        userIds.forEach((userId: string) => revalidateTag(`user:${userId}:accounts`, 'max'));

        return { data: account as unknown as Account, error: null };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error.message : "Failed to update account" };
    }
}

/**
 * Deletes an account
 */
export async function deleteAccountAction(
    accountId: string
): Promise<ServiceResult<boolean>> {
    try {
        // Authentication check
        const { userId: clerkId } = await auth();
        if (!clerkId) {
            return { data: null, error: "Non autenticato." };
        }

        const currentUser = await UserService.getLoggedUserInfo(clerkId);
        if (!currentUser) {
            return { data: null, error: "Utente non trovato" };
        }

        const existingAccount = await AccountRepository.getById(accountId);
        if (!existingAccount) {
            return { data: null, error: "Account non trovato" };
        }

        if (currentUser.group_id !== existingAccount.group_id) {
            return { data: null, error: "Non hai i permessi per eliminare questo account" };
        }

        const result = await AccountRepository.delete(accountId);

        if (!result) {
            return { data: null, error: "Failed to delete account" };
        }

        revalidatePath("/accounts");
        revalidatePath("/dashboard");

        // Invalidate caches
        revalidateTag(CACHE_TAGS.ACCOUNTS, 'max');
        revalidateTag(CACHE_TAGS.ACCOUNT(accountId), 'max');
        revalidateTag(`group:${existingAccount.group_id}:accounts`, 'max');
        existingAccount.user_ids.forEach((userId: string) => revalidateTag(`user:${userId}:accounts`, 'max'));

        return { data: true, error: null };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error.message : "Failed to delete account" };
    }
}
