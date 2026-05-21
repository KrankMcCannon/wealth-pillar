'use client';

import type { UseFormReturn } from 'react-hook-form';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { PieChart } from 'lucide-react';
import type { BudgetType, User } from '@/lib/types';
import {
  ModalAmountField,
  ModalMultiSelectField,
  ModalSelectField,
  ModalTextField,
  formModalStyles as s,
} from '@/components/form';
import { sortSelectOptions } from '@/components/form/form-select';

export type BudgetFormData = {
  description: string;
  amount: string;
  type: BudgetType;
  icon?: string | null | undefined;
  categories: string[];
  user_id: string;
};

export type BudgetCategoryOption = {
  value: string;
  label: string;
  color: string;
};

interface BudgetFormFieldsProps {
  form: UseFormReturn<BudgetFormData>;
  groupUsers: User[];
  categoryOptions: BudgetCategoryOption[];
  shouldDisableUserField: boolean;
  userFieldHelperText?: string | undefined;
  isSubmitting: boolean;
}

export function BudgetFormFields({
  form,
  groupUsers,
  categoryOptions,
  shouldDisableUserField,
  userFieldHelperText,
  isSubmitting,
}: BudgetFormFieldsProps) {
  const t = useTranslations('Budgets.FormModal');
  const { control } = form;

  const typeOptions = useMemo(
    () => [
      { value: 'monthly', label: t('fields.type.options.monthly') },
      { value: 'annually', label: t('fields.type.options.annually') },
    ],
    [t]
  );

  const userOptions = useMemo(
    () => sortSelectOptions(groupUsers.map((u) => ({ value: u.id, label: u.name ?? '' }))),
    [groupUsers]
  );

  const chipOptions = useMemo(
    () =>
      categoryOptions.map((o) => ({
        value: o.value,
        label: o.label,
        color: o.color,
      })),
    [categoryOptions]
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
        <ModalSelectField
          control={control}
          name="user_id"
          label={t('fields.user.label')}
          options={userOptions}
          placeholder={t('fields.user.placeholder')}
          disabled={shouldDisableUserField || isSubmitting}
          {...(userFieldHelperText !== undefined ? { hint: userFieldHelperText } : {})}
        />

        <ModalSelectField
          control={control}
          name="type"
          label={t('fields.type.label')}
          options={typeOptions}
          disabled={isSubmitting}
          leadingIcon={<PieChart className="h-5 w-5 text-[#b8c5ff]" aria-hidden />}
        />
      </div>

      <ModalTextField
        control={control}
        name="description"
        label={t('fields.description.label')}
        placeholder={t('fields.description.placeholder')}
        disabled={isSubmitting}
      />

      <ModalMultiSelectField
        control={control}
        name="categories"
        label={t('fields.categories.label')}
        options={chipOptions}
        shape="chips"
        disabled={isSubmitting}
      />
    </>
  );
}
