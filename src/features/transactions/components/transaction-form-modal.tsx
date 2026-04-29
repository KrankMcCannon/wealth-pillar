'use client';

import { useEffect, useMemo, useCallback, useRef } from 'react';
import { useForm, useWatch, Controller } from 'react-hook-form';
import { ArrowLeftRight, Check, Trash2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslations } from 'next-intl';
import { TransactionType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useTransactionSubmit } from '../hooks/useTransactionSubmit';
import { ModalWrapper } from '@/components/ui/modal-wrapper';
import { FormSelect, FormCurrencyInput } from '@/components/form';
import { UserField, AccountField, CategoryField, DateField } from '@/components/ui/fields';
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
import { requestTransactionDelete } from '../transaction-delete-bridge';
import { stitchTransactionFormModal } from '@/styles/home-design-foundation';

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
  const currentUser = useRequiredCurrentUser();
  const groupUsers = useRequiredGroupUsers();
  const accounts = useAccounts();
  const categories = useCategories();
  const groupId = useRequiredGroupId();
  const selectedUserId = useUserFilterStore((state) => state.selectedUserId);

  const storeTransactions = usePageDataStore((state) => state.transactions);
  const addTransaction = usePageDataStore((state) => state.addTransaction);
  const updateTransaction = usePageDataStore((state) => state.updateTransaction);
  const removeTransaction = usePageDataStore((state) => state.removeTransaction);

  const isEditMode = !!editId;
  const title = isEditMode ? t('title.edit') : t('title.create');

  const { shouldDisableUserField, defaultFormUserId, userFieldHelperText } = usePermissions({
    currentUser,
    selectedUserId,
  });
  const transactionSchema = useMemo(() => createTransactionSchema(t), [t]);

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
      date: new Date().toISOString().split('T')[0] as string,
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
  const watchedDate = useWatch({ control, name: 'date' });

  const filteredAccounts = useMemo(() => {
    if (!watchedUserId) return accounts;
    return accounts.filter((acc) => acc.user_ids.includes(watchedUserId));
  }, [accounts, watchedUserId]);

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
    if (isOpen && isEditMode && editId) {
      const transaction = storeTransactions.find((tx) => tx.id === editId);

      if (transaction) {
        const dateStr =
          typeof transaction.date === 'string'
            ? transaction.date.split('T')[0]
            : transaction.date.toISOString().split('T')[0];

        reset({
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
      }
    } else if (isOpen && !isEditMode) {
      reset({
        description: '',
        amount: '',
        type: 'expense',
        category: '',
        date: new Date().toISOString().split('T')[0] as string,
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

  const typeOptions = [
    { value: 'income', label: t('typeOptions.income') },
    { value: 'expense', label: t('typeOptions.expense') },
    { value: 'transfer', label: t('typeOptions.transfer') },
  ];

  const destinationAccounts = filteredAccounts.filter((acc) => acc.id !== watchedAccountId);

  const s = stitchTransactionFormModal;

  return (
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
      <form
        onSubmit={handleSubmit((data: TransactionFormData) => onSubmit(data))}
        className={s.formColumn}
      >
        <div className={s.scrollBody}>
          {errors.root ? (
            <div className={s.errorBanner} role="alert">
              {errors.root.message}
            </div>
          ) : null}

          <section className={cn(s.amountSection, 'group/amount')} aria-labelledby="tx-amount-label">
            <p id="tx-amount-label" className={s.amountEyebrow}>
              {t('fields.amount.label')}
            </p>
            <div className={s.amountRow}>
              <span className={s.amountCurrency} aria-hidden>
                €
              </span>
              <Controller
                name="amount"
                control={control}
                render={({ field }) => (
                  <FormCurrencyInput
                    value={field.value}
                    onChange={(v) => field.onChange(v)}
                    placeholder={t('fields.amount.placeholder')}
                    disabled={isSubmitting}
                    className={s.amountInput}
                    showSymbol={false}
                  />
                )}
              />
            </div>
            <div className={s.amountTrack} aria-hidden>
              <div className={s.amountTrackFill} />
            </div>
            {errors.amount ? <p className={s.fieldError}>{errors.amount.message}</p> : null}
          </section>

          <div className={s.fieldStack}>
            <CategoryField
              value={watchedCategory}
              onChange={(value) => setValue('category', value)}
              error={errors.category?.message}
              categories={categories}
              label={t('fields.category.label')}
              placeholder={t('fields.category.placeholder')}
            />
            <AccountField
              value={watchedAccountId}
              onChange={(value) => setValue('account_id', value)}
              error={errors.account_id?.message}
              accounts={filteredAccounts}
              label={t('fields.sourceAccount.label')}
              placeholder={t('fields.sourceAccount.placeholder')}
              required
            />
            <DateField
              value={watchedDate}
              onChange={(value) => setValue('date', value)}
              error={errors.date?.message}
              label={t('fields.date.label')}
              required
            />
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
            <div className="space-y-1">
              <FormSelect
                value={watchedType}
                onValueChange={(value) => setValue('type', value as TransactionType)}
                options={typeOptions}
                placeholder={t('fields.type.placeholder')}
                disabled={isSubmitting}
                captionLabel={t('fields.type.label')}
                leadingIcon={<ArrowLeftRight className="h-5 w-5 text-[#b8c5ff]" aria-hidden />}
              />
              {errors.type ? <p className={s.fieldError}>{errors.type.message}</p> : null}
            </div>
            {watchedType === 'transfer' ? (
              <AccountField
                value={watchedToAccountId || ''}
                onChange={(value) => setValue('to_account_id', value)}
                error={errors.to_account_id?.message}
                accounts={destinationAccounts}
                label={t('fields.destinationAccount.label')}
                placeholder={t('fields.destinationAccount.placeholder')}
                required
              />
            ) : null}

            <div className={s.noteShell}>
              <label htmlFor="tx-description" className={s.noteLabel}>
                {t('fields.description.label')}
              </label>
              <Input
                id="tx-description"
                {...register('description')}
                placeholder={t('fields.description.placeholder')}
                disabled={isSubmitting}
                className={s.noteInput}
                autoComplete="off"
              />
              {errors.description ? (
                <p className={cn(s.fieldError, 'mt-2')}>{errors.description.message}</p>
              ) : null}
            </div>
          </div>
        </div>

        <div className={s.stickyFooter}>
          <div className={s.footerActionsStack}>
            <button type="submit" disabled={isSubmitting} className={s.primaryCta}>
              <Check className="h-5 w-5 shrink-0" aria-hidden />
              {isEditMode ? t('buttons.saveTransaction') : t('buttons.create')}
            </button>
            {isEditMode && editId ? (
              <button
                type="button"
                data-testid="transaction-form-delete"
                onClick={() => {
                  requestTransactionDelete(editId);
                  onClose();
                }}
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
  );
}

export default TransactionFormModal;
