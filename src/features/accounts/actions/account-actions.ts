'use server';

import { revalidateAccountRelatedPaths } from '@/lib/cache/revalidation-paths';
import { getTranslations } from 'next-intl/server';
import { runAuthorizedMutation } from '@/lib/server-action/run-authorized-mutation';
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
import { AccessScope } from '@/lib/permissions/access-scope';
import { defaultAccountUserId } from '@/features/accounts/utils/default-account-id';

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

    const scope = AccessScope.for(currentUser as unknown as User);
    for (const userId of input.user_ids) {
      if (!scope.canViewUser(userId)) {
        return { data: null, error: t('errors.noPermissionCreate') };
      }
    }

    if (!input.name?.trim()) return { data: null, error: t('errors.nameRequired') };
    if (!input.type) return { data: null, error: t('errors.typeRequired') };
    if (!input.group_id) return { data: null, error: t('errors.groupRequired') };
    if (!input.user_ids?.length) return { data: null, error: t('errors.userRequired') };

    const account = await createAccountUseCase(input);

    const defaultUserId = defaultAccountUserId(isDefault, input.user_ids, currentUser.id);
    if (defaultUserId) await setUserDefaultAccountUseCase(defaultUserId, account.id);

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

    const scope = AccessScope.for(currentUser as unknown as User);
    if (!scope.canViewShared(existingAccount)) {
      return { data: null, error: t('errors.noPermissionUpdate') };
    }

    if (input.user_ids) {
      for (const userId of input.user_ids) {
        if (!scope.canViewUser(userId)) {
          return { data: null, error: t('errors.noPermissionUpdate') };
        }
      }
    }

    if (input.name !== undefined && input.name.trim() === '')
      return { data: null, error: t('errors.nameEmpty') };
    if (input.user_ids?.length === 0) return { data: null, error: t('errors.userRequired') };

    const account = await updateAccountUseCase(accountId, input);

    const defaultUserId = defaultAccountUserId(
      isDefault,
      input.user_ids ?? existingAccount.user_ids,
      currentUser.id
    );
    if (defaultUserId) await setUserDefaultAccountUseCase(defaultUserId, accountId);

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
  const t = await getAccountsActionTranslator(locale);
  return runAuthorizedMutation({
    unauthenticatedError: t('errors.unauthenticated'),
    authorize: async (currentUser) => {
      const existingAccount = await getAccountByIdUseCase(accountId);
      if (currentUser.group_id !== existingAccount.group_id) {
        return { data: null, error: t('errors.noPermissionDelete') };
      }
      if (!AccessScope.for(currentUser).canViewShared(existingAccount)) {
        return { data: null, error: t('errors.noPermissionDelete') };
      }
      return null;
    },
    mutate: async () => {
      await deleteAccountUseCase(accountId);
      revalidateAccountRelatedPaths();
      return true;
    },
    formatError: (error) => (error instanceof Error ? error.message : t('errors.deleteFailed')),
  });
}
