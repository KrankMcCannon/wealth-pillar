'use client';

import { useEffect, useRef } from 'react';
import type { UseFormReturn } from 'react-hook-form';
import { useTranslations } from 'next-intl';
import type { User, AccountLiquidity, AccountType } from '@/lib/types';
import { defaultLiquidityForType } from '@/lib/utils/account-classification';
import {
  ModalCheckboxField,
  ModalMultiSelectField,
  ModalSelectField,
  ModalTextField,
  formModalStyles as s,
} from '@/components/form';

export type AccountFormData = {
  name: string;
  type: AccountType;
  liquidity: AccountLiquidity;
  user_ids: string[];
  isDefault: boolean;
};

interface AccountFormFieldsProps {
  form: UseFormReturn<AccountFormData>;
  groupUsers: User[];
  currentUserId: string;
  shouldDisableUserField: boolean;
  isSubmitting: boolean;
}

export function AccountFormFields({
  form,
  groupUsers,
  currentUserId,
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
      />

      <ModalSelectField
        control={control}
        name="liquidity"
        label={t('fields.liquidity.label')}
        options={[...liquidityOptions]}
        placeholder={t('fields.liquidity.placeholder')}
        disabled={isSubmitting}
      />

      <ModalMultiSelectField
        control={control}
        name="user_ids"
        label={t('fields.owner.label')}
        options={groupUsers.map((u) => ({ value: u.id, label: u.name ?? '' }))}
        shape="rows"
        users={groupUsers}
        currentUserId={currentUserId}
        disabled={shouldDisableUserField || isSubmitting}
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
