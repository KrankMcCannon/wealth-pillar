'use client';

import type { UseFormReturn } from 'react-hook-form';
import type { useTranslations } from 'next-intl';
import type { Account, Category, User } from '@/lib/types';
import {
  ModalCategoryField,
  ModalDateField,
  ModalMultiSelectField,
  ModalSelectField,
  ModalTextField,
} from '@/components/form';
import { toSelectOptions, sortSelectOptions } from '@/components/form/form-select';
import { RecurrencePicker } from './recurrence-picker';
import type { RecurringFormData } from './recurring-form-schema';

export interface RecurringFormFieldsProps {
  form: UseFormReturn<RecurringFormData>;
  categories: Category[];
  filteredAccounts: Account[];
  groupUsers: User[];
  currentUserId: string;
  t: ReturnType<typeof useTranslations<'Recurring.FormModal'>>;
  isSubmitting: boolean;
}

export function RecurringFormFields({
  form,
  categories,
  filteredAccounts,
  groupUsers,
  currentUserId,
  t,
  isSubmitting,
}: RecurringFormFieldsProps) {
  const { control } = form;

  const accountOptions = sortSelectOptions(
    toSelectOptions(
      filteredAccounts,
      (a) => a.id,
      (a) => a.name
    )
  );

  return (
    <>
      <ModalTextField
        control={control}
        name="description"
        label={t('fields.description.label')}
        placeholder={t('fields.description.placeholder')}
        disabled={isSubmitting}
      />

      <ModalSelectField
        control={control}
        name="type"
        label={t('fields.type.label')}
        options={[
          { value: 'expense', label: t('typeOptions.expense') },
          { value: 'income', label: t('typeOptions.income') },
        ]}
        disabled={isSubmitting}
      />

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
        label={t('fields.account.label')}
        options={accountOptions}
        placeholder={t('fields.account.placeholder')}
        disabled={isSubmitting}
      />

      <ModalDateField
        control={control}
        name="start_date"
        label={t('fields.startDate.label')}
        required
      />

      <ModalDateField control={control} name="end_date" label={t('fields.endDate.label')} />

      <ModalMultiSelectField
        control={control}
        name="user_ids"
        label={t('fields.users.label')}
        options={groupUsers.map((u) => ({ value: u.id, label: u.name ?? '' }))}
        shape="rows"
        users={groupUsers}
        currentUserId={currentUserId}
        disabled={isSubmitting}
      />

      <RecurrencePicker form={form} t={t} isSubmitting={isSubmitting} />
    </>
  );
}
