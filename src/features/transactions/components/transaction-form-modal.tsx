'use client';

import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { useWatch, type UseFormReturn, type UseFormSetError } from 'react-hook-form';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useTransactionSubmit } from '../hooks/use-transaction-submit';
import {
  EntityFormModal,
  EntityFormStitchFooter,
  type EntityFormModalWrapperProps,
} from '@/components/form';
import {
  usePermissions,
  useRequiredCurrentUser,
  useRequiredGroupUsers,
  useRequiredGroupId,
  useDeleteConfirmation,
  useToast,
} from '@/hooks';
import { useAccounts, useCategories } from '@/stores/reference-data-store';
import { useUserFilter } from '@/hooks/state/use-user-filter';
import { ConfirmationDialog } from '@/components/shared';
import {
  deleteTransactionAction,
  getTransactionByIdAction,
} from '@/features/transactions/actions/transaction-actions';
import { useRouter } from '@/i18n/routing';
import { stitchTransactionFormModal } from '@/styles/home-design-foundation';
import type { Account, Category, Transaction, User } from '@/lib/types';
import { TransactionFormFields, type TransactionFormData } from './transaction-form-fields';

const createTransactionSchema = (t: ReturnType<typeof useTranslations>) =>
  z
    .object({
      description: z.string().min(2, t('validation.descriptionMin')).trim(),
      amount: z
        .string()
        .min(1, t('validation.amountRequired'))
        .refine((val) => !Number.isNaN(Number.parseFloat(val)) && Number.parseFloat(val) > 0, {
          message: t('validation.amountGreaterThanZero'),
        }),
      type: z.enum(['income', 'expense', 'transfer']),
      category: z.string().min(1, t('validation.categoryRequired')),
      date: z.string().min(1, t('validation.dateRequired')),
      user_id: z.string().min(1, t('validation.userRequired')),
      account_id: z.string().min(1, t('validation.accountRequired')),
      to_account_id: z.string().optional(),
    })
    .refine(
      (data) => {
        if (data.type === 'transfer') {
          if (!data.to_account_id) return false;
          if (data.to_account_id === data.account_id) return false;
        }
        return true;
      },
      {
        message: t('validation.destinationAccountInvalid'),
        path: ['to_account_id'],
      }
    );

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

const s = stitchTransactionFormModal;

const stitchWrapperProps: EntityFormModalWrapperProps = {
  titleClassName: s.headerTitle,
  handleClassName: s.handle,
  drawerHeaderClassName: s.drawerHeaderShell,
  drawerCloseClassName: s.headerClose,
  showCloseButton: true,
  className: s.drawerSurface,
};

function TransactionFormModalBody({
  form,
  isEditMode,
  isOpen,
  groupUsers,
  categories,
  accounts,
  shouldDisableUserField,
  userFieldHelperText,
  isSubmitting,
}: Readonly<{
  form: UseFormReturn<TransactionFormData>;
  isEditMode: boolean;
  isOpen: boolean;
  groupUsers: User[];
  categories: Category[];
  accounts: Account[];
  shouldDisableUserField: boolean;
  userFieldHelperText?: string | undefined;
  isSubmitting: boolean;
}>) {
  const { control, setValue } = form;
  const watchedUserId = useWatch({ control, name: 'user_id' });
  const watchedAccountId = useWatch({ control, name: 'account_id' });

  const filteredAccounts = useMemo(() => {
    if (!watchedUserId) return accounts;
    return accounts.filter((acc) => acc.user_ids.includes(watchedUserId));
  }, [accounts, watchedUserId]);

  const destinationAccounts = filteredAccounts.filter((acc) => acc.id !== watchedAccountId);

  const previousUserIdRef = useRef<string | null>(null);

  const getDefaultAccountId = useCallback(
    (userId: string): string => {
      if (!userId) return accounts.length > 0 ? (accounts[0]?.id ?? '') : '';

      const user = groupUsers.find((u) => u.id === userId);
      if (user?.default_account_id) {
        const defaultAccount = accounts.find(
          (acc) => acc.id === user.default_account_id && acc.user_ids.includes(userId)
        );
        if (defaultAccount) return defaultAccount.id;
      }

      const userAccounts = accounts.filter((acc) => acc.user_ids.includes(userId));
      if (userAccounts.length > 0) return userAccounts[0]?.id ?? '';
      return accounts.length > 0 ? (accounts[0]?.id ?? '') : '';
    },
    [accounts, groupUsers]
  );

  useEffect(() => {
    if (!isOpen) {
      previousUserIdRef.current = null;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isEditMode && watchedUserId) {
      const accountIsValid =
        !!watchedAccountId && filteredAccounts.some((acc) => acc.id === watchedAccountId);
      const previousUserId = previousUserIdRef.current;

      if (accountIsValid && (!previousUserId || previousUserId === watchedUserId)) {
        previousUserIdRef.current = watchedUserId;
        return;
      }

      if (!accountIsValid || (previousUserId && previousUserId !== watchedUserId)) {
        const newAccountId = getDefaultAccountId(watchedUserId);
        setValue('account_id', newAccountId);
        setValue('to_account_id', '');
      }

      previousUserIdRef.current = watchedUserId;
    }
  }, [
    isEditMode,
    watchedUserId,
    watchedAccountId,
    filteredAccounts,
    setValue,
    getDefaultAccountId,
  ]);

  return (
    <TransactionFormFields
      form={form}
      groupUsers={groupUsers}
      categories={categories}
      filteredAccounts={filteredAccounts}
      destinationAccounts={destinationAccounts}
      shouldDisableUserField={shouldDisableUserField}
      userFieldHelperText={userFieldHelperText}
      isSubmitting={isSubmitting}
    />
  );
}

