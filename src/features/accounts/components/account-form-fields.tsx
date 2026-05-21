'use client';

import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Landmark } from 'lucide-react';
import type { User } from '@/lib/types';
import { cn } from '@/lib/utils';
import { ModalSelectField, ModalTextField, formModalStyles as s } from '@/components/form';
import { sortSelectOptions } from '@/components/form/form-select';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui';

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
  const { control, setValue, watch } = form;

  const watchedIsDefault = watch('isDefault');

  const accountTypes = [
    { value: 'payroll', label: t('accountTypes.payroll') },
    { value: 'cash', label: t('accountTypes.cash') },
    { value: 'investments', label: t('accountTypes.investments') },
    { value: 'savings', label: t('accountTypes.savings') },
  ] as const;

  const userOptions = sortSelectOptions(
    groupUsers.map((u) => ({ value: u.id, label: u.name ?? '' }))
  );

  return (
    <div className={s.fieldStack}>
      <ModalTextField
        control={control}
        name="name"
        label={t('fields.name.label')}
        placeholder={t('fields.name.placeholder')}
        disabled={isSubmitting}
      />

      <ModalSelectField
        control={control}
        name="type"
        label={t('fields.type.label')}
        options={[...accountTypes]}
        placeholder={t('fields.type.placeholder')}
        disabled={isSubmitting}
        leadingIcon={<Landmark className="h-5 w-5 text-[#b8c5ff]" aria-hidden />}
      />

      <ModalSelectField
        control={control}
        name="user_id"
        label={t('fields.owner.label')}
        options={userOptions}
        placeholder={t('fields.owner.placeholder')}
        disabled={shouldDisableUserField || isSubmitting}
        {...(shouldDisableUserField ? { hint: t('fields.owner.memberHelper') } : {})}
      />

      <div className={cn(s.noteShell, 'flex flex-row items-center gap-3 py-3')}>
        <Checkbox
          id="isDefault"
          checked={watchedIsDefault ?? false}
          onCheckedChange={(checked) => setValue('isDefault', checked as boolean)}
          disabled={isSubmitting}
        />
        <Label htmlFor="isDefault" className="text-sm font-medium leading-snug text-modal-fg">
          {t('fields.isDefault')}
        </Label>
      </div>
    </div>
  );
}
