'use client';

import { Controller, type UseFormReturn } from 'react-hook-form';
import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { PieChart } from 'lucide-react';
import type { BudgetType, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { FormCurrencyInput, FormField, FormSelect } from '@/components/form';
import { Input, UserField } from '@/components/ui';
import { stitchBudgetFormModal } from '@/styles/home-design-foundation';
import { BudgetCategoryPicker } from './budget-category-picker';

export type BudgetFormData = {
  description: string;
  amount: string;
  type: BudgetType;
  icon?: string | null | undefined;
  categories: string[];
  user_id: string;
  categorySearch?: string | undefined;
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
  onToggleCategory: (categoryId: string) => void;
  onSelectAllCategories: () => void;
  onClearCategories: () => void;
}

export function BudgetFormFields({
  form,
  groupUsers,
  categoryOptions,
  shouldDisableUserField,
  userFieldHelperText,
  isSubmitting,
  onToggleCategory,
  onSelectAllCategories,
  onClearCategories,
}: BudgetFormFieldsProps) {
  const t = useTranslations('Budgets.FormModal');
  const s = stitchBudgetFormModal;
  const {
    register,
    control,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const watchedType = watch('type');
  const watchedCategories = watch('categories');
  const watchedUserId = watch('user_id');
  const categorySearch = watch('categorySearch') || '';

  const typeOptions = useMemo(
    () => [
      { value: 'monthly', label: t('fields.type.options.monthly') },
      { value: 'annually', label: t('fields.type.options.annually') },
    ],
    [t]
  );

  return (
    <>
      <section
        className={cn(s.amountSection, 'group/amount')}
        aria-labelledby="budget-amount-label"
      >
        <p id="budget-amount-label" className={s.amountEyebrow}>
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
        {errors.amount?.message ? <p className={s.fieldError}>{errors.amount.message}</p> : null}
      </section>

      <div className={s.gridTwoCol}>
        <UserField
          value={watchedUserId}
          onChange={(value) => setValue('user_id', value)}
          error={errors.user_id?.message}
          users={groupUsers}
          label={t('fields.user.label')}
          placeholder={t('fields.user.placeholder')}
          disabled={shouldDisableUserField}
          helperText={userFieldHelperText}
          required
        />

        <div className="space-y-1">
          <FormSelect
            value={watchedType}
            onValueChange={(value) => setValue('type', value as BudgetType)}
            options={typeOptions}
            captionLabel={t('fields.type.label')}
            leadingIcon={<PieChart className="h-5 w-5 text-[#b8c5ff]" aria-hidden />}
          />
          {errors.type?.message ? <p className={s.fieldError}>{errors.type.message}</p> : null}
        </div>
      </div>

      <div className={s.noteShell}>
        <label htmlFor="budget-description" className={s.noteLabel}>
          {t('fields.description.label')}
        </label>
        <Input
          id="budget-description"
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

      <FormField
        label={t('fields.categories.label')}
        required
        error={errors.categories?.message}
        className="space-y-2"
      >
        <BudgetCategoryPicker
          options={categoryOptions}
          selectedIds={watchedCategories}
          searchValue={categorySearch}
          onSearchChange={(value) => setValue('categorySearch', value)}
          onToggleCategory={onToggleCategory}
          onSelectAll={onSelectAllCategories}
          onClearSelection={onClearCategories}
          disabled={isSubmitting}
        />
      </FormField>
    </>
  );
}
