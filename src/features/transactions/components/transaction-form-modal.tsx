'use client';

import type { TransactionMutationResult } from '@/lib/types/financial-mutation';
import { parseDecimal } from '@/lib/utils/parse-decimal';
import { useSearchParams } from 'next/navigation';
import { resolveTransactionCreateContext } from '../utils/create-transaction-context';
import { todayDateString } from '@/lib/utils/date-utils';

import { useEffect, useMemo, useCallback, useRef } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import {
  EntityFormModal,
  EntityFormFooter,
  useEntityFormPermissions,
  useEntityFormRowReset,
  useEntityFormSubmit,
} from '@/components/form';
import { useAccounts, useCategories, useReferenceDataStore } from '@/stores/reference-data-store';
import {
  createTransactionAction,
  deleteTransactionAction,
  getTransactionByIdAction,
  updateTransactionAction,
} from '@/features/transactions/actions/transaction-actions';
import { getDefaultAccountIdForUser } from '@/features/accounts/utils/default-account-id';
import { useToast } from '@/hooks';
import { getTempId } from '@/lib/utils/temp-id';
import type { Account, Category, User } from '@/lib/types';
import { useTransactionEditStore } from '../stores/transaction-edit-store';
import {
  buildOptimisticTransaction,
  buildOptimisticTransactionFromOriginal,
  useOptimisticTransactionStore,
} from '../stores/optimistic-transactions';
import { getTransactionBalanceDeltas } from '../utils/transaction-balance-delta';
import { mapTransactionToFormData } from '../utils/transaction-form-data';
import { buildTransactionPayload } from '../utils/build-transaction-payload';
import { getTransferDestinationAccounts } from '../utils/transfer-destinations';
import { TransactionFormFields, type TransactionFormData } from './transaction-form-fields';

const createTransactionSchema = (t: ReturnType<typeof useTranslations>) =>
  z
    .object({
      description: z.string().min(2, t('validation.descriptionMin')).trim(),
      amount: z
        .string()
        .min(1, t('validation.amountRequired'))
        .refine((val) => !Number.isNaN(parseDecimal(val)) && parseDecimal(val) > 0, {
          message: t('validation.amountGreaterThanZero'),
        }),
      type: z.enum(['income', 'expense', 'transfer']),
      category: z.string().min(1, t('validation.categoryRequired')),
      date: z.string().min(1, t('validation.dateRequired')),
      user_id: z.string().min(1, t('validation.userRequired')),
      account_id: z.string().min(1, t('validation.accountRequired')),
      to_account_id: z.string().optional(),
    })
    .refine((data) => data.type !== 'transfer' || Boolean(data.to_account_id), {
      message: t('validation.destinationAccountRequired'),
      path: ['to_account_id'],
    })
    .refine((data) => data.type !== 'transfer' || data.to_account_id !== data.account_id, {
      message: t('validation.destinationAccountInvalid'),
      path: ['to_account_id'],
    });

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

