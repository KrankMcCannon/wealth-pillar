'use client';

import { useEffect, useMemo, useCallback, useRef, useState } from 'react';
import { useWatch, type UseFormReturn, type UseFormSetError } from 'react-hook-form';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { useTransactionSubmit } from '../hooks/use-transaction-submit';
import { EntityFormModal, EntityFormFooter, ModalRootError } from '@/components/form';
import {
  usePermissions,
  useRequiredCurrentUser,
  useRequiredGroupUsers,
  useRequiredGroupId,
  useToast,
} from '@/hooks';
import { useAccounts, useCategories } from '@/stores/reference-data-store';
import { useUserFilter } from '@/hooks/state/use-user-filter';
import {
  deleteTransactionAction,
  getTransactionByIdAction,
} from '@/features/transactions/actions/transaction-actions';
import { useRouter } from '@/i18n/routing';
import { formModalStyles } from '@/components/form';
import type { Account, Category, Transaction, User } from '@/lib/types';
import { useTransactionEditStore } from '../stores/transaction-edit-store';
import { mapTransactionToFormData } from '../utils/transaction-form-data';
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

const s = formModalStyles;

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
  const [isLoadingRow, setIsLoadingRow] = useState(false);
  const [loadedTransaction, setLoadedTransaction] = useState<{
    editId: string;
    data: Transaction | null;
  } | null>(null);
  const seedTransaction = useTransactionEditStore((state) => state.seed);
  const clearSeed = useTransactionEditStore((state) => state.clearSeed);
  const previousUserIdRef = useRef<string | null>(null);

  const handleClose = useCallback(() => {
    clearSeed();
    onClose();
  }, [clearSeed, onClose]);

  useEffect(() => () => clearSeed(), [clearSeed]);

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

  const editingTransaction =
    isOpen && editId && loadedTransaction?.editId === editId && loadedTransaction.data
      ? loadedTransaction.data
      : isOpen && editId && seedTransaction?.id === editId
        ? seedTransaction
        : null;

  const resetValues = useMemo((): TransactionFormData => {
    if (isEditMode && editingTransaction) {
      return mapTransactionToFormData(editingTransaction);
    }

    if (!isEditMode) {
      return {
        ...createDefaults,
        account_id: getDefaultAccountId(defaultFormUserId),
      };
    }

    return createDefaults;
  }, [isEditMode, editingTransaction, createDefaults, getDefaultAccountId, defaultFormUserId]);

  useEffect(() => {
    if (!editId) return;

    let cancelled = false;

    const run = async () => {
      setIsLoadingRow(true);
      const result = await getTransactionByIdAction(editId);
      if (cancelled) return;
      setIsLoadingRow(false);

      if (result.error || !result.data) {
        setLoadedTransaction({ editId, data: null });
        toast({
          title: tPage('errors.title'),
          description: result.error ?? t('errors.notFound'),
          variant: 'destructive',
        });
        return;
      }

      setLoadedTransaction({ editId, data: result.data });
      previousUserIdRef.current = result.data.user_id ?? '';
    };

    run().catch(() => {
      if (!cancelled) {
        setIsLoadingRow(false);
        toast({
          title: tPage('errors.title'),
          description: t('errors.unknown'),
          variant: 'destructive',
        });
      }
    });

    return () => {
      cancelled = true;
    };
  }, [editId, t, tPage, toast]);

  const setErrorRef = useRef<UseFormSetError<TransactionFormData> | null>(null);

  const { handleSubmit: submitHandler } = useTransactionSubmit({
    isEditMode,
    editId,
    groupId,
    onClose: handleClose,
    setError: (name, error) => {
      setErrorRef.current?.(name, error);
    },
    messages: {
      notFound: t('errors.notFound'),
      unknownError: t('errors.unknown'),
    },
  });

  const deleteDialogDescription =
    resetValues.description.trim() || tPage('dialogs.deleteTransaction.fallbackDescription');

  const handleDelete = useCallback(async () => {
    if (!editId) return;
    const result = await deleteTransactionAction(editId);
    if (result.error) {
      toast({
        title: tPage('errors.title'),
        description: `${tPage('errors.deleteTransactionFailed')} ${tPage('errors.retryHint')}`,
        variant: 'destructive',
      });
      throw new Error(result.error);
    }
    handleClose();
    router.refresh();
  }, [editId, handleClose, router, tPage, toast]);

  return (
    <EntityFormModal<TransactionFormData>
      key={editId ?? 'create'}
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      schema={transactionSchema}
      defaultValues={createDefaults}
      resetValues={resetValues}
      repositionInputs={false}
      isLoading={Boolean(editId) && isLoadingRow}
      formClassName={s.formColumn}
      bodyClassName={s.scrollBody}
      footerClassName={s.stickyFooter}
      {...(isEditMode && editId
        ? {
            deletion: {
              enabled: true,
              title: tPage('dialogs.deleteTransaction.title'),
              message: tPage('dialogs.deleteTransaction.message', {
                description: deleteDialogDescription,
              }),
              confirmText: tPage('dialogs.deleteTransaction.confirm'),
              cancelText: tPage('dialogs.cancel'),
              onDelete: handleDelete,
            },
          }
        : {})}
      onSubmit={async (data) => {
        await submitHandler(data);
      }}
      footer={(_, isSubmitting, { openDeleteDialog }) => (
        <EntityFormFooter
          isEditMode={isEditMode}
          isSubmitting={isSubmitting}
          submitLabel={isEditMode ? t('buttons.saveTransaction') : t('buttons.create')}
          deleteLabel={t('buttons.delete')}
          deleteTestId="transaction-form-delete"
          {...(openDeleteDialog ? { onDelete: openDeleteDialog } : {})}
        />
      )}
    >
      {(form) => {
        setErrorRef.current = form.setError;

        return (
          <>
            {form.formState.errors.root?.message ? (
              <ModalRootError message={form.formState.errors.root.message} />
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
  );
}

export default TransactionFormModal;
