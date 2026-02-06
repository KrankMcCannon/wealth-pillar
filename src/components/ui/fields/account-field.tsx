/**
 * AccountField - Reusable account selector field
 */

'use client';

import { useTranslations } from 'next-intl';
import { FormField, FormSelect } from '@/components/form';
import type { Account } from '@/lib/types';

interface AccountFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
  placeholder?: string;
  accounts?: Account[];
  userId?: string; // Optional user filter
}

export function AccountField({
  value,
  onChange,
  error,
  required = true,
  label,
  placeholder,
  accounts = [],
  userId,
}: Readonly<AccountFieldProps>) {
  const t = useTranslations('Forms.Fields.Account');
  const resolvedLabel = label ?? t('label');
  const resolvedPlaceholder = placeholder ?? t('placeholder');

  // Filter accounts by user if userId is provided
  const filteredAccounts = userId
    ? accounts.filter((acc) => acc.user_ids.includes(userId))
    : accounts;

  const options = filteredAccounts.map((account) => ({
    value: account.id,
    label: account.name,
  }));

  return (
    <FormField label={resolvedLabel} required={required} error={error}>
      <FormSelect
        value={value}
        onValueChange={onChange}
        options={options}
        placeholder={resolvedPlaceholder}
      />
    </FormField>
  );
}
