'use client';

import { useEffect, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import { Landmark } from 'lucide-react';
import type { User, AccountLiquidity, AccountType } from '@/lib/types';
import { defaultLiquidityForType } from '@/lib/utils/account-classification';
import {
  ModalCheckboxField,
  ModalSelectField,
  ModalTextField,
  formModalStyles as s,
} from '@/components/form';
import { sortSelectOptions } from '@/components/form/form-select';

export type AccountFormData = {
  name: string;
  type: AccountType;
  liquidity: AccountLiquidity;
  user_id: string;
  isDefault: boolean;
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

  const watchedType = watch('type');

  const prevTypeRef = useRef(watchedType);
  useEffect(() => {
    if (prevTypeRef.current !== watchedType) {
      setValue('liquidity', defaultLiquidityForType(watchedType));
      prevTypeRef.current = watchedType;
    }
  }, [watchedType, setValue]);

  const accountTypes = [
    { value: 'payroll', label: t('accountTypes.payroll') },
    { value: 'cash', label: t('accountTypes.cash') },
    { value: 'investments', label: t('accountTypes.investments') },
    { value: 'savings', label: t('accountTypes.savings') },
  ] as const;

  const liquidityOptions = [
    { value: 'spendable', label: t('fields.liquidity.spendable') },
    { value: 'reserve', label: t('fields.liquidity.reserve') },
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
        leadingIcon={<Landmark className="h-5 w-5 text-primary" aria-hidden />}
      />

      <ModalSelectField
        control={control}
        name="liquidity"
        label={t('fields.liquidity.label')}
        options={[...liquidityOptions]}
        placeholder={t('fields.liquidity.placeholder')}
        disabled={isSubmitting}
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

      <ModalCheckboxField
        control={control}
        name="isDefault"
        label={t('fields.isDefault')}
        disabled={isSubmitting}
      />
    </div>
  );
}
