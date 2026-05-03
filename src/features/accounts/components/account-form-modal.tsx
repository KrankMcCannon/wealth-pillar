'use client';

import { cn } from '@/lib/utils';
import { useEffect, useMemo, useCallback } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useLocale, useTranslations } from 'next-intl';
import { Check, Landmark, Trash2 } from 'lucide-react';
import { Account } from '@/lib/types';
import { getTempId } from '@/lib/utils/temp-id';
import { createAccountAction, updateAccountAction, deleteAccountAction } from '@/features/accounts';
import { ModalWrapper } from '@/components/ui/modal-wrapper';
import { FormSelect } from '@/components/form';
import { UserField } from '@/components/ui/fields';
import { Input } from '@/components/ui/input';
import {
  usePermissions,
  useRequiredCurrentUser,
  useRequiredGroupUsers,
  useRequiredGroupId,
  useDeleteConfirmation,
} from '@/hooks';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui';
import { useAccounts, useReferenceDataStore } from '@/stores/reference-data-store';
import { useUserFilterStore } from '@/stores/user-filter-store';
import { toast } from '@/hooks/use-toast';
import { ConfirmationDialog } from '@/components/shared';
import { stitchTransactionFormModal } from '@/styles/home-design-foundation';

type AccountFormData = {
  name: string;
  type: 'payroll' | 'cash' | 'investments' | 'savings';
  user_id: string;
  isDefault?: boolean | undefined;
};

interface AccountFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

function AccountFormModal({ isOpen, onClose, editId }: Readonly<AccountFormModalProps>) {
  const t = useTranslations('Accounts.FormModal');
  const tContent = useTranslations('Accounts.Content');
  const locale = useLocale();
  const currentUser = useRequiredCurrentUser();
  const groupUsers = useRequiredGroupUsers();
  const groupId = useRequiredGroupId();
  const selectedUserId = useUserFilterStore((state) => state.selectedUserId);

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

  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AccountFormData>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      name: '',
      type: 'payroll',
      user_id: defaultFormUserId || currentUser.id,
      isDefault: false,
    },
  });

  const watchedUserId = useWatch({ control, name: 'user_id' });
  const watchedIsDefault = useWatch({ control, name: 'isDefault' });
  const watchedType = useWatch({ control, name: 'type' });

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
  }, [addAccount, deleteConfirm, locale, onClose, removeAccount, t]);

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

  const accountTypes = [
    { value: 'payroll', label: t('accountTypes.payroll') },
    { value: 'cash', label: t('accountTypes.cash') },
    { value: 'investments', label: t('accountTypes.investments') },
    { value: 'savings', label: t('accountTypes.savings') },
  ];

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

            <div className={s.fieldStack}>
              <div className={s.noteShell}>
                <label htmlFor="account-name" className={s.noteLabel}>
                  {t('fields.name.label')}
                </label>
                <Input
                  id="account-name"
                  {...register('name')}
                  placeholder={t('fields.name.placeholder')}
                  disabled={isSubmitting}
                  className={s.noteInput}
                  autoComplete="off"
                />
                {errors.name ? (
                  <p className={cn(s.fieldError, 'mt-2')}>{errors.name.message}</p>
                ) : null}
              </div>

              <div className="space-y-1">
                <FormSelect
                  value={watchedType}
                  onValueChange={(val) => setValue('type', val as Account['type'])}
                  options={accountTypes}
                  placeholder={t('fields.type.placeholder')}
                  disabled={isSubmitting}
                  captionLabel={t('fields.type.label')}
                  leadingIcon={<Landmark className="h-5 w-5 text-[#b8c5ff]" aria-hidden />}
                />
                {errors.type?.message ? (
                  <p className={s.fieldError}>{errors.type.message}</p>
                ) : null}
              </div>

              <UserField
                value={watchedUserId}
                onChange={(val) => setValue('user_id', val)}
                error={errors.user_id?.message}
                users={groupUsers}
                label={t('fields.owner.label')}
                placeholder={t('fields.owner.placeholder')}
                disabled={shouldDisableUserField || isSubmitting}
                helperText={shouldDisableUserField ? t('fields.owner.memberHelper') : undefined}
                required
              />

              <div className={cn(s.noteShell, 'flex flex-row items-center gap-3 py-3')}>
                <Checkbox
                  id="isDefault"
                  checked={watchedIsDefault ?? false}
                  onCheckedChange={(checked) => setValue('isDefault', checked as boolean)}
                  disabled={isSubmitting}
                />
                <Label
                  htmlFor="isDefault"
                  className="text-sm font-medium leading-snug text-[#e6ecff]"
                >
                  {t('fields.isDefault')}
                </Label>
              </div>
            </div>
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
