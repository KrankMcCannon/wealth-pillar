'use client';

import { useFinancialCommand } from '@/hooks/use-financial-command';

import { withDeadline } from '@/lib/utils/with-deadline';

import type { TransactionMutationResult } from '@/lib/types/financial-mutation';
import { useRouter } from '@/i18n/routing';
import { useSearchParams } from 'next/navigation';
import { resolveTransactionCreateContext } from '../utils/create-transaction-context';
import { createTransactionFormSchema } from '../utils/transaction-form-schema';
import { todayDateString } from '@/lib/utils/date-utils';

import { useEffect, useId, useMemo, useCallback, useRef, useState } from 'react';
import { useWatch, type UseFormReturn } from 'react-hook-form';
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
import { CategoryPickerList, type CategoryPickerStep } from '@/components/form/category-picker';
import { findCategoryByValue, toCategoryPickerOptions } from '@/components/form/category-select';

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
  categoryPickerStep,
}: Readonly<{
  form: UseFormReturn<TransactionFormData>;
  isEditMode: boolean;
  groupUsers: User[];
  categories: Category[];
  accounts: Account[];
  shouldDisableUserField: boolean;
  userFieldHelperText?: string | undefined;
  isSubmitting: boolean;
  categoryPickerStep: CategoryPickerStep;
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
      categoryPickerStep={categoryPickerStep}
    />
  );
}

function TransactionCategoryStep({
  form,
  categories,
  listId,
  onBack,
}: Readonly<{
  form: UseFormReturn<TransactionFormData>;
  categories: Category[];
  listId: string;
  onBack: () => void;
}>) {
  const t = useTranslations('Forms.CategorySelect');
  const value = useWatch({ control: form.control, name: 'category' });
  return (
    <CategoryPickerList
      id={listId}
      label={t('title')}
      options={toCategoryPickerOptions(categories)}
      value={[findCategoryByValue(categories, value)?.key ?? value]}
      onSelect={(key) => {
        form.setValue('category', key, {
          shouldDirty: true,
          shouldTouch: true,
          shouldValidate: true,
        });
        onBack();
      }}
      focusOnMount
    />
  );
}