function TransactionFormModalBody({
  form,
  isEditMode,
  groupUsers,
  categories,
  accounts,
  shouldDisableUserField,
  userFieldHelperText,
  isSubmitting,
}: Readonly<{
  form: UseFormReturn<TransactionFormData>;
  isEditMode: boolean;
  groupUsers: User[];
  categories: Category[];
  accounts: Account[];
  shouldDisableUserField: boolean;
  userFieldHelperText?: string | undefined;
  isSubmitting: boolean;
}>) {
  const { control, setValue, clearErrors } = form;
  const watchedUserId = useWatch({ control, name: 'user_id' });
  const watchedAccountId = useWatch({ control, name: 'account_id' });
  const watchedType = useWatch({ control, name: 'type' });
  const watchedToAccountId = useWatch({ control, name: 'to_account_id' });

  const filteredAccounts = useMemo(() => {
    if (!watchedUserId) return accounts;
    return accounts.filter((acc) => acc.user_ids.includes(watchedUserId));
  }, [accounts, watchedUserId]);

  const destinationAccounts = useMemo(
    () => getTransferDestinationAccounts(accounts, watchedAccountId),
    [accounts, watchedAccountId]
  );
  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (watchedType !== 'transfer') {
      if (watchedToAccountId) {
        setValue('to_account_id', '');
        clearErrors('to_account_id');
      }
      return;
    }

    if (!watchedToAccountId) return;

    const destinationIsValid = destinationAccounts.some((acc) => acc.id === watchedToAccountId);
    if (!destinationIsValid) {
      setValue('to_account_id', '');
    }
  }, [
    watchedType,
    watchedToAccountId,
    watchedAccountId,
    destinationAccounts,
    setValue,
    clearErrors,
  ]);

  useEffect(() => {
    if (isEditMode || !watchedUserId) return;

    const accountIsValid =
      !!watchedAccountId && filteredAccounts.some((acc) => acc.id === watchedAccountId);
    const previousUserId = previousUserIdRef.current;

    if (accountIsValid && (!previousUserId || previousUserId === watchedUserId)) {
      previousUserIdRef.current = watchedUserId;
      return;
    }

    if (!accountIsValid || (previousUserId && previousUserId !== watchedUserId)) {
      setValue('account_id', getDefaultAccountIdForUser(watchedUserId, accounts, groupUsers));
    }

    previousUserIdRef.current = watchedUserId;
  }, [
    isEditMode,
    watchedUserId,
    watchedAccountId,
    filteredAccounts,
    accounts,
    groupUsers,
    setValue,
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
  const { currentUser, groupUsers, groupId, shouldDisableUserField, userFieldHelperText } =
    useEntityFormPermissions();
  const accounts = useAccounts();
  const categories = useCategories();
  const beginBalanceMutation = useReferenceDataStore((state) => state.beginBalanceMutation);
  const finishBalanceMutation = useReferenceDataStore((state) => state.finishBalanceMutation);
  const { toast } = useToast();
  const seedTransaction = useTransactionEditStore((state) => state.seed);
  const clearSeed = useTransactionEditStore((state) => state.clearSeed);
  const addOptimistic = useOptimisticTransactionStore((state) => state.addOptimistic);
  const commitOptimistic = useOptimisticTransactionStore((state) => state.commitOptimistic);
  const rollbackOptimistic = useOptimisticTransactionStore((state) => state.rollbackOptimistic);
  const applyUpdateOptimisticStore = useOptimisticTransactionStore(
    (state) => state.applyUpdateOptimistic
  );
  const commitUpdateOptimisticStore = useOptimisticTransactionStore(
    (state) => state.commitUpdateOptimistic
  );
  const rollbackUpdateOptimisticStore = useOptimisticTransactionStore(
    (state) => state.rollbackUpdateOptimistic
  );
  const applyDeleteOptimisticStore = useOptimisticTransactionStore(
    (state) => state.applyDeleteOptimistic
  );
  const commitDeleteOptimisticStore = useOptimisticTransactionStore(
    (state) => state.commitDeleteOptimistic
  );
  const rollbackDeleteOptimisticStore = useOptimisticTransactionStore(
    (state) => state.rollbackDeleteOptimistic
  );

  const handleClose = useCallback(() => {
    clearSeed();
    onClose();
  }, [clearSeed, onClose]);

  const isEditMode = Boolean(editId);
  const title = isEditMode ? t('title.edit') : t('title.create');
  const transactionSchema = useMemo(() => createTransactionSchema(t), [t]);

  const searchParams = useSearchParams();
  const createContext = useMemo(
    () => resolveTransactionCreateContext(searchParams, currentUser, groupUsers, accounts),
    [searchParams, currentUser, groupUsers, accounts]
  );
  const today = todayDateString();
  const createDefaults = useMemo(
    (): TransactionFormData => ({
      description: '',
      amount: '',
      type: createContext.type,
      category: '',
      date: today,
      user_id: createContext.user_id,
      account_id: '',
      to_account_id: '',
    }),
    [createContext, today]
  );

  const createValues = useMemo(
    (): TransactionFormData => ({
      ...createDefaults,
      account_id: createContext.account_id,
    }),
    [createDefaults, createContext]
  );

  const handleLoadError = useCallback(() => {
    toast({
      title: tPage('errors.title'),
      description: t('errors.notFound'),
      variant: 'destructive',
    });
    handleClose();
  }, [handleClose, t, tPage, toast]);

  const loadEditValues = useCallback(async (id: string, signal: AbortSignal) => {
    const result = await getTransactionByIdAction(id);
    if (signal.aborted) return null;
    if (result.error || !result.data) return null;
    return mapTransactionToFormData(result.data);
  }, []);

  const getOptimisticEditValues = useCallback(
    (id: string) => {
      if (seedTransaction?.id === id) {
        return mapTransactionToFormData(seedTransaction);
      }
      const overlay = useOptimisticTransactionStore.getState();
      const optimistic = overlay.updated[id]?.transaction;
      return optimistic ? mapTransactionToFormData(optimistic) : undefined;
    },
    [seedTransaction]
  );

  const { resetValues, isReady, isLoading } = useEntityFormRowReset({
    editId,
    createValues,
    loadEditValues,
    getOptimisticEditValues,
    onLoadError: handleLoadError,
  });

  const buildPayload = useCallback(
    (data: TransactionFormData) => buildTransactionPayload(data, groupId),
    [groupId]
  );

  const getSuccessToast = useCallback(
    (edit: boolean) =>
      edit
        ? { title: t('toast.updatedTitle'), description: t('toast.updatedDescription') }
        : { title: t('toast.createdTitle'), description: t('toast.createdDescription') },
    [t]
  );

  type CreateMutationHandle = {
    kind: 'create';
    tempId: string;
    balanceId: string;
  };
  type UpdateMutationHandle = {
    kind: 'update';
    editId: string;
    balanceId: string;
  };
  type TransactionMutationHandle = CreateMutationHandle | UpdateMutationHandle | null;

  const handleSubmit = useEntityFormSubmit<
    TransactionFormData,
    ReturnType<typeof buildPayload>,
    TransactionMutationResult,
    TransactionMutationHandle
  >({
    isEditMode,
    editId,
    onClose: handleClose,
    buildPayload,
    createAction: (payload) => createTransactionAction(payload),
    updateAction: (id, payload) => updateTransactionAction(id, payload),
    applyCreateOptimistic: (payload) => {
      const tempId = getTempId('temp-tx');
      const optimistic = buildOptimisticTransaction(payload, tempId);
      addOptimistic(optimistic, tempId);
      beginBalanceMutation(tempId, Object.fromEntries(getTransactionBalanceDeltas(optimistic, 1)));
      return { kind: 'create', tempId, balanceId: tempId };
    },
    commitCreate: (handle, result) => {
      if (!handle || handle.kind !== 'create') return;
      commitOptimistic(handle.tempId, result);
      finishBalanceMutation(handle.balanceId, result);
    },
    rollbackCreate: (handle, _error) => {
      if (!handle || handle.kind !== 'create') return;
      rollbackOptimistic(handle.tempId);
      finishBalanceMutation(handle.balanceId);
    },
    applyUpdateOptimistic: (id, payload) => {
      const overlay = useOptimisticTransactionStore.getState();
      const original =
        seedTransaction?.id === id
          ? seedTransaction
          : (overlay.updated[id]?.original ?? overlay.updated[id]?.transaction ?? null);
      const optimistic = original
        ? buildOptimisticTransactionFromOriginal(original, payload)
        : { ...buildOptimisticTransaction(payload, id), id };
      applyUpdateOptimisticStore(id, optimistic, original ?? optimistic);
      const deltas = original
        ? getTransactionBalanceDeltas(original, -1)
        : new Map<string, number>();
      if (original)
        for (const [accountId, delta] of getTransactionBalanceDeltas(optimistic, 1)) {
          deltas.set(accountId, (deltas.get(accountId) ?? 0) + delta);
        }
      const balanceId = getTempId('balance-edit');
      beginBalanceMutation(balanceId, Object.fromEntries(deltas));
      return { kind: 'update' as const, editId: id, balanceId };
    },
    commitUpdate: (handle, result) => {
      if (!handle || handle.kind !== 'update') return;
      commitUpdateOptimisticStore(handle.editId, result);
      finishBalanceMutation(handle.balanceId, result);
    },
    rollbackUpdate: (handle, _error) => {
      if (!handle || handle.kind !== 'update') return;
      rollbackUpdateOptimisticStore(handle.editId);
      finishBalanceMutation(handle.balanceId);
    },
    getSuccessToast,
    errorToast: { title: t('toast.errorTitle') },
    unknownErrorMessage: t('errors.unknown'),
  });

  const deleteDialogDescription =
    resetValues?.description.trim() || tPage('dialogs.deleteTransaction.fallbackDescription');

  const handleDelete = useCallback(async () => {
    if (!editId) return;
    const overlay = useOptimisticTransactionStore.getState();
    const original =
      seedTransaction?.id === editId
        ? seedTransaction
        : (overlay.updated[editId]?.transaction ?? overlay.updated[editId]?.original);
    if (!original) {
      toast({
        title: tPage('errors.title'),
        description: t('errors.notFound'),
        variant: 'destructive',
      });
      throw new Error(t('errors.notFound'));
    }

    const balanceId = getTempId('balance-delete');
    applyDeleteOptimisticStore(editId, original);
    beginBalanceMutation(balanceId, Object.fromEntries(getTransactionBalanceDeltas(original, -1)));
    let result;
    try {
      result = await deleteTransactionAction(editId);
    } catch (error) {
      rollbackDeleteOptimisticStore(editId);
      finishBalanceMutation(balanceId);
      throw error;
    }
    if (result.error) {
      rollbackDeleteOptimisticStore(editId);
      finishBalanceMutation(balanceId);
      toast({
        title: tPage('errors.title'),
        description: `${tPage('errors.deleteTransactionFailed')} ${tPage('errors.retryHint')}`,
        variant: 'destructive',
      });
      throw new Error(result.error);
    }
    finishBalanceMutation(balanceId, result.data ?? undefined);
    commitDeleteOptimisticStore(editId);
  }, [
    applyDeleteOptimisticStore,
    commitDeleteOptimisticStore,
    editId,
    rollbackDeleteOptimisticStore,
    seedTransaction,
    beginBalanceMutation,
    finishBalanceMutation,
    t,
    tPage,
    toast,
  ]);

  return (
    <EntityFormModal<TransactionFormData>
      key={`${editId ?? 'create'}-${isReady ? 'ready' : 'pending'}`}
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      formClassName="flex min-h-0 flex-1 flex-col [&_[data-slot=field-group]]:gap-1"
      wrapperProps={{ className: 'max-h-[96dvh]' }}
      schema={transactionSchema}
      defaultValues={createDefaults}
      resetValues={resetValues ?? createValues}
      isLoading={!isReady || isLoading}
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
              testId: 'transaction-form-delete',
            },
          }
        : {})}
      onSubmit={handleSubmit}
      footer={(_, isSubmitting) => (
        <EntityFormFooter
          isSubmitting={isSubmitting}
          submitLabel={isEditMode ? t('buttons.saveTransaction') : t('buttons.create')}
          onCancel={handleClose}
        />
      )}
    >
      {(form) => {
        if (!isReady || !resetValues) return null;

        return (
          <TransactionFormModalBody
            form={form}
            isEditMode={isEditMode}
            groupUsers={groupUsers}
            categories={categories}
            accounts={accounts}
            shouldDisableUserField={shouldDisableUserField}
            userFieldHelperText={userFieldHelperText}
            isSubmitting={form.formState.isSubmitting}
          />
        );
      }}
    </EntityFormModal>
  );
}

export default TransactionFormModal;
