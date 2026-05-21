'use client';

import type { UseFormReturn } from 'react-hook-form';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { ArrowLeftRight } from 'lucide-react';
import type { Account, Category, TransactionType, User } from '@/lib/types';
import {
  ModalAmountField,
  ModalCategoryField,
  ModalDateField,
  ModalSelectField,
  ModalTextField,
  formModalStyles as s,
} from '@/components/form';
import { toSelectOptions, sortSelectOptions } from '@/components/form/form-select';

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
  const { control, watch } = form;
  const watchedType = watch('type');

  const typeOptions = useMemo(
    () => [
      { value: 'income', label: t('typeOptions.income') },
      { value: 'expense', label: t('typeOptions.expense') },
      { value: 'transfer', label: t('typeOptions.transfer') },
    ],
    [t]
  );

  const accountOptions = useMemo(
    () =>
      sortSelectOptions(
        toSelectOptions(
          filteredAccounts,
          (a) => a.id,
          (a) => a.name
        )
      ),
    [filteredAccounts]
  );

  const destinationOptions = useMemo(
    () =>
      sortSelectOptions(
        toSelectOptions(
          destinationAccounts,
          (a) => a.id,
          (a) => a.name
        )
      ),
    [destinationAccounts]
  );

  const userOptions = useMemo(
    () => sortSelectOptions(groupUsers.map((u) => ({ value: u.id, label: u.name ?? '' }))),
    [groupUsers]
  );

  return (
    <>
      <ModalAmountField
        control={control}
        name="amount"
        label={t('fields.amount.label')}
        disabled={isSubmitting}
        placeholder={t('fields.amount.placeholder')}
      />

      <div className={s.fieldStack}>
        <ModalCategoryField
          control={control}
          name="category"
          categories={categories}
          label={t('fields.category.label')}
          placeholder={t('fields.category.placeholder')}
          disabled={isSubmitting}
        />

        <ModalSelectField
          control={control}
          name="account_id"
          label={t('fields.sourceAccount.label')}
          options={accountOptions}
          placeholder={t('fields.sourceAccount.placeholder')}
          disabled={isSubmitting}
        />

        <ModalDateField control={control} name="date" label={t('fields.date.label')} required />

        <ModalSelectField
          control={control}
          name="user_id"
          label={t('fields.user.label')}
          options={userOptions}
          placeholder={t('fields.user.placeholder')}
          disabled={shouldDisableUserField || isSubmitting}
          {...(shouldDisableUserField
            ? { hint: t('fields.user.memberHelper') }
            : userFieldHelperText !== undefined
              ? { hint: userFieldHelperText }
              : {})}
        />

        <ModalSelectField
          control={control}
          name="type"
          label={t('fields.type.label')}
          options={typeOptions}
          placeholder={t('fields.type.placeholder')}
          disabled={isSubmitting}
          leadingIcon={<ArrowLeftRight className="h-5 w-5 text-[#b8c5ff]" aria-hidden />}
        />

        {watchedType === 'transfer' ? (
          <ModalSelectField
            control={control}
            name="to_account_id"
            label={t('fields.destinationAccount.label')}
            options={destinationOptions}
            placeholder={t('fields.destinationAccount.placeholder')}
            disabled={isSubmitting}
          />
        ) : null}

        <ModalTextField
          control={control}
          name="description"
          label={t('fields.description.label')}
          placeholder={t('fields.description.placeholder')}
          disabled={isSubmitting}
        />
      </div>
    </>
  );
}
