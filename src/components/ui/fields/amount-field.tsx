/**
 * AmountField - Reusable currency input field
 */

'use client';

import { useTranslations } from 'next-intl';
import { FormField, FormCurrencyInput } from '@/components/form';

interface AmountFieldProps {
  value: string | number;
  onChange: (value: string) => void;
  error?: string;
  required?: boolean;
  label?: string;
  placeholder?: string;
  min?: number;
}

export function AmountField({
  value,
  onChange,
  error,
  required = true,
  label,
  placeholder,
  min = 0,
}: Readonly<AmountFieldProps>) {
  const t = useTranslations('Forms.Fields.Amount');
  const resolvedLabel = label ?? t('label');

  return (
    <FormField label={resolvedLabel} required={required} error={error}>
      <FormCurrencyInput value={value} onChange={onChange} min={min} placeholder={placeholder} />
    </FormField>
  );
}
