/**
 * UserField - Reusable user selector field
 */

'use client';

import { useTranslations } from 'next-intl';
import { FormField, FormSelect } from '@/components/form';
import type { User } from '@/lib/types';

interface UserFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
  placeholder?: string;
  users?: User[];
  disabled?: boolean;
  helperText?: string;
}

export function UserField({
  value,
  onChange,
  error,
  required = true,
  label,
  placeholder,
  users = [],
  disabled = false,
  helperText,
}: Readonly<UserFieldProps>) {
  const t = useTranslations('Forms.Fields.User');
  const resolvedLabel = label ?? t('label');
  const resolvedPlaceholder = placeholder ?? t('placeholder');

  const options = users.map((user) => ({
    value: user.id,
    label: user.name,
  }));

  return (
    <FormField label={resolvedLabel} required={required} error={error} helperText={helperText}>
      <FormSelect
        value={value}
        onValueChange={onChange}
        options={options}
        placeholder={resolvedPlaceholder}
        disabled={disabled}
      />
    </FormField>
  );
}
