'use client';

import type { UseFormReturn } from 'react-hook-form';
import { useMemo } from 'react';
import { useWatch } from 'react-hook-form';
import { useLocale, useTranslations } from 'next-intl';
import { formatCurrencyLocale } from '@/lib/utils/currency-formatter';
import { parseDecimal } from '@/lib/utils/parse-decimal';
import type { Budget, BudgetType, User } from '@/lib/types';
import {
  ModalAmountField,
  ModalMultiSelectField,
  ModalRadioField,
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
  budgets?: Budget[];
  form: UseFormReturn<BudgetFormData>;
  groupUsers: User[];
  categoryOptions: BudgetCategoryOption[];
  shouldDisableUserField: boolean;
  userFieldHelperText?: string | undefined;
  isSubmitting: boolean;
}

export function BudgetFormFields({
  form,
  budgets = [],
  groupUsers,
  categoryOptions,
  shouldDisableUserField,
  isSubmitting,
}: BudgetFormFieldsProps) {
  const t = useTranslations('Budgets.FormModal');
  const { control } = form;
  const ux = useTranslations('Budgets.UX');
  const locale = useLocale();
  const [type, amount, userId, selected] = useWatch({
    control,
    name: ['type', 'amount', 'user_id', 'categories'],
  });
  const related = budgets.filter((b) => b.user_id === userId);
  const shared = related.filter((b) => b.categories.some((key) => selected.includes(key)));
  const yearlyAmount = parseDecimal(amount);

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
        label={type === 'annually' ? ux('annual') : t('fields.amount.label')}
        disabled={isSubmitting}
        placeholder={t('fields.amount.placeholder')}
      />

      {type === 'annually' && Number.isFinite(yearlyAmount) && yearlyAmount > 0 ? (
        <p className="px-4 text-sm" role="status">
          {ux('allocation', {
            annual: formatCurrencyLocale(yearlyAmount, locale),
            cycle: formatCurrencyLocale(yearlyAmount / 12, locale),
          })}
        </p>
      ) : null}
      <div className={s.fieldStack}>
        <ModalTextField
          control={control}
          name="description"
          label={t('fields.description.label')}
          placeholder={t('fields.description.placeholder')}
          disabled={isSubmitting}
        />

        <ModalRadioField
          control={control}
          name="type"
          label={t('fields.type.label')}
          options={typeOptions}
          variant="segments"
          disabled={isSubmitting}
        />

        <ModalMultiSelectField
          control={control}
          name="categories"
          label={t('fields.categories.label')}
          options={chipOptions.map((option) => {
            const names = related
              .filter((b) => b.categories.includes(option.value))
              .map((b) => b.description);
            return {
              ...option,
              label: names.length ? `${option.label} · ${names.join(', ')}` : option.label,
            };
          })}
          shape="chips"
          disabled={isSubmitting}
        />

        {shared.length ? (
          <p className="px-4 text-sm text-muted-foreground" role="status">
            {ux('shared', { names: shared.map((b) => b.description).join(', ') })}
          </p>
        ) : null}

        {userOptions.length > 1 && !shouldDisableUserField ? (
          userOptions.length <= 5 ? (
            <ModalRadioField
              control={control}
              name="user_id"
              label={t('fields.user.label')}
              options={userOptions}
              disabled={shouldDisableUserField || isSubmitting}
            />
          ) : (
            <ModalSelectField
              control={control}
              name="user_id"
              label={t('fields.user.label')}
              options={userOptions}
              placeholder={t('fields.user.placeholder')}
              disabled={shouldDisableUserField || isSubmitting}
            />
          )
        ) : null}
      </div>
    </>
  );
}