function TransactionFormModal({ isOpen, onClose, editId }: Readonly<TransactionFormModalProps>) {
  const financialCommand = useFinancialCommand();

  const router = useRouter();
  const t = useTranslations('Transactions.FormModal');
  const tCategory = useTranslations('Forms.CategorySelect');
  const tPage = useTranslations('TransactionsContent');
  const tStatus = useTranslations('FormStatus');
  const { currentUser, groupUsers, groupId, shouldDisableUserField, userFieldHelperText } =
    useEntityFormPermissions();
  const accounts = useAccounts();
  const categories = useCategories();
  const [categoryPickerOpen, setCategoryPickerOpen] = useState(false);
  const categoryListId = useId();
  const categoryTriggerRef = useRef<HTMLButtonElement>(null);
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

  const handleClose = useCallback(() => {
    setCategoryPickerOpen(false);
    clearSeed();
    onClose();
  }, [clearSeed, onClose]);

  function closeCategoryPicker() {
    setCategoryPickerOpen(false);
    requestAnimationFrame(() => categoryTriggerRef.current?.focus());
  }

  const isEditMode = Boolean(editId);
  const title = isEditMode ? t('title.edit') : t('title.create');
  const transactionSchema = useMemo(() => createTransactionFormSchema(t), [t]);

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
    const result = await withDeadline(getTransactionByIdAction(id));
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

  const { resetValues, isReady, isLoading, loadFailed, retryLoad } = useEntityFormRowReset({
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
    submissionKey: 'transaction',
    operationKinds: { create: 'createTransactionAction', update: 'updateTransactionAction' },
    refreshAfterUncertain: () => router.refresh(),
    isEditMode,
    editId,
    onClose: handleClose,
    buildPayload,
    createAction: (payload, operationId) => createTransactionAction(payload, operationId),
    updateAction: (id, payload, operationId) => updateTransactionAction(id, payload, operationId),
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

    let result;
    try {
      result = await financialCommand('deleteTransactionAction', [editId], (operationId, args) =>
        deleteTransactionAction(...args, operationId)
      );
    } catch {
      toast({
        title: tPage('errors.title'),
        description: tStatus('pending'),
        variant: 'destructive',
      });
      return { status: 'uncertain' as const };
    }
    if (result.error) {
      toast({
        title: tPage('errors.title'),
        description:
          result.errorCode === 'OUTCOME_UNKNOWN'
            ? tStatus('pending')
            : `${tPage('errors.deleteTransactionFailed')} ${tPage('errors.retryHint')}`,
        variant: 'destructive',
      });
      return result.errorCode === 'OUTCOME_UNKNOWN'
        ? { status: 'uncertain' as const }
        : { status: 'rejected' as const };
    }
    const balanceId = getTempId('balance-delete');
    applyDeleteOptimisticStore(editId, original);
    beginBalanceMutation(balanceId, Object.fromEntries(getTransactionBalanceDeltas(original, -1)));
    finishBalanceMutation(balanceId, result.data ?? undefined);
    commitDeleteOptimisticStore(editId);
  }, [
    editId,
    seedTransaction,
    applyDeleteOptimisticStore,
    beginBalanceMutation,
    finishBalanceMutation,
    commitDeleteOptimisticStore,
    toast,
    tPage,
    t,
    tStatus,
    financialCommand,
  ]);

  const verifyDelete = useCallback(async () => {
    if (!editId) return { status: 'uncertain' as const };
    const overlay = useOptimisticTransactionStore.getState();
    const original =
      seedTransaction?.id === editId
        ? seedTransaction
        : (overlay.updated[editId]?.transaction ?? overlay.updated[editId]?.original);
    if (!original) return { status: 'uncertain' as const };

    const result = await financialCommand.verify<
      Awaited<ReturnType<typeof deleteTransactionAction>>['data']
    >('deleteTransactionAction', [editId]);
    if (result.status !== 'committed') return { status: 'uncertain' as const };
    if (result.result.error) return { status: 'rejected' as const };

    const balanceId = getTempId('balance-delete');
    applyDeleteOptimisticStore(editId, original);
    beginBalanceMutation(balanceId, Object.fromEntries(getTransactionBalanceDeltas(original, -1)));
    finishBalanceMutation(balanceId, result.result.data ?? undefined);
    commitDeleteOptimisticStore(editId);
    return { status: 'confirmed' as const };
  }, [
    editId,
    seedTransaction,
    applyDeleteOptimisticStore,
    beginBalanceMutation,
    finishBalanceMutation,
    commitDeleteOptimisticStore,
    financialCommand,
  ]);

  return (
    <EntityFormModal<TransactionFormData>
      key={`${editId ?? 'create'}-${isReady ? 'ready' : 'pending'}`}
      isOpen={isOpen}
      onClose={handleClose}
      title={title}
      formClassName="flex min-h-0 flex-1 flex-col [&_[data-slot=field-group]]:gap-1"
      wrapperProps={{
        className: categoryPickerOpen ? 'h-[min(36rem,90dvh)]' : 'max-h-[96dvh]',
        ...(categoryPickerOpen ? { drawerHeaderClassName: 'py-1 sm:py-2' } : {}),
      }}
      step={
        categoryPickerOpen
          ? {
              title: tCategory('title'),
              backLabel: tCategory('backToTransaction'),
              onBack: closeCategoryPicker,
              render: (form) => (
                <TransactionCategoryStep
                  form={form}
                  categories={categories}
                  listId={categoryListId}
                  onBack={closeCategoryPicker}
                />
              ),
            }
          : undefined
      }
      schema={transactionSchema}
      defaultValues={createDefaults}
      resetValues={resetValues ?? createValues}
      isLoading={!loadFailed && (!isReady || isLoading)}
      {...(isEditMode && editId
        ? {
            deletion: {
              enabled: isReady && !loadFailed,
              title: tPage('dialogs.deleteTransaction.title'),
              message: tPage('dialogs.deleteTransaction.message', {
                description: deleteDialogDescription,
              }),
              confirmText: tPage('dialogs.deleteTransaction.confirm'),
              cancelText: tPage('dialogs.cancel'),
              onDelete: handleDelete,
              onVerify: verifyDelete,
              testId: 'transaction-form-delete',
            },
          }
        : {})}
      loadFailed={loadFailed}
      onRetryLoad={retryLoad}
      onSubmit={handleSubmit}
      footer={(_, isSubmitting) => (
        <EntityFormFooter
          isSubmitting={isSubmitting}
          disabled={loadFailed || !isReady}
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
            categoryPickerStep={{
              listId: categoryListId,
              open: categoryPickerOpen,
              onOpen: (trigger) => {
                categoryTriggerRef.current = trigger;
                setCategoryPickerOpen(true);
              },
            }}
          />
        );
      }}
    </EntityFormModal>
  );
}

export default TransactionFormModal;
