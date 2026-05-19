'use client';

import type { useTranslations } from 'next-intl';
import type { FieldErrors, UseFormRegister, UseFormSetValue } from 'react-hook-form';

import { MultiUserSelect } from '@/components/form';
import { AccountField, CategoryField, DateField, Input } from '@/components/ui';
import { cn } from '@/lib/utils';

import type { Account, Category } from '@/lib/types';

import type { RecurringFormData } from './recurring-form-schema';

type Stitch = typeof import('@/styles/home-design-foundation').stitchTransactionFormModal;

export interface RecurringFormFieldsProps {
  watchedCategory: string;
  watchedAccountId: string;
  watchedStartDate: string;
  watchedEndDate: string | undefined;
  watchedUserIds: string[];
  setValue: UseFormSetValue<RecurringFormData>;
  errors: FieldErrors<RecurringFormData>;
  categories: Category[];
  filteredAccounts: Account[];
  groupUsers: Parameters<typeof MultiUserSelect>[0]['users'];
  currentUserId: string;
  t: ReturnType<typeof useTranslations<'Recurring.FormModal'>>;
  s: Stitch;
}

export function RecurringFormFields({
  watchedCategory,
  watchedAccountId,
  watchedStartDate,
  watchedEndDate,
  watchedUserIds,
  setValue,
  errors,
  categories,
  filteredAccounts,
  groupUsers,
  currentUserId,
  t,
  s,
}: RecurringFormFieldsProps) {
  return (
    <>
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
        label={t('fields.account.label')}
        placeholder={t('fields.account.placeholder')}
        required
      />

      <DateField
        label={t('fields.startDate.label')}
        value={watchedStartDate}
        onChange={(value) => setValue('start_date', value)}
        error={errors.start_date?.message}
        required
      />

      <DateField
        label={t('fields.endDate.label')}
        value={watchedEndDate || ''}
        onChange={(value) => setValue('end_date', value)}
        error={errors.end_date?.message}
      />

      <div className="space-y-1">
        <p className={s.noteLabel}>{t('fields.users.label')}</p>
        <MultiUserSelect
          value={watchedUserIds}
          onChange={(value) => setValue('user_ids', value)}
          users={groupUsers}
          currentUserId={currentUserId}
        />
        {errors.user_ids?.message ? (
          <p className={s.fieldError}>{errors.user_ids.message}</p>
        ) : null}
      </div>
    </>
  );
}

export interface RecurringDescriptionFieldProps {
  register: UseFormRegister<RecurringFormData>;
  errors: FieldErrors<RecurringFormData>;
  t: ReturnType<typeof useTranslations<'Recurring.FormModal'>>;
  s: Stitch;
  isSubmitting: boolean;
}

export function RecurringDescriptionField({
  register,
  errors,
  t,
  s,
  isSubmitting,
}: RecurringDescriptionFieldProps) {
  return (
    <div className={s.noteShell}>
      <label htmlFor="recurring-description" className={s.noteLabel}>
        {t('fields.description.label')}
      </label>
      <Input
        id="recurring-description"
        {...register('description')}
        placeholder={t('fields.description.placeholder')}
        disabled={isSubmitting}
        className={s.noteInput}
        autoComplete="off"
      />
      {errors.description?.message ? (
        <p className={cn(s.fieldError, 'mt-2')}>{errors.description.message}</p>
      ) : null}
    </div>
  );
}
