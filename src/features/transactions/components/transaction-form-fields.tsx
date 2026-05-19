'use client';

import { Controller, type UseFormReturn } from 'react-hook-form';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeftRight } from 'lucide-react';
import type { Account, Category, TransactionType, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { FormSelect, FormCurrencyInput } from '@/components/form';
import { UserField, AccountField, CategoryField, DateField } from '@/components/ui/fields';
import { Input } from '@/components/ui/input';
import { stitchTransactionFormModal } from '@/styles/home-design-foundation';

export type TransactionFormData = {
  description: string;
  amount: string;
  type: TransactionType;
  category: string;
  date: string;
  user_id: string;
  account_id: string;
  to_account_id?: string | undefined;
};

interface TransactionFormFieldsProps {
  form: UseFormReturn<TransactionFormData>;
  groupUsers: User[];
  categories: Category[];
  filteredAccounts: Account[];
  destinationAccounts: Account[];
  shouldDisableUserField: boolean;
  userFieldHelperText?: string | undefined;
  isSubmitting: boolean;
}

export function TransactionFormFields({
  form,
  groupUsers,
  categories,
  filteredAccounts,
  destinationAccounts,
  shouldDisableUserField,
  userFieldHelperText,
  isSubmitting,
}: TransactionFormFieldsProps) {
  const t = useTranslations('Transactions.FormModal');
  const s = stitchTransactionFormModal;
  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const watchedUserId = watch('user_id');
  const watchedType = watch('type');
  const watchedAccountId = watch('account_id');
  const watchedToAccountId = watch('to_account_id');
  const watchedCategory = watch('category');
  const watchedDate = watch('date');

  const typeOptions = useMemo(
    () => [
      { value: 'income', label: t('typeOptions.income') },
      { value: 'expense', label: t('typeOptions.expense') },
      { value: 'transfer', label: t('typeOptions.transfer') },
    ],
    [t]
  );

  return (
    <>
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
          helperText={shouldDisableUserField ? t('fields.user.memberHelper') : userFieldHelperText}
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
    </>
  );
}
