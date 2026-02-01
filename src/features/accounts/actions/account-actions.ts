"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth/cached-auth";
import { CreateAccountInput, UpdateAccountInput, UserService, AccountService } from "@/server/services";
import { Account, User } from "@/lib/types";
import { canAccessUserData } from "@/lib/utils/permissions";

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
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return { data: null, error: "Non autenticato. Effettua il login per continuare." };
        }

        for (const userId of input.user_ids) {
            if (!canAccessUserData(currentUser as unknown as User, userId)) {
                return { data: null, error: "Non hai i permessi per creare un account per questo utente" };
            }
        }

        if (!input.name?.trim()) return { data: null, error: 'Nome account obbligatorio' };
        if (!input.type) return { data: null, error: 'Tipo account obbligatorio' };
        if (!input.group_id) return { data: null, error: 'Gruppo obbligatorio' };
        if (!input.user_ids?.length) return { data: null, error: 'Almeno un utente è richiesto' };

        const account = await AccountService.createAccount(input);

        if (isDefault && input.user_ids.length === 1) {
            await UserService.setDefaultAccount(input.user_ids[0], account.id);
        }

        revalidatePath("/accounts");
        revalidatePath("/dashboard");

        return { data: account, error: null };
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
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return { data: null, error: "Non autenticato. Effettua il login per continuare." };
        }

        const existingAccount = await AccountService.getAccountById(accountId);

        if (currentUser.group_id !== existingAccount.group_id) {
            return { data: null, error: "Non hai i permessi per modificare questo account" };
        }

        if (input.name !== undefined && input.name.trim() === '') return { data: null, error: 'Nome account non può essere vuoto' };
        if (input.user_ids?.length === 0) return { data: null, error: 'Almeno un utente è richiesto' };

        const account = await AccountService.updateAccount(accountId, input);

        if (input.user_ids?.length === 1 || (!input.user_ids && existingAccount.user_ids.length === 1)) {
            const userId = input.user_ids ? input.user_ids[0] : existingAccount.user_ids[0];
            if (isDefault) {
                await UserService.setDefaultAccount(userId, accountId);
            }
        }

        revalidatePath("/accounts");
        revalidatePath("/dashboard");

        return { data: account, error: null };
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
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return { data: null, error: "Non autenticato. Effettua il login per continuare." };
        }

        const existingAccount = await AccountService.getAccountById(accountId);

        if (currentUser.group_id !== existingAccount.group_id) {
            return { data: null, error: "Non hai i permessi per eliminare questo account" };
        }

        await AccountService.deleteAccount(accountId);

        revalidatePath("/accounts");
        revalidatePath("/dashboard");

        return { data: true, error: null };
    } catch (error) {
        return { data: null, error: error instanceof Error ? error.message : "Failed to delete account" };
    }
}