function TransactionFormModal({ isOpen, onClose, editId }: Readonly<TransactionFormModalProps>) {
  const t = useTranslations('Transactions.FormModal');
  const tPage = useTranslations('TransactionsContent');
  const currentUser = useRequiredCurrentUser();
  const groupUsers = useRequiredGroupUsers();
  const accounts = useAccounts();
  const categories = useCategories();
  const groupId = useRequiredGroupId();
  const { selectedUserId } = useUserFilter();
  const router = useRouter();
  const { toast } = useToast();
  const deleteConfirm = useDeleteConfirmation<Transaction>();

  const [isLoadingRow, setIsLoadingRow] = useState(false);
  const [resetValues, setResetValues] = useState<TransactionFormData | undefined>(undefined);
  const previousUserIdRef = useRef<string | null>(null);

  const isEditMode = !!editId;
  const title = isEditMode ? t('title.edit') : t('title.create');

  const { shouldDisableUserField, defaultFormUserId, userFieldHelperText } = usePermissions({
    currentUser,
    selectedUserId,
  });

  const transactionSchema = useMemo(() => createTransactionSchema(t), [t]);

  const createDefaults = useMemo(
    (): TransactionFormData => ({
      description: '',
      amount: '',
      type: 'expense',
      category: '',
      date: new Date().toISOString().split('T')[0] as string,
      user_id: defaultFormUserId,
      account_id: '',
      to_account_id: '',
    }),
    [defaultFormUserId]
  );

  const getDefaultAccountId = useCallback(
    (userId: string): string => {
      if (!userId) return accounts.length > 0 ? (accounts[0]?.id ?? '') : '';

      const user = groupUsers.find((u) => u.id === userId);
      if (user?.default_account_id) {
        const defaultAccount = accounts.find(
          (acc) => acc.id === user.default_account_id && acc.user_ids.includes(userId)
        );
        if (defaultAccount) return defaultAccount.id;
      }

      const userAccounts = accounts.filter((acc) => acc.user_ids.includes(userId));
      if (userAccounts.length > 0) return userAccounts[0]?.id ?? '';
      return accounts.length > 0 ? (accounts[0]?.id ?? '') : '';
    },
    [accounts, groupUsers]
  );

  useEffect(() => {
    if (!isOpen) return;

    let cancelled = false;

    const run = async () => {
      if (!editId) {
        setIsLoadingRow(false);
        const accountId = getDefaultAccountId(defaultFormUserId);
        setResetValues({
          ...createDefaults,
          account_id: accountId,
        });
        previousUserIdRef.current = defaultFormUserId;
        return;
      }

      setIsLoadingRow(true);
      const result = await getTransactionByIdAction(editId);
      if (cancelled) return;
      setIsLoadingRow(false);

      const transaction = result.data;
      if (!transaction) return;

      const dateStr =
        typeof transaction.date === 'string'
          ? transaction.date.split('T')[0]
          : transaction.date.toISOString().split('T')[0];

      setResetValues({
        description: transaction.description,
        amount: transaction.amount.toString(),
        type: transaction.type,
        category: transaction.category,
        date: dateStr as string,
        user_id: transaction.user_id || '',
        account_id: transaction.account_id,
        to_account_id: transaction.to_account_id || '',
      });
      previousUserIdRef.current = transaction.user_id || '';
    };

    run().catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [isOpen, editId, createDefaults, defaultFormUserId, getDefaultAccountId]);

  const setErrorRef = useRef<UseFormSetError<TransactionFormData> | null>(null);

  const { handleSubmit: submitHandler } = useTransactionSubmit({
    isEditMode,
    editId,
    groupId,
    onClose,
    setError: (name, error) => {
      setErrorRef.current?.(name, error);
    },
    messages: {
      notFound: t('errors.notFound'),
      unknownError: t('errors.unknown'),
    },
  });

  const openDeleteDialog = useCallback(() => {
    if (!editId) return;
    deleteConfirm.openDialog({ id: editId } as Transaction);
  }, [deleteConfirm, editId]);

  const handleDeleteConfirm = useCallback(async () => {
    await deleteConfirm.executeDelete(async (transaction) => {
      const result = await deleteTransactionAction(transaction.id);
      if (result.error) {
        toast({
          title: tPage('errors.title'),
          description: `${tPage('errors.deleteTransactionFailed')} ${tPage('errors.retryHint')}`,
          variant: 'destructive',
        });
        throw new Error(result.error);
      }
      onClose();
      router.refresh();
    });
  }, [deleteConfirm, onClose, router, tPage, toast]);

  const deleteDialogDescription =
    deleteConfirm.itemToDelete?.description?.trim() ||
    tPage('dialogs.deleteTransaction.fallbackDescription');

  return (
    <>
      <EntityFormModal<TransactionFormData>
        isOpen={isOpen}
        onClose={onClose}
        title={title}
        schema={transactionSchema}
        defaultValues={createDefaults}
        resetValues={resetValues ?? createDefaults}
        maxWidth="md"
        repositionInputs={false}
        isLoading={Boolean(editId) && isLoadingRow}
        formClassName={s.formColumn}
        bodyClassName={s.scrollBody}
        footerClassName={s.stickyFooter}
        wrapperProps={stitchWrapperProps}
        onSubmit={async (data) => {
          await submitHandler(data);
        }}
        footer={(_, isSubmitting) => (
          <EntityFormStitchFooter
            isEditMode={isEditMode}
            isSubmitting={isSubmitting}
            submitLabel={isEditMode ? t('buttons.saveTransaction') : t('buttons.create')}
            deleteLabel={t('buttons.delete')}
            deleteTestId="transaction-form-delete"
            onDelete={openDeleteDialog}
          />
        )}
      >
        {(form) => {
          setErrorRef.current = form.setError;

          return (
            <>
              {form.formState.errors.root ? (
                <div className={s.errorBanner} role="alert">
                  {form.formState.errors.root.message}
                </div>
              ) : null}
              <TransactionFormModalBody
                form={form}
                isEditMode={isEditMode}
                isOpen={isOpen}
                groupUsers={groupUsers}
                categories={categories}
                accounts={accounts}
                shouldDisableUserField={shouldDisableUserField}
                userFieldHelperText={userFieldHelperText}
                isSubmitting={form.formState.isSubmitting}
              />
            </>
          );
        }}
      </EntityFormModal>

      <ConfirmationDialog
        isOpen={deleteConfirm.isOpen}
        onConfirm={handleDeleteConfirm}
        onCancel={() => deleteConfirm.closeDialog()}
        title={tPage('dialogs.deleteTransaction.title')}
        message={tPage('dialogs.deleteTransaction.message', {
          description: deleteDialogDescription,
        })}
        confirmText={tPage('dialogs.deleteTransaction.confirm')}
        cancelText={tPage('dialogs.cancel')}
        variant="destructive"
        isLoading={deleteConfirm.isDeleting}
      />
    </>
  );
}

export default TransactionFormModal;
