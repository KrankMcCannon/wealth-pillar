'use client';

import { useMemo, useCallback } from 'react';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { Account } from '@/lib/types';
import { getTempId } from '@/lib/utils/temp-id';
import { createAccountAction, updateAccountAction, deleteAccountAction } from '@/features/accounts';
import { EntityFormModal, EntityFormFooter, ModalRootError } from '@/components/form';
import {
  usePermissions,
  useRequiredCurrentUser,
  useRequiredGroupUsers,
  useRequiredGroupId,
} from '@/hooks';
import { useAccounts, useReferenceDataStore } from '@/stores/reference-data-store';
import { useUserFilter } from '@/hooks/state/use-user-filter';
import { toast } from '@/hooks/use-toast';
import { useRouter } from '@/i18n/routing';
import { formModalStyles } from '@/components/form';
import { AccountFormFields, type AccountFormData } from './account-form-fields';

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

function AccountFormModal({ isOpen, onClose, editId }: Readonly<AccountFormModalProps>) {
  const t = useTranslations('Accounts.FormModal');
  const tContent = useTranslations('Accounts.Content');
  const locale = useLocale();
  const router = useRouter();
  const currentUser = useRequiredCurrentUser();
  const groupUsers = useRequiredGroupUsers();
  const groupId = useRequiredGroupId();
  const { selectedUserId } = useUserFilter();

  const storeAccounts = useAccounts();
  const addAccount = useReferenceDataStore((state) => state.addAccount);
  const updateAccount = useReferenceDataStore((state) => state.updateAccount);
  const removeAccount = useReferenceDataStore((state) => state.removeAccount);

  const s = formModalStyles;

  const isEditMode = !!editId;
  const title = isEditMode ? t('title.edit') : t('title.create');

  const { shouldDisableUserField, defaultFormUserId } = usePermissions({
    currentUser,
    selectedUserId,
  });
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

  const resetValues = useMemo((): AccountFormData => {
    if (isEditMode && editId) {
      const account = storeAccounts.find((acc) => acc.id === editId);
      if (account) {
        return {
          name: account.name,
          type: account.type,
          user_id: account.user_ids[0] || currentUser.id,
          isDefault: currentUser.default_account_id === account.id,
        };
      }
    }
    return createDefaults;
  }, [isEditMode, editId, storeAccounts, currentUser, createDefaults]);

  const deleteMessage = useMemo(() => {
    if (!editId) return tContent('dialogs.delete.messageFallback');
    const account = storeAccounts.find((acc) => acc.id === editId);
    return account
      ? tContent('dialogs.delete.message', { name: account.name })
      : tContent('dialogs.delete.messageFallback');
  }, [editId, storeAccounts, tContent]);

  const handleUpdate = async (data: AccountFormData, id: string) => {
    const accountData = {
      name: data.name.trim(),
      type: data.type,
      user_ids: [data.user_id],
    };

    const originalAccount = storeAccounts.find((acc) => acc.id === id);
    if (!originalAccount) {
      throw new Error(t('errors.notFound'));
    }

    updateAccount(id, accountData);

    const result = await updateAccountAction(id, accountData, data.isDefault || false, locale);

    if (result.error) {
      updateAccount(id, originalAccount);
      toast({
        title: t('toast.errorTitle'),
        description: `${result.error}\n\n${t('toast.revertedHint')}`,
        variant: 'destructive',
      });
      throw new Error(result.error);
    }

    if (result.data) {
      updateAccount(id, result.data);
      toast({
        title: t('toast.updatedTitle'),
        description: t('toast.updatedDescription'),
        variant: 'success',
      });
      router.refresh();
    }
  };

  const handleCreate = async (data: AccountFormData) => {
    const accountData = {
      name: data.name.trim(),
      type: data.type,
      user_ids: [data.user_id],
    };

    const tempId = getTempId('temp-account');
    const now = new Date().toISOString();
    const optimisticAccount: Account = {
      id: tempId,
      created_at: now,
      updated_at: now,
      ...accountData,
      group_id: groupId,
    };

    addAccount(optimisticAccount);

    onClose();

    const result = await createAccountAction(
      {
        id: crypto.randomUUID(),
        ...accountData,
        group_id: groupId,
      },
      data.isDefault || false,
      locale
    );

    if (result.error) {
      removeAccount(tempId);
      toast({
        title: t('toast.errorTitle'),
        description: `${result.error}\n\n${t('toast.optimisticCreateFailedHint')}`,
        variant: 'destructive',
      });
      return;
    }

    removeAccount(tempId);
    if (result.data) {
      addAccount(result.data);
      toast({
        title: t('toast.createdTitle'),
        description: t('toast.createdDescription'),
        variant: 'success',
      });
      router.refresh();
    }
  };

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
      onClose();
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
  }, [addAccount, editId, locale, onClose, removeAccount, router, storeAccounts, t]);

  return (
    <EntityFormModal<AccountFormData>
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      schema={accountSchema}
      defaultValues={createDefaults}
      resetValues={resetValues}
      repositionInputs={false}
      formClassName={s.formColumn}
      bodyClassName={s.scrollBody}
      footerClassName={s.stickyFooter}
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
      onSubmit={async (data, form) => {
        try {
          if (isEditMode && editId) {
            await handleUpdate(data, editId);
            onClose();
          } else {
            await handleCreate(data);
          }
        } catch (error) {
          const message = error instanceof Error ? error.message : t('errors.unknown');
          form.setError('root', { message });
        }
      }}
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
        <>
          {form.formState.errors.root?.message ? (
            <ModalRootError message={form.formState.errors.root.message} />
          ) : null}
          <AccountFormFields
            form={form}
            groupUsers={groupUsers}
            shouldDisableUserField={shouldDisableUserField}
            isSubmitting={form.formState.isSubmitting}
          />
        </>
      )}
    </EntityFormModal>
  );
}

export default AccountFormModal;
