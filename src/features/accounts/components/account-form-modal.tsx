'use client';

import { useCallback, useMemo } from 'react';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import type { Account } from '@/lib/types';
import { getTempId } from '@/lib/utils/temp-id';
import { createAccountAction, updateAccountAction, deleteAccountAction } from '@/features/accounts';
import {
  EntityFormModal,
  EntityFormFooter,
  useEntityFormPermissions,
  useEntityFormRowReset,
  useEntityFormSubmit,
} from '@/components/form';
import { useAccounts, useReferenceDataStore } from '@/stores/reference-data-store';
import { useRouter } from '@/i18n/routing';
import { toast } from '@/hooks/use-toast';
import { AccountFormFields, type AccountFormData } from './account-form-fields';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

type AccountPayload = {
  name: string;
  type: Account['type'];
  user_ids: string[];
  isDefault: boolean;
};

function AccountFormModal({ isOpen, onClose, editId }: Readonly<AccountFormModalProps>) {
  const t = useTranslations('Accounts.FormModal');
  const tContent = useTranslations('Accounts.Content');
  const locale = useLocale();
  const router = useRouter();

  const { currentUser, groupUsers, groupId, shouldDisableUserField, defaultFormUserId } =
    useEntityFormPermissions();

  const storeAccounts = useAccounts();
  const addAccount = useReferenceDataStore((state) => state.addAccount);
  const updateAccount = useReferenceDataStore((state) => state.updateAccount);
  const removeAccount = useReferenceDataStore((state) => state.removeAccount);

  const isEditMode = Boolean(editId);
  const title = isEditMode ? t('title.edit') : t('title.create');

  const accountSchema = useMemo(
    () =>
      z.object({
        name: z.string().min(1, t('validation.nameRequired')).trim(),
        type: z.enum(['payroll', 'cash', 'investments', 'savings']),
        user_id: z.string().min(1, t('validation.userRequired')),
        isDefault: z.boolean().optional(),
      }),
    [t]
  );

  const createDefaults = useMemo(
    (): AccountFormData => ({
      name: '',
      type: 'payroll',
      user_id: defaultFormUserId || currentUser.id,
      isDefault: false,
    }),
    [defaultFormUserId, currentUser.id]
  );

  const getEditValuesSync = useCallback(
    (id: string): AccountFormData | undefined => {
      const account = storeAccounts.find((acc) => acc.id === id);
      if (!account) return undefined;
      return {
        name: account.name,
        type: account.type,
        user_id: account.user_ids[0] || currentUser.id,
        isDefault: currentUser.default_account_id === account.id,
      };
    },
    [storeAccounts, currentUser]
  );

  const { resetValues } = useEntityFormRowReset({
    editId,
    createValues: createDefaults,
    getEditValuesSync,
  });

  const deleteMessage = useMemo(() => {
    if (!editId) return tContent('dialogs.delete.messageFallback');
    const account = storeAccounts.find((acc) => acc.id === editId);
    return account
      ? tContent('dialogs.delete.message', { name: account.name })
      : tContent('dialogs.delete.messageFallback');
  }, [editId, storeAccounts, tContent]);

  const buildPayload = useCallback(
    (data: AccountFormData): AccountPayload => ({
      name: data.name.trim(),
      type: data.type,
      user_ids: [data.user_id],
      isDefault: data.isDefault || false,
    }),
    []
  );

  const applyCreateOptimistic = useCallback(
    (payload: AccountPayload) => {
      const tempId = getTempId('temp-account');
      const now = new Date().toISOString();
      const optimisticAccount: Account = {
        id: tempId,
        created_at: now,
        updated_at: now,
        name: payload.name,
        type: payload.type,
        user_ids: payload.user_ids,
        group_id: groupId,
      };
      addAccount(optimisticAccount);
      return tempId;
    },
    [addAccount, groupId]
  );

  const commitCreate = useCallback(
    (handle: string | { originalAccount: Account; id: string }, result: Account) => {
      if (typeof handle !== 'string') return;
      removeAccount(handle);
      addAccount(result);
    },
    [addAccount, removeAccount]
  );

  const rollbackCreate = useCallback(
    (handle: string | { originalAccount: Account; id: string }) => {
      if (typeof handle !== 'string') return;
      removeAccount(handle);
    },
    [removeAccount]
  );

  const applyUpdateOptimistic = useCallback(
    (id: string, payload: AccountPayload) => {
      const originalAccount = storeAccounts.find((acc) => acc.id === id);
      if (!originalAccount) {
        throw new Error(t('errors.notFound'));
      }
      updateAccount(id, {
        name: payload.name,
        type: payload.type,
        user_ids: payload.user_ids,
      });
      return { originalAccount, id };
    },
    [storeAccounts, t, updateAccount]
  );

  const commitUpdate = useCallback(
    (handle: string | { originalAccount: Account; id: string }, result: Account) => {
      if (typeof handle === 'string') return;
      updateAccount(result.id, result);
    },
    [updateAccount]
  );

  const rollbackUpdate = useCallback(
    (handle: string | { originalAccount: Account; id: string }) => {
      if (typeof handle === 'string') return;
      updateAccount(handle.id, handle.originalAccount);
    },
    [updateAccount]
  );

  const getSuccessToast = useCallback(
    (edit: boolean) =>
      edit
        ? { title: t('toast.updatedTitle'), description: t('toast.updatedDescription') }
        : { title: t('toast.createdTitle'), description: t('toast.createdDescription') },
    [t]
  );

  const formatErrorDescription = useCallback(
    (error: string, edit: boolean) =>
      edit
        ? `${error}\n\n${t('toast.revertedHint')}`
        : `${error}\n\n${t('toast.optimisticCreateFailedHint')}`,
    [t]
  );

  const handleSubmit = useEntityFormSubmit<
    AccountFormData,
    AccountPayload,
    Account,
    string | { originalAccount: Account; id: string }
  >({
    isEditMode,
    editId,
    onClose,
    buildPayload,
    createAction: (payload) =>
      createAccountAction(
        {
          id: crypto.randomUUID(),
          name: payload.name,
          type: payload.type,
          user_ids: payload.user_ids,
          group_id: groupId,
        },
        payload.isDefault,
        locale
      ),
    updateAction: (id, payload) =>
      updateAccountAction(
        id,
        { name: payload.name, type: payload.type, user_ids: payload.user_ids },
        payload.isDefault,
        locale
      ),
    applyCreateOptimistic,
    commitCreate,
    rollbackCreate,
    applyUpdateOptimistic,
    commitUpdate,
    rollbackUpdate,
    getSuccessToast,
    errorToast: { title: t('toast.errorTitle') },
    formatErrorDescription,
    unknownErrorMessage: t('errors.unknown'),
  });

  const handleDelete = useCallback(async () => {
    if (!editId) return;
    const account = storeAccounts.find((acc) => acc.id === editId);
    if (!account) return;

    removeAccount(account.id);
    let restored = false;
    try {
      const result = await deleteAccountAction(account.id, locale);
      if (result.error) {
        addAccount(account);
        restored = true;
        toast({
          title: t('toast.errorTitle'),
          description: result.error,
          variant: 'destructive',
        });
        throw new Error(result.error);
      }
      toast({
        title: t('toast.deletedTitle'),
        description: t('toast.deletedDescription'),
        variant: 'success',
      });
      router.refresh();
    } catch {
      if (!restored) {
        addAccount(account);
        toast({
          title: t('toast.errorTitle'),
          description: t('errors.unknown'),
          variant: 'destructive',
        });
      }
      throw new Error('delete failed');
    }
  }, [addAccount, editId, locale, removeAccount, router, storeAccounts, t]);

  return (
    <EntityFormModal<AccountFormData>
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      schema={accountSchema}
      defaultValues={createDefaults}
      resetValues={resetValues ?? createDefaults}
      {...(isEditMode && editId
        ? {
            deletion: {
              enabled: true,
              title: tContent('dialogs.delete.title'),
              message: deleteMessage,
              confirmText: tContent('dialogs.delete.confirm'),
              cancelText: tContent('dialogs.delete.cancel'),
              onDelete: handleDelete,
            },
          }
        : {})}
      onSubmit={handleSubmit}
      footer={(_, isSubmitting, { openDeleteDialog }) => (
        <EntityFormFooter
          isEditMode={isEditMode}
          isSubmitting={isSubmitting}
          submitLabel={isEditMode ? t('buttons.update') : t('buttons.create')}
          deleteLabel={t('buttons.delete')}
          deleteTestId="account-form-delete"
          {...(openDeleteDialog ? { onDelete: openDeleteDialog } : {})}
        />
      )}
    >
      {(form) => (
        <AccountFormFields
          form={form}
          groupUsers={groupUsers}
          shouldDisableUserField={shouldDisableUserField}
          isSubmitting={form.formState.isSubmitting}
        />
      )}
    </EntityFormModal>
  );
}

export default AccountFormModal;
