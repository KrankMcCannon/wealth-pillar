'use client';

import { useEffect, useMemo, useCallback, useRef } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { TransactionType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useTransactionSubmit } from '../hooks/useTransactionSubmit';
import { transactionStyles } from '@/styles/system';
import { ModalWrapper, ModalBody, ModalFooter, ModalSection } from '@/components/ui/modal-wrapper';
import { FormActions, FormField, FormSelect } from '@/components/form';
import {
  UserField,
  AccountField,
  CategoryField,
  AmountField,
  DateField,
} from '@/components/ui/fields';
import { Input } from '@/components/ui/input';
import {
  usePermissions,
  useRequiredCurrentUser,
  useRequiredGroupUsers,
  useRequiredGroupId,
} from '@/hooks';
import { useAccounts, useCategories } from '@/stores/reference-data-store';
import { useUserFilterStore } from '@/stores/user-filter-store';
import { usePageDataStore } from '@/stores/page-data-store';

// Zod schema for transaction validation
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

type TransactionFormData = z.infer<ReturnType<typeof createTransactionSchema>>;

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  editId?: string | null;
}

function TransactionFormModal({ isOpen, onClose, editId }: Readonly<TransactionFormModalProps>) {
  const t = useTranslations('Transactions.FormModal');
  // Read from stores instead of props
  const currentUser = useRequiredCurrentUser();
  const groupUsers = useRequiredGroupUsers();
  const accounts = useAccounts();
  const categories = useCategories();
  const groupId = useRequiredGroupId();
  const selectedUserId = useUserFilterStore((state) => state.selectedUserId);

  // Page data store actions for optimistic updates
  const storeTransactions = usePageDataStore((state) => state.transactions);
  const addTransaction = usePageDataStore((state) => state.addTransaction);
  const updateTransaction = usePageDataStore((state) => state.updateTransaction);
  const removeTransaction = usePageDataStore((state) => state.removeTransaction);

  const isEditMode = !!editId;
  const title = isEditMode ? t('title.edit') : t('title.create');
  const description = isEditMode ? t('description.edit') : t('description.create');

  // Permission checks
  const { shouldDisableUserField, defaultFormUserId, userFieldHelperText } = usePermissions({
    currentUser,
    selectedUserId,
  });
  const transactionSchema = useMemo(() => createTransactionSchema(t), [t]);

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    control,
    setValue,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      description: '',
      amount: '',
      type: 'expense',
      category: '',
      date: new Date().toISOString().split('T')[0],
      user_id: defaultFormUserId,
      account_id: '',
      to_account_id: '',
    },
  });

  const watchedUserId = useWatch({ control, name: 'user_id' });
  const watchedType = useWatch({ control, name: 'type' });
  const watchedAccountId = useWatch({ control, name: 'account_id' });
  const watchedToAccountId = useWatch({ control, name: 'to_account_id' });
  const watchedCategory = useWatch({ control, name: 'category' });
  const watchedAmount = useWatch({ control, name: 'amount' });
  const watchedDate = useWatch({ control, name: 'date' });

  // Filter accounts by selected user
  const filteredAccounts = useMemo(() => {
    if (!watchedUserId) return accounts;
    return accounts.filter((acc) => acc.user_ids.includes(watchedUserId));
  }, [accounts, watchedUserId]);

  const previousUserIdRef = useRef<string | null>(null);

  // Get default account for selected user
  const getDefaultAccountId = useCallback(
    (userId: string): string => {
      if (!userId) return accounts.length > 0 ? accounts[0].id : '';

      // Find user and use their default account
      const user = groupUsers.find((u) => u.id === userId);
      if (user?.default_account_id) {
        // Verify the default account is accessible to this user
        const defaultAccount = accounts.find(
          (acc) => acc.id === user.default_account_id && acc.user_ids.includes(userId)
        );
        if (defaultAccount) return defaultAccount.id;
      }

      // Fall back to first account accessible to this user
      const userAccounts = accounts.filter((acc) => acc.user_ids.includes(userId));
      if (userAccounts.length > 0) return userAccounts[0].id;
      return accounts.length > 0 ? accounts[0].id : '';
    },
    [accounts, groupUsers]
  );

  // Load transaction data for edit mode
  useEffect(() => {
    if (isOpen && isEditMode && editId) {
      // Find transaction in store
      const transaction = storeTransactions.find((t) => t.id === editId);

      if (transaction) {
        // Handle date formatting (could be string or Date)
        const dateStr =
          typeof transaction.date === 'string'
            ? transaction.date.split('T')[0]
            : transaction.date.toISOString().split('T')[0];

        reset({
          description: transaction.description,
          amount: transaction.amount.toString(),
          type: transaction.type,
          category: transaction.category,
          date: dateStr,
          user_id: transaction.user_id || '',
          account_id: transaction.account_id,
          to_account_id: transaction.to_account_id || '',
        });
        previousUserIdRef.current = transaction.user_id || '';
      }
    } else if (isOpen && !isEditMode) {
      // Reset to defaults for create mode
      reset({
        description: '',
        amount: '',
        type: 'expense',
        category: '',
        date: new Date().toISOString().split('T')[0],
        user_id: defaultFormUserId,
        account_id: getDefaultAccountId(defaultFormUserId),
        to_account_id: '',
      });
      previousUserIdRef.current = defaultFormUserId;
    }
  }, [
    isOpen,
    isEditMode,
    editId,
    defaultFormUserId,
    reset,
    getDefaultAccountId,
    storeTransactions,
  ]);

  useEffect(() => {
    if (!isOpen) {
      previousUserIdRef.current = null;
    }
  }, [isOpen]);

  // Update account when user changes (create mode only)
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
        setValue('to_account_id', ''); // Clear transfer destination
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

  // Handle form submission with optimistic updates
  const { handleSubmit: submitHandler } = useTransactionSubmit({
    isEditMode,
    editId,
    groupId,
    storeTransactions,
    updateTransaction,
    addTransaction,
    removeTransaction,
    onClose,
    setError,
    messages: {
      notFound: t('errors.notFound'),
      unknownError: t('errors.unknown'),
    },
  });

  const onSubmit = async (data: TransactionFormData) => {
    await submitHandler(data);
  };

  // Type options
  const typeOptions = [
    { value: 'income', label: t('typeOptions.income') },
    { value: 'expense', label: t('typeOptions.expense') },
    { value: 'transfer', label: t('typeOptions.transfer') },
  ];

  // Filter available destination accounts (exclude source account and filter by user)
  const destinationAccounts = filteredAccounts.filter((acc) => acc.id !== watchedAccountId);

  return (
    <ModalWrapper
      isOpen={isOpen}
      onOpenChange={onClose}
      title={title}
      description={description}
      titleClassName={transactionStyles.modal.title}
      descriptionClassName={transactionStyles.modal.description}
      maxWidth="md"
      repositionInputs={false}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className={cn(transactionStyles.form.container, 'flex flex-col h-full')}
      >
        <ModalBody className={transactionStyles.modal.content}>
          {/* Submit Error Display */}
          {errors.root && (
            <div className={transactionStyles.form.error}>
              <p className={transactionStyles.form.errorText}>{errors.root.message}</p>
            </div>
          )}

          <ModalSection>
            <div className={transactionStyles.form.grid}>
              {/* User */}
              <UserField
                value={watchedUserId}
                onChange={(value) => setValue('user_id', value)}
                error={errors.user_id?.message}
                users={groupUsers}
                label={t('fields.user.label')}
                placeholder={t('fields.user.placeholder')}
                disabled={shouldDisableUserField}
                helperText={
                  shouldDisableUserField ? t('fields.user.memberHelper') : userFieldHelperText
                }
              />

              {/* Type */}
              <FormField label={t('fields.type.label')} required error={errors.type?.message}>
                <FormSelect
                  value={watchedType}
                  onValueChange={(value) => setValue('type', value as TransactionType)}
                  options={typeOptions}
                  placeholder={t('fields.type.placeholder')}
                />
              </FormField>

              {/* Source Account */}
              <AccountField
                value={watchedAccountId}
                onChange={(value) => setValue('account_id', value)}
                error={errors.account_id?.message}
                accounts={filteredAccounts}
                label={t('fields.sourceAccount.label')}
                placeholder={t('fields.sourceAccount.placeholder')}
                required
              />

              {/* Destination Account (only for transfers) */}
              {watchedType === 'transfer' && (
                <AccountField
                  value={watchedToAccountId || ''}
                  onChange={(value) => setValue('to_account_id', value)}
                  error={errors.to_account_id?.message}
                  accounts={destinationAccounts}
                  label={t('fields.destinationAccount.label')}
                  placeholder={t('fields.destinationAccount.placeholder')}
                  required
                />
              )}

              {/* Category */}
              <CategoryField
                value={watchedCategory}
                onChange={(value) => setValue('category', value)}
                error={errors.category?.message}
                categories={categories}
                label={t('fields.category.label')}
                placeholder={t('fields.category.placeholder')}
                required
              />

              {/* Amount */}
              <AmountField
                value={watchedAmount}
                onChange={(value) => setValue('amount', value)}
                error={errors.amount?.message}
                label={t('fields.amount.label')}
                placeholder={t('fields.amount.placeholder')}
                required
              />

              {/* Date */}
              <DateField
                value={watchedDate}
                onChange={(value) => setValue('date', value)}
                error={errors.date?.message}
                label={t('fields.date.label')}
                required
              />
            </div>
          </ModalSection>

          <ModalSection>
            {/* Description */}
            <FormField
              label={t('fields.description.label')}
              required
              error={errors.description?.message}
            >
              <Input
                {...register('description')}
                placeholder={t('fields.description.placeholder')}
                disabled={isSubmitting}
              />
            </FormField>
          </ModalSection>
        </ModalBody>

        <ModalFooter>
          <FormActions
            submitType="submit"
            submitLabel={isEditMode ? t('buttons.update') : t('buttons.create')}
            cancelLabel={t('buttons.cancel')}
            onCancel={onClose}
            isSubmitting={isSubmitting}
            className="w-full sm:w-auto"
          />
        </ModalFooter>
      </form>
    </ModalWrapper>
  );
}

// Default export for lazy loading
export default TransactionFormModal;
