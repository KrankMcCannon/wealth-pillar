'use server';

import { revalidateAccountRelatedPaths } from '@/lib/cache/revalidation-paths';
import { getTranslations } from 'next-intl/server';
import { getCurrentUser } from '@/lib/auth/cached-auth';
import {
  createAccountUseCase,
  updateAccountUseCase,
  deleteAccountUseCase,
  getAccountByIdUseCase,
  type CreateAccountInput,
  type UpdateAccountInput,
} from '@/server/use-cases/accounts/account.use-cases';
import { setUserDefaultAccountUseCase } from '@/server/use-cases/users/user.use-cases';
import type { ServiceResult } from '@/lib/types/service-result';
import { Account, User } from '@/lib/types';
import { canAccessUserData } from '@/lib/utils/permissions';

export type { ServiceResult } from '@/lib/types/service-result';

async function getAccountsActionTranslator(locale?: string) {
  if (locale) {
    return getTranslations({ locale, namespace: 'Accounts.Actions' });
  }
  return getTranslations('Accounts.Actions');
}

/**
 * Creates a new account
 */
export async function createAccountAction(
  input: CreateAccountInput,
  isDefault: boolean = false,
  locale?: string
): Promise<ServiceResult<Account>> {
  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  try {
    t = await getAccountsActionTranslator(locale);
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: t('errors.unauthenticated') };
    }

    for (const userId of input.user_ids) {
      if (!canAccessUserData(currentUser as unknown as User, userId)) {
        return { data: null, error: t('errors.noPermissionCreate') };
      }
    }

    if (!input.name?.trim()) return { data: null, error: t('errors.nameRequired') };
    if (!input.type) return { data: null, error: t('errors.typeRequired') };
    if (!input.group_id) return { data: null, error: t('errors.groupRequired') };
    if (!input.user_ids?.length) return { data: null, error: t('errors.userRequired') };

    const account = await createAccountUseCase(input);

    if (isDefault && input.user_ids.length === 1) {
      const uid = input.user_ids[0];
      if (uid) await setUserDefaultAccountUseCase(uid, account.id);
    }

    revalidateAccountRelatedPaths();

    return { data: account, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : (t?.('errors.createFailed') ?? 'Failed to create account'),
    };
  }
}

/**
 * Updates an existing account
 */
export async function updateAccountAction(
  accountId: string,
  input: UpdateAccountInput,
  isDefault: boolean = false,
  locale?: string
): Promise<ServiceResult<Account>> {
  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  try {
    t = await getAccountsActionTranslator(locale);
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: t('errors.unauthenticated') };
    }

    const existingAccount = await getAccountByIdUseCase(accountId);

    if (currentUser.group_id !== existingAccount.group_id) {
      return { data: null, error: t('errors.noPermissionUpdate') };
    }

    if (input.name !== undefined && input.name.trim() === '')
      return { data: null, error: t('errors.nameEmpty') };
    if (input.user_ids?.length === 0) return { data: null, error: t('errors.userRequired') };

    const account = await updateAccountUseCase(accountId, input);

    if (
      input.user_ids?.length === 1 ||
      (!input.user_ids && existingAccount.user_ids.length === 1)
    ) {
      const userId = input.user_ids?.[0] ?? existingAccount.user_ids[0];
      if (userId != null && isDefault) {
        await setUserDefaultAccountUseCase(userId, accountId);
      }
    }

    revalidateAccountRelatedPaths();

    return { data: account, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : (t?.('errors.updateFailed') ?? 'Failed to update account'),
    };
  }
}

/**
 * Deletes an account
 */
export async function deleteAccountAction(
  accountId: string,
  locale?: string
): Promise<ServiceResult<boolean>> {
  let t: Awaited<ReturnType<typeof getTranslations>> | null = null;
  try {
    t = await getAccountsActionTranslator(locale);
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      return { data: null, error: t('errors.unauthenticated') };
    }

    const existingAccount = await getAccountByIdUseCase(accountId);

    if (currentUser.group_id !== existingAccount.group_id) {
      return { data: null, error: t('errors.noPermissionDelete') };
    }

    await deleteAccountUseCase(accountId);

    revalidateAccountRelatedPaths();

    return { data: true, error: null };
  } catch (error) {
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : (t?.('errors.deleteFailed') ?? 'Failed to delete account'),
    };
  }
}
