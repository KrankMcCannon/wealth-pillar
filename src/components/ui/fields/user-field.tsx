/**
 * UserField - Reusable user selector field
 */

'use client';

import { useTranslations } from 'next-intl';
import { UserRound } from 'lucide-react';
import { FormSelect } from '@/components/form';
import type { User } from '@/lib/types';

interface UserFieldProps {
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  required?: boolean | undefined;
  label?: string | undefined;
  placeholder?: string | undefined;
  users?: User[] | undefined;
  disabled?: boolean | undefined;
  helperText?: string | undefined;
}

export function UserField({
  value,
  onChange,
  error,
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
    label: user.name ?? '',
  }));

  return (
    <div className="space-y-1">
      <FormSelect
        value={value}
        onValueChange={onChange}
        options={options}
        placeholder={resolvedPlaceholder}
        disabled={disabled}
        captionLabel={resolvedLabel}
        leadingIcon={<UserRound className="h-5 w-5 text-[#b8c5ff]" aria-hidden />}
      />
      {helperText ? <p className="px-1 text-[11px] text-[#9fb0d7]/90">{helperText}</p> : null}
      {error ? <p className="px-1 text-xs text-red-300">{error}</p> : null}
    </div>
  );
}
