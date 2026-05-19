'use client';

import { useEffect, useMemo, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Trash2 } from 'lucide-react';
import { Account } from '@/lib/types';
import { getTempId } from '@/lib/utils/temp-id';
import { createAccountAction, updateAccountAction, deleteAccountAction } from '@/features/accounts';
import { ModalWrapper } from '@/components/ui/modal-wrapper';
import {
  usePermissions,
  useRequiredCurrentUser,
  useRequiredGroupUsers,
  useRequiredGroupId,
  useDeleteConfirmation,
} from '@/hooks';
import { useAccounts, useReferenceDataStore } from '@/stores/reference-data-store';
import { useUserFilter } from '@/hooks/state/use-user-filter';
import { toast } from '@/hooks/use-toast';
import { ConfirmationDialog } from '@/components/shared';
import { useRouter } from '@/i18n/routing';
import { stitchTransactionFormModal } from '@/styles/home-design-foundation';
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

  const deleteConfirm = useDeleteConfirmation<Account>();
  const s = stitchTransactionFormModal;

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

  const form = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: 'payroll',
      user_id: defaultFormUserId || currentUser.id,
      isDefault: false,
    },
  });

  const {
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = form;

  useEffect(() => {
    if (isOpen && isEditMode && editId) {
      const account = storeAccounts.find((acc) => acc.id === editId);

      if (account) {
        const isDefault = currentUser.default_account_id === account.id;

        reset({
          name: account.name,
          type: account.type,
          user_id: account.user_ids[0] || currentUser.id,
          isDefault,
        });
      }
    } else if (isOpen && !isEditMode) {
      reset({
        name: '',
        type: 'payroll',
        user_id: defaultFormUserId || currentUser.id,
        isDefault: false,
      });
    }
  }, [isOpen, isEditMode, editId, defaultFormUserId, currentUser, reset, storeAccounts]);

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

  const openDeleteDialog = useCallback(() => {
    if (!editId) return;
    const account = storeAccounts.find((acc) => acc.id === editId);
    if (account) deleteConfirm.openDialog(account);
  }, [deleteConfirm, editId, storeAccounts]);

  const handleDeleteConfirm = useCallback(async () => {
    await deleteConfirm.executeDelete(async (account) => {
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
    });
  }, [addAccount, deleteConfirm, locale, onClose, removeAccount, router, t]);

  const onSubmit = async (data: AccountFormData) => {
    try {
      if (isEditMode && editId) {
        await handleUpdate(data, editId);
        onClose();
      } else {
        await handleCreate(data);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('errors.unknown');
      setError('root', { message });
    }
  };

  return (
    <>
      <ModalWrapper
        isOpen={isOpen}
        onOpenChange={onClose}
        title={title}
        titleClassName={s.headerTitle}
        maxWidth="md"
        repositionInputs={false}
        handleClassName={s.handle}
        drawerHeaderClassName={s.drawerHeaderShell}
        drawerCloseClassName={s.headerClose}
        showCloseButton
        className={s.drawerSurface}
      >
        <form onSubmit={handleSubmit(onSubmit)} className={s.formColumn}>
          <div className={s.scrollBody}>
            {errors.root ? (
              <div className={s.errorBanner} role="alert">
                {errors.root.message}
              </div>
            ) : null}

            <AccountFormFields
              form={form}
              groupUsers={groupUsers}
              shouldDisableUserField={shouldDisableUserField}
              isSubmitting={isSubmitting}
            />
          </div>

          <div className={s.stickyFooter}>
            <div className={s.footerActionsStack}>
              <button type="submit" disabled={isSubmitting} className={s.primaryCta}>
                <Check className="h-5 w-5 shrink-0" aria-hidden />
                {isEditMode ? t('buttons.update') : t('buttons.create')}
              </button>
              {isEditMode && editId ? (
                <button
                  type="button"
                  data-testid="account-form-delete"
                  onClick={openDeleteDialog}
                  disabled={isSubmitting}
                  className={s.deleteButton}
                >
                  <Trash2 className="h-5 w-5 shrink-0" aria-hidden />
                  {t('buttons.delete')}
                </button>
              ) : null}
            </div>
          </div>
        </form>
      </ModalWrapper>

      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={() => deleteConfirm.closeDialog()}
        title={tContent('dialogs.delete.title')}
        message={
          deleteConfirm.itemToDelete
            ? tContent('dialogs.delete.message', { name: deleteConfirm.itemToDelete.name })
            : tContent('dialogs.delete.messageFallback')
        }
        confirmText={tContent('dialogs.delete.confirm')}
        cancelText={tContent('dialogs.delete.cancel')}
        variant="destructive"
        isLoading={deleteConfirm.isDeleting}
      />
    </>
  );
}

export default AccountFormModal;
