"use server";

import { revalidatePath } from "next/cache";
import { CreateAccountInput, UpdateAccountInput, AccountService } from "@/lib/services/account.service";
import { UserService } from "@/lib/services/user.service";
import { Account } from "@/lib/types";

export type ActionState<T> = {
    data?: T;
    error?: string;
};

/**
 * Creates a new account
 */
export async function createAccountAction(
    input: CreateAccountInput,
    isDefault: boolean = false
): Promise<ActionState<Account>> {
    const { data: account, error } = await AccountService.createAccount(input);

    if (error || !account) {
        return { error: error || "Failed to create account" };
    }

    // Handle default account setting
    if (isDefault && input.user_ids.length === 1) {
        const userId = input.user_ids[0];
        await UserService.setDefaultAccount(userId, account.id);
    }

    revalidatePath("/accounts");
    revalidatePath("/dashboard");

    return { data: account };
}

/**
 * Updates an existing account
 */
export async function updateAccountAction(
    accountId: string,
    input: UpdateAccountInput,
    isDefault: boolean = false
): Promise<ActionState<Account>> {
    const { data: account, error } = await AccountService.updateAccount(accountId, input);

    if (error || !account) {
        return { error: error || "Failed to update account" };
    }

    // Handle default account setting
    // Only if single user is selected
    if (input.user_ids?.length === 1) {
        const userId = input.user_ids[0];
        if (isDefault) {
            await UserService.setDefaultAccount(userId, accountId);
        } else {
            // If unchecking default, we verify if this was indeed the default before clearing it?
            // Actually, easiest logic is: if user wants it default, we set it. 
            // If they assume it was default and want to remove it, they effectively set it to null?
            // The UI usually only shows "Make default". Unsetting usually implies selecting another one.
            // But if we support toggle off, we should check.
            // For now, if explicit isDefault is true, we set it.
            // If isDefault is passed as false, we do nothing (preserves existing state) 
            // OR we should explicitly clear it if it WAS default.
            // The user requirement says: "If Default is selected, update...". It doesn't explicitly say about unselecting.
            // I will stick to "If checked, set as default".
        }
    }

    revalidatePath("/accounts");
    revalidatePath("/dashboard");

    return { data: account };
}

/**
 * Deletes an account
 */
export async function deleteAccountAction(
    accountId: string
): Promise<ActionState<boolean>> {
    const { error } = await AccountService.deleteAccount(accountId);

    if (error) {
        return { error };
    }

    revalidatePath("/accounts");
    revalidatePath("/dashboard");

    return { data: true };
}
