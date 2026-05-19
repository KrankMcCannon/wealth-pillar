'use client';

import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Landmark } from 'lucide-react';
import type { Account, User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { FormSelect } from '@/components/form';
import { UserField } from '@/components/ui/fields';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui';
import { stitchTransactionFormModal } from '@/styles/home-design-foundation';

export type AccountFormData = {
  name: string;
  type: 'payroll' | 'cash' | 'investments' | 'savings';
  user_id: string;
  isDefault?: boolean | undefined;
};

interface AccountFormFieldsProps {
  form: UseFormReturn<AccountFormData>;
  groupUsers: User[];
  shouldDisableUserField: boolean;
  isSubmitting: boolean;
}

export function AccountFormFields({
  form,
  groupUsers,
  shouldDisableUserField,
  isSubmitting,
}: AccountFormFieldsProps) {
  const t = useTranslations('Accounts.FormModal');
  const s = stitchTransactionFormModal;
  const {
    register,
    setValue,
    watch,
    formState: { errors },
  } = form;

  const watchedUserId = watch('user_id');
  const watchedIsDefault = watch('isDefault');
  const watchedType = watch('type');

  const accountTypes = [
    { value: 'payroll', label: t('accountTypes.payroll') },
    { value: 'cash', label: t('accountTypes.cash') },
    { value: 'investments', label: t('accountTypes.investments') },
    { value: 'savings', label: t('accountTypes.savings') },
  ];

  return (
    <div className={s.fieldStack}>
      <div className={s.noteShell}>
        <label htmlFor="account-name" className={s.noteLabel}>
          {t('fields.name.label')}
        </label>
        <Input
          id="account-name"
          {...register('name')}
          placeholder={t('fields.name.placeholder')}
          disabled={isSubmitting}
          className={s.noteInput}
          autoComplete="off"
        />
        {errors.name ? <p className={cn(s.fieldError, 'mt-2')}>{errors.name.message}</p> : null}
      </div>

      <div className="space-y-1">
        <FormSelect
          value={watchedType}
          onValueChange={(val) => setValue('type', val as Account['type'])}
          options={accountTypes}
          placeholder={t('fields.type.placeholder')}
          disabled={isSubmitting}
          captionLabel={t('fields.type.label')}
          leadingIcon={<Landmark className="h-5 w-5 text-[#b8c5ff]" aria-hidden />}
        />
        {errors.type?.message ? <p className={s.fieldError}>{errors.type.message}</p> : null}
      </div>

      <UserField
        value={watchedUserId}
        onChange={(val) => setValue('user_id', val)}
        error={errors.user_id?.message}
        users={groupUsers}
        label={t('fields.owner.label')}
        placeholder={t('fields.owner.placeholder')}
        disabled={shouldDisableUserField || isSubmitting}
        helperText={shouldDisableUserField ? t('fields.owner.memberHelper') : undefined}
        required
      />

      <div className={cn(s.noteShell, 'flex flex-row items-center gap-3 py-3')}>
        <Checkbox
          id="isDefault"
          checked={watchedIsDefault ?? false}
          onCheckedChange={(checked) => setValue('isDefault', checked as boolean)}
          disabled={isSubmitting}
        />
        <Label htmlFor="isDefault" className="text-sm font-medium leading-snug text-[#e6ecff]">
          {t('fields.isDefault')}
        </Label>
      </div>
    </div>
  );
}
