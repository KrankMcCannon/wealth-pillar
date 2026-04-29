/**
 * AccountField - Reusable account selector field
 */

'use client';

import { useTranslations } from 'next-intl';
import { Landmark } from 'lucide-react';
import { FormSelect } from '@/components/form';
import type { Account } from '@/lib/types';

interface AccountFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  required?: boolean | undefined;
  label?: string | undefined;
  placeholder?: string | undefined;
  accounts?: Account[] | undefined;
  userId?: string | undefined;
}

export function AccountField({
  value,
  onChange,
  error,
  label,
  placeholder,
  accounts = [],
  userId,
}: Readonly<AccountFieldProps>) {
  const t = useTranslations('Forms.Fields.Account');
  const resolvedLabel = label ?? t('label');
  const resolvedPlaceholder = placeholder ?? t('placeholder');

  const filteredAccounts = userId
    ? accounts.filter((acc) => acc.user_ids.includes(userId))
    : accounts;

  const options = filteredAccounts.map((account) => ({
    value: account.id,
    label: account.name,
  }));

  return (
    <div className="space-y-1">
      <FormSelect
        value={value}
        onValueChange={onChange}
        options={options}
        placeholder={resolvedPlaceholder}
        captionLabel={resolvedLabel}
        leadingIcon={<Landmark className="h-5 w-5 text-[#b8c5ff]" aria-hidden />}
      />
      {error ? <p className="px-1 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
